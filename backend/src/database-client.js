import mysql from "mysql2/promise";
import pg from "pg";
import { optional } from "./config.js";

const { Pool: PostgresPool } = pg;

export function databaseDialect(databaseUrl) {
  const protocol = new URL(databaseUrl).protocol;
  if (protocol === "mysql:") return "mysql";
  if (protocol === "postgres:" || protocol === "postgresql:") return "postgresql";
  throw new Error("Database URL must start with mysql://, postgres://, or postgresql://");
}

function postgresSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

class PostgresConnection {
  constructor(client, releaseAfterUse = false) {
    this.client = client;
    this.releaseAfterUse = releaseAfterUse;
  }

  async execute(sql, parameters = []) {
    const result = await this.client.query(postgresSql(sql), parameters);
    return [result.rows, result];
  }

  query(sql, parameters = []) {
    return this.execute(sql, parameters);
  }

  beginTransaction() {
    return this.client.query("BEGIN");
  }

  commit() {
    return this.client.query("COMMIT");
  }

  rollback() {
    return this.client.query("ROLLBACK");
  }

  release() {
    if (this.releaseAfterUse) this.client.release();
  }
}

class PostgresPoolAdapter {
  constructor(databaseUrl) {
    this.pool = new PostgresPool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: Number(optional("DB_CONNECTION_TIMEOUT_MS") || 10000),
      max: 8
    });
  }

  async execute(sql, parameters = []) {
    return new PostgresConnection(this.pool).execute(sql, parameters);
  }

  query(sql, parameters = []) {
    return this.execute(sql, parameters);
  }

  async getConnection() {
    return new PostgresConnection(await this.pool.connect(), true);
  }

  end() {
    return this.pool.end();
  }
}

export function createDatabasePool(databaseUrl) {
  if (databaseDialect(databaseUrl) === "postgresql") {
    return new PostgresPoolAdapter(databaseUrl);
  }

  const parsed = new URL(databaseUrl);
  return mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 8,
    connectTimeout: Number(optional("DB_CONNECTION_TIMEOUT_MS") || 10000)
  });
}
