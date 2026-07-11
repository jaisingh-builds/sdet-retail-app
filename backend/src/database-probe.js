import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import pg from "pg";
import {
  databaseEnvironmentDiagnostics,
  databaseTarget,
  environmentFilePath,
  resolveDatabaseConfiguration,
  rootDir
} from "./config.js";

const { Client: PostgresClient } = pg;
const requiredParts = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];

function completeParts(environment) {
  return requiredParts.every((name) => environment[name]?.trim());
}

function urlFromParts(environment) {
  const dialect = environment.DB_DIALECT?.trim().toLowerCase() || "mysql";
  const protocol = dialect === "postgres" || dialect === "postgresql" ? "postgresql" : "mysql";
  const port = environment.DB_PORT?.trim() || (protocol === "mysql" ? "3306" : "5432");
  return `${protocol}://${encodeURIComponent(environment.DB_USER.trim())}:${encodeURIComponent(environment.DB_PASSWORD.trim())}`
    + `@${environment.DB_HOST.trim()}:${port}/${encodeURIComponent(environment.DB_NAME.trim())}`;
}

function command(command, args) {
  try {
    return execFileSync(command, args, { cwd: rootDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unavailable";
  }
}

function shortHash(file) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 12);
  } catch {
    return "unavailable";
  }
}

function safeError(error) {
  const message = String(error?.message || "unknown error")
    .replace(/(password=)[^\s]+/gi, "$1<hidden>")
    .replace(/:\/\/([^:@/]+):([^@/]+)@/g, "://$1:<hidden>@");
  return `${error?.code || "UNKNOWN"}: ${message}`;
}

async function probe(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const requestedDatabase = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (parsed.protocol === "mysql:") {
    const connection = await mysql.createConnection({
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: requestedDatabase,
      connectTimeout: 10000
    });
    try {
      const [[row]] = await connection.query(`
        SELECT DATABASE() AS selectedDatabase, @@hostname AS serverHost,
               @@port AS serverPort, CURRENT_USER() AS authenticatedAs
      `);
      return row;
    } finally {
      await connection.end();
    }
  }

  if (parsed.protocol === "postgres:" || parsed.protocol === "postgresql:") {
    const connection = new PostgresClient({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
    await connection.connect();
    try {
      const result = await connection.query(`
        SELECT current_database() AS "selectedDatabase",
               COALESCE(inet_server_addr()::text, 'local-socket') AS "serverHost",
               inet_server_port() AS "serverPort", current_user AS "authenticatedAs"
      `);
      return result.rows[0];
    } finally {
      await connection.end();
    }
  }
  throw new Error(`Unsupported protocol ${parsed.protocol}`);
}

const rawFileEnvironment = fs.existsSync(environmentFilePath)
  ? dotenv.parse(fs.readFileSync(environmentFilePath))
  : {};
const effective = resolveDatabaseConfiguration();
const diagnostics = databaseEnvironmentDiagnostics();
const candidates = [];

if (completeParts(process.env)) {
  candidates.push({ label: "process/IDE DB_*", databaseUrl: urlFromParts(process.env) });
}
if (process.env.DATABASE_URL?.trim()) {
  candidates.push({ label: "process/IDE DATABASE_URL", databaseUrl: process.env.DATABASE_URL.trim() });
}
if (completeParts(rawFileEnvironment)) {
  candidates.push({ label: "raw .env DB_*", databaseUrl: urlFromParts(rawFileEnvironment) });
}
if (rawFileEnvironment.DATABASE_URL?.trim()) {
  candidates.push({ label: "raw .env DATABASE_URL", databaseUrl: rawFileEnvironment.DATABASE_URL.trim() });
}

console.log("ShopKart read-only database probe v1");
console.log(`  Current directory     : ${process.cwd()}`);
console.log(`  Repository root       : ${rootDir}`);
console.log(`  Probe script          : ${fileURLToPath(import.meta.url)}`);
console.log(`  Node executable       : ${process.execPath}`);
console.log(`  Node version          : ${process.version}`);
console.log(`  Git branch            : ${command("git", ["branch", "--show-current"])}`);
console.log(`  Git commit            : ${command("git", ["rev-parse", "HEAD"])}`);
console.log(`  Environment file      : ${environmentFilePath}`);
console.log(`  Environment file exists: ${diagnostics.environmentFileExists}`);
console.log(`  Environment file hash: ${shortHash(environmentFilePath)}`);
console.log(`  config.js hash        : ${shortHash(path.join(rootDir, "backend", "src", "config.js"))}`);
console.log(`  migrate.js hash       : ${shortHash(path.join(rootDir, "backend", "src", "migrate.js"))}`);
console.log(`  Process DB values     : ${JSON.stringify(diagnostics.processValues)}`);
console.log(`  Process DB_* missing  : ${diagnostics.processMissingValues.join(", ") || "none"}`);
console.log(`  Process DATABASE_URL  : ${diagnostics.processDatabaseUrl}`);
console.log(`  Raw .env DB values    : ${JSON.stringify(diagnostics.fileValues)}`);
console.log(`  Raw .env DB_* missing : ${diagnostics.fileMissingValues.join(", ") || "none"}`);
console.log(`  Raw .env DATABASE_URL : ${diagnostics.fileDatabaseUrl}`);
console.log(`  WINNING source        : ${effective.source}`);
console.log(`  WINNING target        : ${databaseTarget(effective.databaseUrl)}`);

let effectivePassed = false;
for (const candidate of candidates) {
  const isEffective = candidate.databaseUrl === effective.databaseUrl;
  console.log(`\nCandidate: ${candidate.label}${isEffective ? " [WINNER]" : ""}`);
  console.log(`  Requested target      : ${databaseTarget(candidate.databaseUrl)}`);
  try {
    const result = await probe(candidate.databaseUrl);
    console.log(`  Driver selected DB    : ${result.selectedDatabase}`);
    console.log(`  Server                : ${result.serverHost}:${result.serverPort}`);
    console.log(`  Authenticated as      : ${result.authenticatedAs}`);
    const requested = decodeURIComponent(new URL(candidate.databaseUrl).pathname.replace(/^\//, ""));
    const matches = requested === result.selectedDatabase;
    console.log(`  Requested == selected : ${matches}`);
    if (isEffective) effectivePassed = matches;
  } catch (error) {
    console.log(`  Connection result     : FAILED (${safeError(error)})`);
  }
}

if (!effectivePassed) {
  console.error("\nPROBE FAILED: the winning configuration did not connect to its requested database.");
  process.exitCode = 1;
} else {
  console.log("\nPROBE PASSED: the winning configuration selected the requested database.");
}
