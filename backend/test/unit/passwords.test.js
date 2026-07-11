import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../../src/passwords.js";

test("password verification accepts the source value and rejects another value", () => {
  const stored = hashPassword("Training-only-value", "fixed-test-salt");
  assert.equal(verifyPassword("Training-only-value", stored), true);
  assert.equal(verifyPassword("wrong-value", stored), false);
});
