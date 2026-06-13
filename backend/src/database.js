import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mysql from "mysql2/promise";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envFile = process.env.ENV_FILE
  ? path.resolve(process.env.ENV_FILE)
  : path.resolve(currentDir, "../../.env");
dotenv.config({ path: envFile, quiet: true });

const connectionString = process.env.DATABASE_URL;
const connectionTimeout = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000);
const pool = connectionString
  ? mysql.createPool({ uri: connectionString, connectTimeout: connectionTimeout, connectionLimit: 5 })
  : null;

export function databaseEnabled() {
  return pool !== null;
}

export function databaseConnectionSummary() {
  if (!connectionString) {
    return "DATABASE_URL is not configured";
  }

  try {
    const url = new URL(connectionString);
    const port = url.port || "3306";
    const database = url.pathname.replace(/^\//, "") || "<missing>";
    return `${url.protocol}//${url.username || "<missing-user>"}:***@${url.hostname}:${port}/${database}`;
  } catch {
    return "DATABASE_URL is set but is not a valid MySQL URL";
  }
}

export function databaseFailureMessage(error) {
  const code = error?.code || error?.cause?.code || "UNKNOWN";
  const detail = error?.message || String(error);
  const networkCodes = new Set(["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"]);

  if (networkCodes.has(code) || /timeout|connect|network|socket/i.test(detail)) {
    return [
      "MySQL target was configured, but the network connection failed.",
      "Check that the MySQL service is running and that host localhost and TCP port 3306 are available.",
      "Corporate firewall, VPN, or Zscaler matters only when connecting to a remote MySQL host.",
      `Driver error: ${code} - ${detail}`
    ].join("\n");
  }

  if (code === "ER_ACCESS_DENIED_ERROR") {
    return `MySQL rejected the username or password.\nDriver error: ${code} - ${detail}`;
  }

  if (code === "ER_BAD_DB_ERROR") {
    return `The database in DATABASE_URL does not exist. Create it with: CREATE DATABASE sdet_retail;\nDriver error: ${code} - ${detail}`;
  }

  if (code === "ER_DBACCESS_DENIED_ERROR" || code === "ER_TABLEACCESS_DENIED_ERROR") {
    return `The MySQL user does not have permission to create or use the orders table.\nDriver error: ${code} - ${detail}`;
  }

  return `MySQL initialization failed.\nDriver error: ${code} - ${detail}`;
}

export async function initializeDatabase(seedOrder) {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(40) NOT NULL UNIQUE,
      status VARCHAR(30) NOT NULL,
      payment VARCHAR(30) NOT NULL,
      payment_method VARCHAR(40) NOT NULL,
      channel VARCHAR(20) NOT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(12, 2) NOT NULL,
      shipping DECIMAL(12, 2) NOT NULL,
      discount DECIMAL(12, 2) NOT NULL,
      total DECIMAL(12, 2) NOT NULL,
      address VARCHAR(180) NOT NULL,
      delivery_slot VARCHAR(80),
      user_id VARCHAR(80) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) AUTO_INCREMENT = 6001
  `);

  await pool.execute(
    `INSERT IGNORE INTO orders (
       id, order_number, status, payment, payment_method, channel, items,
       subtotal, shipping, discount, total, address, delivery_slot, user_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      seedOrder.id,
      seedOrder.orderNumber,
      seedOrder.status,
      seedOrder.payment,
      seedOrder.paymentMethod,
      seedOrder.channel,
      JSON.stringify(seedOrder.items),
      seedOrder.subtotal,
      seedOrder.shipping,
      seedOrder.discount,
      seedOrder.total,
      seedOrder.address,
      seedOrder.deliverySlot,
      "svc-retail-ops"
    ]
  );
}

export async function insertOrder(order, userId) {
  const [result] = await pool.execute(
    `INSERT INTO orders (
       order_number, status, payment, payment_method, channel, items,
       subtotal, shipping, discount, total, address, delivery_slot, user_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.orderNumber,
      order.status,
      order.payment,
      order.paymentMethod,
      order.channel,
      JSON.stringify(order.items),
      order.subtotal,
      order.shipping,
      order.discount,
      order.total,
      order.address,
      order.deliverySlot,
      userId
    ]
  );

  return findOrder(result.insertId);
}

export async function findOrder(orderId) {
  const [rows] = await pool.execute("SELECT * FROM orders WHERE id = ?", [orderId]);
  return rows[0] ? mapOrderRow(rows[0]) : null;
}

export async function deleteOrder(orderId) {
  const [result] = await pool.execute("DELETE FROM orders WHERE id = ?", [orderId]);
  return result.affectedRows;
}

export async function updateOrderStatus(orderId, expectedStatus, nextStatus) {
  const [result] = await pool.execute(
    "UPDATE orders SET status = ? WHERE id = ? AND status = ?",
    [nextStatus, orderId, expectedStatus]
  );
  return result.affectedRows === 1 ? findOrder(orderId) : null;
}

function mapOrderRow(row) {
  return {
    id: Number(row.id),
    orderId: Number(row.id),
    orderNumber: row.order_number,
    status: row.status,
    payment: row.payment,
    paymentMethod: row.payment_method,
    channel: row.channel,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount),
    total: Number(row.total),
    address: row.address,
    deliverySlot: row.delivery_slot,
    userId: row.user_id,
    createdAt: row.created_at.toISOString()
  };
}
