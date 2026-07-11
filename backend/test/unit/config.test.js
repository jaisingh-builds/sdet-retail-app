import assert from "node:assert/strict";
import test from "node:test";
import { databaseFailureMessage, resolveDatabaseUrl } from "../../src/config.js";

test("separate MySQL password supports @ and : without malformed URL parsing", () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD
  };

  delete process.env.DATABASE_URL;
  process.env.DB_HOST = "localhost";
  process.env.DB_PORT = "3306";
  process.env.DB_NAME = "shopkart";
  process.env.DB_USER = "shopkart_user";
  process.env.DB_PASSWORD = "Training@123:Test";

  assert.equal(
    resolveDatabaseUrl(),
    "mysql://shopkart_user:Training%40123%3ATest@localhost:3306/shopkart"
  );

  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("database diagnostics identify the target without printing the password", () => {
  const url = "mysql://shopkart_user:Training%40123@db.example.test:3307/shopkart";
  const message = databaseFailureMessage({ code: "ER_ACCESS_DENIED_ERROR" }, url);
  assert.match(message, /db\.example\.test:3307\/shopkart/);
  assert.doesNotMatch(message, /Training|%40|123/);
});

test("complete DB_* project configuration takes precedence over a stale DATABASE_URL", () => {
  const previous = Object.fromEntries(
    ["DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]
      .map((key) => [key, process.env[key]])
  );
  process.env.DATABASE_URL = "mysql://old:old@legacy.example:3306/legacy";
  process.env.DB_HOST = "current.example";
  process.env.DB_PORT = "3307";
  process.env.DB_NAME = "shopkart";
  process.env.DB_USER = "shopkart_user";
  process.env.DB_PASSWORD = "Current@123";

  assert.equal(
    resolveDatabaseUrl(),
    "mysql://shopkart_user:Current%40123@current.example:3307/shopkart"
  );

  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("explicit DATABASE_URL is not overridden by DB values loaded from .env", () => {
  const previous = Object.fromEntries(
    ["DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]
      .map((key) => [key, process.env[key]])
  );
  for (const key of ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]) {
    delete process.env[key];
  }
  process.env.DATABASE_URL = "mysql://explicit:Explicit%40123@runtime.example:3310/shopkart_runtime";

  assert.equal(
    resolveDatabaseUrl(),
    "mysql://explicit:Explicit%40123@runtime.example:3310/shopkart_runtime"
  );

  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("separate PostgreSQL values produce an encoded PostgreSQL URL", () => {
  const keys = ["DATABASE_URL", "DB_DIALECT", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  delete process.env.DATABASE_URL;
  process.env.DB_DIALECT = "postgresql";
  process.env.DB_HOST = "localhost";
  process.env.DB_PORT = "5432";
  process.env.DB_NAME = "shopkart";
  process.env.DB_USER = "shopkart_user";
  process.env.DB_PASSWORD = "Postgres@123:Test";

  assert.equal(
    resolveDatabaseUrl(),
    "postgresql://shopkart_user:Postgres%40123%3ATest@localhost:5432/shopkart"
  );

  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
