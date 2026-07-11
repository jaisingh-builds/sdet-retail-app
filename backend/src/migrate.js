import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import mysql from "mysql2/promise";
import pg from "pg";
import {
  databaseFailureMessage,
  databaseEnvironmentDiagnostics,
  optional,
  resolveDatabaseConfiguration,
  resolveDatabaseUrl,
  rootDir,
  required
} from "./config.js";
import { hashPassword } from "./passwords.js";

const { Client: PostgresClient } = pg;

const requiredTables = [
  "cart_items",
  "carts",
  "customers",
  "order_items",
  "orders",
  "products",
  "schema_migrations"
];

function parseDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const dialect = parsed.protocol === "mysql:"
    ? "mysql"
    : ["postgres:", "postgresql:"].includes(parsed.protocol) ? "postgresql" : null;
  if (!dialect) {
    throw new Error("DATABASE_URL must start with mysql://, postgres://, or postgresql://");
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!database || database.includes("\0")) {
    throw new Error("DATABASE_URL must contain a database name");
  }

  return {
    dialect,
    host: parsed.hostname,
    port: Number(parsed.port || (dialect === "mysql" ? 3306 : 5432)),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database
  };
}

function assertVerifiedDatabase(verification) {
  const missingTables = requiredTables.filter((table) => !verification.tables.includes(table));
  if (missingTables.length > 0) {
    throw new Error(`Migration verification failed; missing tables: ${missingTables.join(", ")}`);
  }
  if (verification.products !== 8 || verification.customers !== 3) {
    throw new Error(
      `Migration verification failed; expected customers=3 and products=8, found customers=${verification.customers} and products=${verification.products}`
    );
  }
}

async function ensureDatabase(connectionOptions) {
  const connection = await mysql.createConnection({
    host: connectionOptions.host,
    port: connectionOptions.port,
    user: connectionOptions.user,
    password: connectionOptions.password,
    connectTimeout: Number(optional("DB_CONNECTION_TIMEOUT_MS") || 10000)
  });
  const escapedDatabase = connectionOptions.database.replace(/`/g, "``");
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${escapedDatabase}\``);
  await connection.end();
}

async function readDatabaseDiagnostics(connection) {
  const [[server]] = await connection.query(`
    SELECT
      DATABASE() AS selectedDatabase,
      @@hostname AS serverHostname,
      @@port AS serverPort,
      @@version AS serverVersion,
      CURRENT_USER() AS authenticatedAs,
      USER() AS connectedAs
  `);
  const [tableRows] = await connection.query(`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
  `);
  const [migrationRows] = await connection.query(
    "SELECT version FROM schema_migrations ORDER BY version"
  );
  const [[counts]] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM products) AS products
  `);
  return {
    server,
    tables: tableRows.map((row) => row.tableName),
    migrations: migrationRows.map((row) => row.version),
    customers: Number(counts.customers),
    products: Number(counts.products)
  };
}

function printDatabaseDiagnostics({ configurationSource, options, diagnostics }) {
  const { server, tables, migrations, customers, products } = diagnostics;
  const environment = databaseEnvironmentDiagnostics();
  console.log("\nShopKart migration verification");
  console.log(`  Configuration source : ${configurationSource}`);
  console.log(`  Environment file     : ${environment.environmentFilePath}`);
  console.log(`  Environment file exists: ${environment.environmentFileExists}`);
  console.log(`  Process DB values    : ${JSON.stringify(environment.processValues)}`);
  console.log(`  Process DATABASE_URL : ${environment.processDatabaseUrl}`);
  console.log(`  .env DB values       : ${JSON.stringify(environment.fileValues)}`);
  console.log(`  .env DATABASE_URL    : ${environment.fileDatabaseUrl}`);
  console.log(`  Requested target     : ${options.host}:${options.port}/${options.database}`);
  console.log(`  Connected server     : ${server.serverHostname}:${server.serverPort}`);
  console.log(`  Selected database    : ${server.selectedDatabase}`);
  console.log(`  Connected as         : ${server.connectedAs}`);
  console.log(`  Authenticated as     : ${server.authenticatedAs}`);
  console.log(`  Database engine      : ${options.dialect}`);
  console.log(`  Server version       : ${server.serverVersion}`);
  console.log(`  Applied migrations   : ${migrations.join(", ")}`);
  console.log(`  Verified tables      : ${tables.join(", ")}`);
  console.log(`  Seed rows            : customers=${customers}, products=${products}`);
  console.log("\nInspect this exact database with:");
  const inspectCommand = options.dialect === "mysql"
    ? `mysql -h ${options.host} -P ${options.port} -u ${options.user} -p ${options.database}`
    : `psql -h ${options.host} -p ${options.port} -U ${options.user} -d ${options.database}`;
  console.log(`  ${inspectCommand}`);
  console.log(options.dialect === "mysql" ? "Then run: SHOW TABLES;" : "Then run: \\dt");
}

async function migratePostgres({ databaseUrl, configurationSource, options, reset, diagnostics }) {
  const connection = new PostgresClient({
    connectionString: databaseUrl,
    connectionTimeoutMillis: Number(optional("DB_CONNECTION_TIMEOUT_MS") || 10000)
  });
  await connection.connect();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(120) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationDir = path.join(rootDir, "database", "migration-postgresql");
    const migrations = (await fs.readdir(migrationDir))
      .filter((name) => /^V\d+__.*\.sql$/.test(name))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    for (const migration of migrations) {
      const existing = await connection.query(
        "SELECT version FROM schema_migrations WHERE version = $1",
        [migration]
      );
      if (existing.rows.length > 0) continue;

      await connection.query("BEGIN");
      try {
        await connection.query(await fs.readFile(path.join(migrationDir, migration), "utf8"));
        await connection.query("INSERT INTO schema_migrations (version) VALUES ($1)", [migration]);
        await connection.query("COMMIT");
        console.log(`Applied ${migration}`);
      } catch (error) {
        await connection.query("ROLLBACK");
        throw error;
      }
    }

    if (reset) {
      await connection.query(await fs.readFile(path.join(rootDir, "database", "reset-postgresql.sql"), "utf8"));
      console.log("Cleared carts and orders");
    }

    for (const [persona, key] of Object.entries({
      alice: "SHOPKART_ALICE_PASSWORD",
      bob: "SHOPKART_BOB_PASSWORD",
      carol: "SHOPKART_CAROL_PASSWORD"
    })) {
      await connection.query(
        "UPDATE customers SET password_hash = $1 WHERE persona = $2",
        [hashPassword(required(key)), persona]
      );
    }
    console.log("Updated seeded account password hashes from environment values");

    const serverResult = await connection.query(`
      SELECT
        current_database() AS "selectedDatabase",
        COALESCE(inet_server_addr()::text, 'local-socket') AS "serverHostname",
        inet_server_port() AS "serverPort",
        version() AS "serverVersion",
        current_user AS "authenticatedAs",
        session_user AS "connectedAs"
    `);
    const tableResult = await connection.query(`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = current_schema()
      ORDER BY table_name
    `);
    const migrationResult = await connection.query("SELECT version FROM schema_migrations ORDER BY version");
    const countResult = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM customers) AS customers,
        (SELECT COUNT(*) FROM products) AS products
    `);
    const verification = {
      server: serverResult.rows[0],
      tables: tableResult.rows.map((row) => row.tableName),
      migrations: migrationResult.rows.map((row) => row.version),
      customers: Number(countResult.rows[0].customers),
      products: Number(countResult.rows[0].products)
    };
    assertVerifiedDatabase(verification);
    if (diagnostics) {
      printDatabaseDiagnostics({ configurationSource, options, diagnostics: verification });
    }
  } finally {
    await connection.end();
  }
}

export async function migrateDatabase({ databaseUrl, reset = false, diagnostics = false } = {}) {
  const resolvedConfiguration = databaseUrl
    ? { databaseUrl, source: "explicit runtime argument" }
    : resolveDatabaseConfiguration();
  databaseUrl = resolvedConfiguration.databaseUrl;
  const options = parseDatabaseUrl(databaseUrl);
  if (options.dialect === "postgresql") {
    return migratePostgres({
      databaseUrl,
      configurationSource: resolvedConfiguration.source,
      options,
      reset,
      diagnostics
    });
  }
  const { dialect: _dialect, ...connectionOptions } = options;
  const connectionConfig = {
      ...connectionOptions,
      multipleStatements: true,
      connectTimeout: Number(optional("DB_CONNECTION_TIMEOUT_MS") || 10000)
  };
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
  } catch (error) {
    if (error?.code !== "ER_BAD_DB_ERROR") {
      throw error;
    }
    await ensureDatabase(options);
    connection = await mysql.createConnection(connectionConfig);
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(120) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    const migrationDir = path.join(rootDir, "database", "migration");
    const migrations = (await fs.readdir(migrationDir))
      .filter((name) => /^V\d+__.*\.sql$/.test(name))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    for (const migration of migrations) {
      const [existing] = await connection.execute(
        "SELECT version FROM schema_migrations WHERE version = ?",
        [migration]
      );
      if (existing.length > 0) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationDir, migration), "utf8");
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.execute("INSERT INTO schema_migrations (version) VALUES (?)", [migration]);
        await connection.commit();
        console.log(`Applied ${migration}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    if (reset) {
      const resetSql = await fs.readFile(path.join(rootDir, "database", "reset.sql"), "utf8");
      await connection.query(resetSql);
      console.log("Cleared carts and orders");
    }

    const passwordKeys = {
      alice: "SHOPKART_ALICE_PASSWORD",
      bob: "SHOPKART_BOB_PASSWORD",
      carol: "SHOPKART_CAROL_PASSWORD"
    };
    for (const [persona, key] of Object.entries(passwordKeys)) {
      await connection.execute(
        "UPDATE customers SET password_hash = ? WHERE persona = ?",
        [hashPassword(required(key)), persona]
      );
    }
    console.log("Updated seeded account password hashes from environment values");

    const verification = await readDatabaseDiagnostics(connection);
    assertVerifiedDatabase(verification);
    if (diagnostics) {
      printDatabaseDiagnostics({
        configurationSource: resolvedConfiguration.source,
        options,
        diagnostics: verification
      });
    }
  } finally {
    await connection.end();
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  migrateDatabase({ reset: process.argv.includes("--reset"), diagnostics: true }).catch((error) => {
    let databaseUrl;
    try { databaseUrl = resolveDatabaseUrl(); } catch { databaseUrl = ""; }
    console.error(`ShopKart migration failed: ${databaseFailureMessage(error, databaseUrl)}`);
    process.exitCode = 1;
  });
}
