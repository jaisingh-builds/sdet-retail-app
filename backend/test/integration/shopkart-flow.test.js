import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { MySqlContainer } from "@testcontainers/mysql";

async function jsonRequest(baseUrl, path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
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

test("ShopKart supports the complete API, ownership, DB, and negative flow", async (t) => {
  const alicePassword = crypto.randomBytes(18).toString("base64url");
  const bobPassword = crypto.randomBytes(18).toString("base64url");
  const carolPassword = crypto.randomBytes(18).toString("base64url");
  const databasePassword = crypto.randomBytes(18).toString("base64url");
  const mysql = await new MySqlContainer("mysql:8.4")
    .withDatabase("shopkart")
    .withUsername("shopkart_user")
    .withUserPassword(databasePassword)
    .withRootPassword(crypto.randomBytes(18).toString("base64url"))
    .start();
  t.after(() => mysql.stop());

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = mysql.getConnectionUri();
  process.env.SHOPKART_TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
  process.env.SHOPKART_ALICE_PASSWORD = alicePassword;
  process.env.SHOPKART_BOB_PASSWORD = bobPassword;
  process.env.SHOPKART_CAROL_PASSWORD = carolPassword;

  const [{ startServer }, { migrateDatabase }] = await Promise.all([
    import("../../src/server.js"),
    import("../../src/migrate.js")
  ]);
  const runtime = await startServer({ port: 0 });
  t.after(() => runtime.close());
  const baseUrl = `http://127.0.0.1:${runtime.port}`;

  const health = await jsonRequest(baseUrl, "/api/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.payload.database, "mysql");

  const productSearch = await jsonRequest(baseUrl, "/api/products?q=bag");
  assert.equal(productSearch.response.status, 200);
  assert.deepEqual(productSearch.payload.map((product) => product.sku), ["SKU-BAG"]);

  const missingProduct = await jsonRequest(baseUrl, "/api/products/SKU-UNKNOWN");
  assert.equal(missingProduct.response.status, 404);

  const wrongLogin = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "alice@shopkart.test", password: "not-the-password" }
  });
  assert.equal(wrongLogin.response.status, 401);

  const unauthenticatedCart = await jsonRequest(baseUrl, "/api/carts", { method: "POST" });
  assert.equal(unauthenticatedCart.response.status, 401);

  const aliceLogin = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "alice@shopkart.test", password: alicePassword }
  });
  assert.equal(aliceLogin.response.status, 200);
  assert.equal(aliceLogin.payload.customer.persona, "alice");

  const bobLogin = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "bob@shopkart.test", password: bobPassword }
  });
  assert.equal(bobLogin.response.status, 200);

  const cartCreated = await jsonRequest(baseUrl, "/api/carts", {
    method: "POST",
    token: aliceLogin.payload.token
  });
  assert.equal(cartCreated.response.status, 201);
  assert.equal(cartCreated.payload.status, "OPEN");
  const cartId = cartCreated.payload.cartId;

  const cartUpdated = await jsonRequest(baseUrl, `/api/carts/${cartId}/items`, {
    method: "POST",
    token: aliceLogin.payload.token,
    body: { sku: "SKU-BAG", qty: 2 }
  });
  assert.equal(cartUpdated.response.status, 200);
  assert.equal(cartUpdated.payload.totalPaise, 99800);
  assert.equal(cartUpdated.payload.items[0].lineTotalPaise, 99800);

  const forbiddenCart = await jsonRequest(baseUrl, `/api/carts/${cartId}`, {
    token: bobLogin.payload.token
  });
  assert.equal(forbiddenCart.response.status, 403);
  assert.equal(forbiddenCart.payload.error.code, "CART_FORBIDDEN");

  const orderCreated = await jsonRequest(baseUrl, "/api/orders", {
    method: "POST",
    token: aliceLogin.payload.token,
    body: { cartId, address: "UST Campus, Technopark, Trivandrum" }
  });
  assert.equal(orderCreated.response.status, 201);
  assert.equal(orderCreated.payload.status, "PLACED");
  assert.equal(orderCreated.payload.totalPaise, 99800);
  const orderId = orderCreated.payload.orderId;

  const orderRead = await jsonRequest(baseUrl, `/api/orders/${orderId}`, {
    token: aliceLogin.payload.token
  });
  assert.equal(orderRead.response.status, 200);
  assert.equal(orderRead.payload.items.length, 1);

  const forbiddenOrder = await jsonRequest(baseUrl, `/api/orders/${orderId}`, {
    token: bobLogin.payload.token
  });
  assert.equal(forbiddenOrder.response.status, 403);
  assert.equal(forbiddenOrder.payload.error.code, "ORDER_FORBIDDEN");

  const missingOrder = await jsonRequest(baseUrl, "/api/orders/999999", {
    token: aliceLogin.payload.token
  });
  assert.equal(missingOrder.response.status, 404);

  const duplicateCheckout = await jsonRequest(baseUrl, "/api/orders", {
    method: "POST",
    token: aliceLogin.payload.token,
    body: { cartId, address: "UST Campus, Technopark, Trivandrum" }
  });
  assert.equal(duplicateCheckout.response.status, 409);
  assert.equal(duplicateCheckout.payload.error.code, "CART_ALREADY_ORDERED");

  const rowCount = await mysql.executeQuery(
    `SELECT COUNT(*) AS placed_count FROM shopkart.orders WHERE id = ${orderId} AND status = 'PLACED'`
  );
  assert.match(rowCount, /placed_count\s+1/);

  const cancelled = await jsonRequest(baseUrl, `/api/orders/${orderId}/cancel`, {
    method: "POST",
    token: aliceLogin.payload.token
  });
  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.payload.status, "CANCELLED");

  const cancelledAgain = await jsonRequest(baseUrl, `/api/orders/${orderId}/cancel`, {
    method: "POST",
    token: aliceLogin.payload.token
  });
  assert.equal(cancelledAgain.response.status, 409);
  assert.equal(cancelledAgain.payload.error.code, "ORDER_NOT_PLACED");

  const emptyCart = await jsonRequest(baseUrl, "/api/carts", {
    method: "POST",
    token: aliceLogin.payload.token
  });
  const emptyCheckout = await jsonRequest(baseUrl, "/api/orders", {
    method: "POST",
    token: aliceLogin.payload.token,
    body: { cartId: emptyCart.payload.cartId, address: "UST Campus, Technopark, Trivandrum" }
  });
  assert.equal(emptyCheckout.response.status, 409);
  assert.equal(emptyCheckout.payload.error.code, "EMPTY_CART");

  const outOfStock = await jsonRequest(baseUrl, `/api/carts/${emptyCart.payload.cartId}/items`, {
    method: "POST",
    token: aliceLogin.payload.token,
    body: { sku: "SKU-CAP", qty: 1 }
  });
  assert.equal(outOfStock.response.status, 409);
  assert.equal(outOfStock.payload.error.code, "OUT_OF_STOCK");

  await migrateDatabase({ databaseUrl: mysql.getConnectionUri(), reset: true });
  const rowsAfterReset = await mysql.executeQuery("SELECT COUNT(*) AS order_count FROM shopkart.orders");
  assert.match(rowsAfterReset, /order_count\s+0/);
});
