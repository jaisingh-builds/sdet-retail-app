import assert from "node:assert/strict";

const baseUrl = process.env.SHOPKART_BASE_URL || "http://localhost:8080";
const alicePassword = process.env.SHOPKART_ALICE_PASSWORD;
const bobPassword = process.env.SHOPKART_BOB_PASSWORD;

if (!alicePassword || !bobPassword) {
  console.error("Set SHOPKART_ALICE_PASSWORD and SHOPKART_BOB_PASSWORD before running the smoke flow.");
  process.exit(1);
}

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  return { response, payload };
}

async function login(email, password) {
  const result = await request("/auth/login", { method: "POST", body: { email, password } });
  assert.equal(result.response.status, 200, `login failed for ${email}`);
  return result.payload.token;
}

const health = await request("/health");
assert.equal(health.response.status, 200);
console.log("PASS health and MySQL readiness");

const aliceToken = await login("alice@shopkart.test", alicePassword);
const bobToken = await login("bob@shopkart.test", bobPassword);
console.log("PASS seeded account authentication");

const cart = await request("/carts", { method: "POST", token: aliceToken });
assert.equal(cart.response.status, 201);
const cartId = cart.payload.cartId;

const updated = await request(`/carts/${cartId}/items`, {
  method: "POST",
  token: aliceToken,
  body: { sku: "SKU-BAG", qty: 2 }
});
assert.equal(updated.payload.totalPaise, 99800);
console.log("PASS cart total 2 x 49900 = 99800 paise");

const forbiddenCart = await request(`/carts/${cartId}`, { token: bobToken });
assert.equal(forbiddenCart.response.status, 403);
console.log("PASS cart ownership returns 403");

const order = await request("/orders", {
  method: "POST",
  token: aliceToken,
  body: { cartId, address: "UST Campus, Technopark, Trivandrum" }
});
assert.equal(order.response.status, 201);
assert.equal(order.payload.status, "PLACED");
assert.equal(order.payload.totalPaise, 99800);

const forbiddenOrder = await request(`/orders/${order.payload.orderId}`, { token: bobToken });
assert.equal(forbiddenOrder.response.status, 403);
console.log("PASS checkout and order ownership");

const negativeCart = await request("/carts", { method: "POST", token: aliceToken });
const outOfStock = await request(`/carts/${negativeCart.payload.cartId}/items`, {
  method: "POST",
  token: aliceToken,
  body: { sku: "SKU-CAP", qty: 1 }
});
assert.equal(outOfStock.response.status, 409);
assert.equal(outOfStock.payload.error.code, "OUT_OF_STOCK");
console.log("PASS out-of-stock rule returns 409");

console.log(`ShopKart smoke flow passed at ${baseUrl}; no credentials or tokens were printed.`);
