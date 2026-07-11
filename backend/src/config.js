import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "../..");
export const environmentFilePath = process.env.ENV_FILE
  ? path.resolve(process.env.ENV_FILE)
  : path.join(rootDir, ".env");

const fileEnvironment = {};
dotenv.config({
  path: environmentFilePath,
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
  const dialect = environment.DB_DIALECT?.trim().toLowerCase() || "mysql";
  if (!["mysql", "postgres", "postgresql"].includes(dialect)) {
    throw new Error("DB_DIALECT must be mysql or postgresql");
  }
  const protocol = dialect === "mysql" ? "mysql" : "postgresql";
  const host = environment.DB_HOST.trim();
  const port = environment.DB_PORT?.trim() || (protocol === "mysql" ? "3306" : "5432");
  const database = environment.DB_NAME.trim();
  const user = environment.DB_USER.trim();
  const password = environment.DB_PASSWORD.trim();
  return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

export function resolveDatabaseConfiguration() {
  if (hasCompleteDatabaseParts(process.env)) {
    return { databaseUrl: databaseUrlFromParts(process.env), source: "process/IDE DB_* values" };
  }

  const processDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (processDatabaseUrl) {
    return { databaseUrl: processDatabaseUrl, source: "process/IDE DATABASE_URL" };
  }

  if (hasCompleteDatabaseParts(fileEnvironment)) {
    return { databaseUrl: databaseUrlFromParts(fileEnvironment), source: `.env DB_* values (${environmentFilePath})` };
  }

  const fileDatabaseUrl = fileEnvironment.DATABASE_URL?.trim();
  if (fileDatabaseUrl) {
    return { databaseUrl: fileDatabaseUrl, source: `.env DATABASE_URL (${environmentFilePath})` };
  }

  throw new Error("Missing required database configuration: set DATABASE_URL or all of DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD");
}

export function databaseEnvironmentDiagnostics() {
  const names = ["DB_DIALECT", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const requiredNames = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const visibleValues = (environment) => Object.fromEntries(
    names
      .filter((name) => environment[name] !== undefined)
      .map((name) => [name, name === "DB_PASSWORD"
        ? (environment[name]?.trim() ? "<set; hidden>" : "<empty>")
        : environment[name]])
  );
  const missingValues = (environment) => requiredNames.filter((name) => !environment[name]?.trim());
  const visibleUrl = (value) => {
    if (!value) return "absent";
    try {
      const parsed = new URL(value);
      const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
      const user = decodeURIComponent(parsed.username);
      return `${parsed.protocol}//${user || "<no-user>"}:<password-hidden>@${parsed.host}/${database}`;
    } catch {
      return "present but invalid; hidden";
    }
  };
  return {
    environmentFilePath,
    environmentFileExists: existsSync(environmentFilePath),
    processValues: visibleValues(process.env),
    processMissingValues: missingValues(process.env),
    processDatabaseUrl: visibleUrl(process.env.DATABASE_URL),
    fileValues: visibleValues(fileEnvironment),
    fileMissingValues: missingValues(fileEnvironment),
    fileDatabaseUrl: visibleUrl(fileEnvironment.DATABASE_URL)
  };
}

export function resolveDatabaseUrl() {
  return resolveDatabaseConfiguration().databaseUrl;
}

export function databaseTarget(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const defaultPort = parsed.protocol === "mysql:" ? "3306" : "5432";
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "<missing-db>";
    return `${parsed.hostname}:${parsed.port || defaultPort}/${database}`;
  } catch {
    return "<invalid database target>";
  }
}

export function databaseFailureMessage(error, databaseUrl) {
  const code = error?.code || error?.cause?.code || "UNKNOWN";
  const target = databaseTarget(databaseUrl);
  if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(code)) {
    return `Cannot reach the database at ${target}. Confirm that the selected database service is running and that DB_HOST/DB_PORT are correct. Driver code: ${code}.`;
  }
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "28P01") {
    return `The database at ${target} rejected DB_USER or DB_PASSWORD. The configured target was loaded, but credentials were not accepted.`;
  }
  if (code === "ER_BAD_DB_ERROR") {
    return `MySQL is reachable, but database ${target} does not exist and the configured user could not create it. Create the database with an administrative account.`;
  }
  if (code === "3D000") {
    return `PostgreSQL is reachable, but database ${target} does not exist. Create it with an administrative account before running the migration.`;
  }
  if (["ER_DBACCESS_DENIED_ERROR", "ER_TABLEACCESS_DENIED_ERROR", "42501"].includes(code)) {
    return `The configured database user lacks permission for ${target}. Apply the grants from README.md.`;
  }
  return `Database initialization failed for ${target}. Driver code: ${code}. ${error?.message || "Unknown database error"}`;
}

export function loadConfig() {
  const tokenSecret = required("SHOPKART_TOKEN_SECRET");
  if (tokenSecret.length < 32) {
    throw new Error("SHOPKART_TOKEN_SECRET must contain at least 32 characters");
  }

  const databaseConfiguration = resolveDatabaseConfiguration();
  return {
    port: Number(optional("PORT") || 8080),
    databaseUrl: databaseConfiguration.databaseUrl,
    databaseSource: databaseConfiguration.source,
    tokenSecret,
    apiDelayMs: Math.max(0, Number(optional("SHOPKART_API_DELAY_MS") || 0))
  };
}
