import assert from "node:assert/strict";
import test from "node:test";
import { createToken, verifyToken } from "../../src/tokens.js";

const secret = "test-only-token-secret-that-is-long-enough";
const customer = { id: 7, persona: "alice", email: "alice@shopkart.test" };

test("signed token returns the customer identity", () => {
  const token = createToken(customer, secret, 1000);
  assert.deepEqual(verifyToken(token, secret, 1200), {
    sub: "7",
    persona: "alice",
    email: "alice@shopkart.test",
    iat: 1000,
    exp: 4600
  });
});

test("expired or modified token is rejected", () => {
  const token = createToken(customer, secret, 1000);
  assert.equal(verifyToken(token, secret, 5000), null);
  assert.equal(verifyToken(`${token}x`, secret, 1200), null);
});
