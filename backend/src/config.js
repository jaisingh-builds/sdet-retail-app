import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "../..");

dotenv.config({
  path: process.env.ENV_FILE ? path.resolve(process.env.ENV_FILE) : path.join(rootDir, ".env"),
  quiet: true
});

export function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  const host = required("DB_HOST");
  const port = process.env.DB_PORT?.trim() || "3306";
  const database = required("DB_NAME");
  const user = required("DB_USER");
  const password = required("DB_PASSWORD");
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function loadConfig() {
  const tokenSecret = required("SHOPKART_TOKEN_SECRET");
  if (tokenSecret.length < 32) {
    throw new Error("SHOPKART_TOKEN_SECRET must contain at least 32 characters");
  }

  return {
    port: Number(process.env.PORT || 8080),
    databaseUrl: resolveDatabaseUrl(),
    tokenSecret,
    apiDelayMs: Math.max(0, Number(process.env.SHOPKART_API_DELAY_MS || 0))
  };
}
