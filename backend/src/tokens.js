import crypto from "node:crypto";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createToken(customer, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const body = encode({
    sub: String(customer.id),
    persona: customer.persona,
    email: customer.email,
    iat: nowSeconds,
    exp: nowSeconds + 3600
  });
  return `${body}.${signature(body, secret)}`;
}

export function verifyToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const [body, providedSignature, extra] = String(token || "").split(".");
  if (!body || !providedSignature || extra) {
    return null;
  }

  const expected = signature(body, secret);
  const actualBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > nowSeconds ? payload : null;
  } catch {
    return null;
  }
}
