import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { MySqlContainer } from "@testcontainers/mysql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";

const { Client: PostgresClient } = pg;

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
  const databasePassword = `${crypto.randomBytes(12).toString("hex")}@:${crypto.randomBytes(6).toString("hex")}`;
  const mysql = await new MySqlContainer("mysql:8.4")
    .withDatabase("shopkart")
    .withUsername("shopkart_user")
    .withUserPassword(databasePassword)
    .withRootPassword(crypto.randomBytes(18).toString("base64url"))
    .start();
  t.after(() => mysql.stop());
  assert.match(mysql.getConnectionUri(), /%40%3A/);

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

  const malformedJsonResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{"
  });
  assert.equal(malformedJsonResponse.status, 400);
  assert.equal((await malformedJsonResponse.json()).error.code, "INVALID_JSON");

  const oversizedPassword = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "alice@shopkart.test", password: "x".repeat(129) }
  });
  assert.equal(oversizedPassword.response.status, 400);

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

  const concurrentCart = await jsonRequest(baseUrl, "/api/carts", {
    method: "POST",
    token: aliceLogin.payload.token
  });
  const concurrentAdds = await Promise.all([
    jsonRequest(baseUrl, `/api/carts/${concurrentCart.payload.cartId}/items`, {
      method: "POST",
      token: aliceLogin.payload.token,
      body: { sku: "SKU-PEN", qty: 1 }
    }),
    jsonRequest(baseUrl, `/api/carts/${concurrentCart.payload.cartId}/items`, {
      method: "POST",
      token: aliceLogin.payload.token,
      body: { sku: "SKU-PEN", qty: 1 }
    })
  ]);
  assert.deepEqual(concurrentAdds.map((result) => result.response.status), [200, 200]);
  const concurrentCartRead = await jsonRequest(baseUrl, `/api/carts/${concurrentCart.payload.cartId}`, {
    token: aliceLogin.payload.token
  });
  assert.equal(concurrentCartRead.payload.items[0].qty, 2);
  assert.equal(concurrentCartRead.payload.totalPaise, 19800);

  const concurrentOrders = await Promise.all([
    jsonRequest(baseUrl, "/api/orders", {
      method: "POST",
      token: aliceLogin.payload.token,
      body: { cartId: concurrentCart.payload.cartId, address: "UST Campus, Technopark, Trivandrum" }
    }),
    jsonRequest(baseUrl, "/api/orders", {
      method: "POST",
      token: aliceLogin.payload.token,
      body: { cartId: concurrentCart.payload.cartId, address: "UST Campus, Technopark, Trivandrum" }
    })
  ]);
  assert.deepEqual(
    concurrentOrders.map((result) => result.response.status).sort(),
    [201, 409]
  );
  const concurrentOrderCount = await mysql.executeQuery(
    `SELECT COUNT(*) AS order_count FROM shopkart.orders WHERE cart_id = ${concurrentCart.payload.cartId}`
  );
  assert.match(concurrentOrderCount, /order_count\s+1/);

  await migrateDatabase({ databaseUrl: mysql.getConnectionUri(), reset: true });
  const rowsAfterReset = await mysql.executeQuery("SELECT COUNT(*) AS order_count FROM shopkart.orders");
  assert.match(rowsAfterReset, /order_count\s+0/);
});

test("ShopKart runs the checkout lifecycle on PostgreSQL", async (t) => {
  const alicePassword = crypto.randomBytes(18).toString("base64url");
  const databasePassword = `${crypto.randomBytes(12).toString("hex")}@:${crypto.randomBytes(6).toString("hex")}`;
  const postgres = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("shopkart")
    .withUsername("shopkart_user")
    .withPassword(databasePassword)
    .start();
  let runtime;
  let database;
  t.after(async () => {
    if (database) await database.end();
    if (runtime) await runtime.close();
    await postgres.stop();
  });
  assert.match(postgres.getConnectionUri(), /%40%3A/);

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = postgres.getConnectionUri();
  process.env.SHOPKART_TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
  process.env.SHOPKART_ALICE_PASSWORD = alicePassword;
  process.env.SHOPKART_BOB_PASSWORD = crypto.randomBytes(18).toString("base64url");
  process.env.SHOPKART_CAROL_PASSWORD = crypto.randomBytes(18).toString("base64url");

  const [{ startServer }, { migrateDatabase }] = await Promise.all([
    import("../../src/server.js"),
    import("../../src/migrate.js")
  ]);
  runtime = await startServer({ port: 0, databaseUrl: postgres.getConnectionUri() });
  const baseUrl = `http://127.0.0.1:${runtime.port}`;

  const health = await jsonRequest(baseUrl, "/api/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.payload.database, "postgresql");

  const productSearch = await jsonRequest(baseUrl, "/api/products?q=bag");
  assert.equal(productSearch.response.status, 200);
  assert.deepEqual(productSearch.payload.map((product) => product.sku), ["SKU-BAG"]);

  const login = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "alice@shopkart.test", password: alicePassword }
  });
  assert.equal(login.response.status, 200);

  const cart = await jsonRequest(baseUrl, "/api/carts", {
    method: "POST",
    token: login.payload.token
  });
  assert.equal(cart.response.status, 201);

  const updatedCart = await jsonRequest(baseUrl, `/api/carts/${cart.payload.cartId}/items`, {
    method: "POST",
    token: login.payload.token,
    body: { sku: "SKU-BAG", qty: 2 }
  });
  assert.equal(updatedCart.response.status, 200);
  assert.equal(updatedCart.payload.totalPaise, 99800);

  const order = await jsonRequest(baseUrl, "/api/orders", {
    method: "POST",
    token: login.payload.token,
    body: { cartId: cart.payload.cartId, address: "UST Campus, Technopark, Trivandrum" }
  });
  assert.equal(order.response.status, 201);
  assert.equal(order.payload.status, "PLACED");
  assert.equal(order.payload.orderId, 7001);

  const duplicate = await jsonRequest(baseUrl, "/api/orders", {
    method: "POST",
    token: login.payload.token,
    body: { cartId: cart.payload.cartId, address: "UST Campus, Technopark, Trivandrum" }
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.payload.error.code, "CART_ALREADY_ORDERED");

  const cancelled = await jsonRequest(baseUrl, `/api/orders/${order.payload.orderId}/cancel`, {
    method: "POST",
    token: login.payload.token
  });
  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.payload.status, "CANCELLED");

  database = new PostgresClient({ connectionString: postgres.getConnectionUri() });
  await database.connect();
  assert.equal(Number((await database.query("SELECT COUNT(*) AS count FROM orders")).rows[0].count), 1);

  await migrateDatabase({ databaseUrl: postgres.getConnectionUri(), reset: true });
  assert.equal(Number((await database.query("SELECT COUNT(*) AS count FROM orders")).rows[0].count), 0);
});
