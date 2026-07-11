import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import mysql from "mysql2/promise";
import { resolveDatabaseUrl, rootDir, required } from "./config.js";
import { hashPassword } from "./passwords.js";

function parseDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  if (parsed.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must start with mysql://");
  }

  const database = parsed.pathname.replace(/^\//, "");
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error("DATABASE_URL must contain a simple MySQL database name");
  }

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database
  };
}

async function ensureDatabase(connectionOptions) {
  const connection = await mysql.createConnection({
    host: connectionOptions.host,
    port: connectionOptions.port,
    user: connectionOptions.user,
    password: connectionOptions.password,
    connectTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000)
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${connectionOptions.database}\``);
  await connection.end();
}

export async function migrateDatabase({ databaseUrl = resolveDatabaseUrl(), reset = false } = {}) {
  const options = parseDatabaseUrl(databaseUrl);
  await ensureDatabase(options);

  const connection = await mysql.createConnection({
    ...options,
    multipleStatements: true,
    connectTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000)
  });

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
  } finally {
    await connection.end();
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  migrateDatabase({ reset: process.argv.includes("--reset") }).catch((error) => {
    console.error(`ShopKart migration failed: ${error.message}`);
    process.exitCode = 1;
  });
}
