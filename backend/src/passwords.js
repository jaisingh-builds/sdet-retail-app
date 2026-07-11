import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  if (!password) {
    throw new Error("A non-empty password is required");
  }
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, storedValue) {
  const [algorithm, salt, expectedHex] = String(storedValue).split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) {
    return false;
  }

  const actual = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
