import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "../..");

const fileEnvironment = {};
dotenv.config({
  path: process.env.ENV_FILE ? path.resolve(process.env.ENV_FILE) : path.join(rootDir, ".env"),
  quiet: true,
  processEnv: fileEnvironment
});

export function optional(name) {
  return process.env[name] ?? fileEnvironment[name];
}

export function required(name) {
  const value = optional(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const databaseKeys = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];

function hasCompleteDatabaseParts(environment) {
  return databaseKeys.every((name) => environment[name]?.trim());
}

function databaseUrlFromParts(environment) {
  const host = environment.DB_HOST.trim();
  const port = environment.DB_PORT?.trim() || "3306";
  const database = environment.DB_NAME.trim();
  const user = environment.DB_USER.trim();
  const password = environment.DB_PASSWORD.trim();
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function resolveDatabaseUrl() {
  if (hasCompleteDatabaseParts(process.env)) return databaseUrlFromParts(process.env);

  const processDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (processDatabaseUrl) return processDatabaseUrl;

  if (hasCompleteDatabaseParts(fileEnvironment)) return databaseUrlFromParts(fileEnvironment);

  const fileDatabaseUrl = fileEnvironment.DATABASE_URL?.trim();
  if (fileDatabaseUrl) return fileDatabaseUrl;

  throw new Error("Missing required database configuration: set DATABASE_URL or all of DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD");
}

export function databaseTarget(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.hostname}:${parsed.port || "3306"}/${parsed.pathname.replace(/^\//, "") || "<missing-db>"}`;
  } catch {
    return "<invalid MySQL target>";
  }
}

export function databaseFailureMessage(error, databaseUrl) {
  const code = error?.code || error?.cause?.code || "UNKNOWN";
  const target = databaseTarget(databaseUrl);
  if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(code)) {
    return `Cannot reach MySQL at ${target}. Confirm that MySQL is running and that DB_HOST/DB_PORT are correct. Driver code: ${code}.`;
  }
  if (code === "ER_ACCESS_DENIED_ERROR") {
    return `MySQL at ${target} rejected DB_USER or DB_PASSWORD. The configured target was loaded, but credentials were not accepted.`;
  }
  if (code === "ER_BAD_DB_ERROR") {
    return `MySQL is reachable, but database ${target} does not exist and the configured user could not create it. Create the database with an administrative account.`;
  }
  if (["ER_DBACCESS_DENIED_ERROR", "ER_TABLEACCESS_DENIED_ERROR"].includes(code)) {
    return `The configured MySQL user lacks permission for ${target}. Apply the grants from README.md.`;
  }
  return `MySQL initialization failed for ${target}. Driver code: ${code}. ${error?.message || "Unknown database error"}`;
}

export function loadConfig() {
  const tokenSecret = required("SHOPKART_TOKEN_SECRET");
  if (tokenSecret.length < 32) {
    throw new Error("SHOPKART_TOKEN_SECRET must contain at least 32 characters");
  }

  return {
    port: Number(optional("PORT") || 8080),
    databaseUrl: resolveDatabaseUrl(),
    tokenSecret,
    apiDelayMs: Math.max(0, Number(optional("SHOPKART_API_DELAY_MS") || 0))
  };
}
