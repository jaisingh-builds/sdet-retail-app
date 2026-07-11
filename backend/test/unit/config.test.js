import assert from "node:assert/strict";
import test from "node:test";
import { resolveDatabaseUrl } from "../../src/config.js";

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
