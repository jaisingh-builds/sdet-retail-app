import { createDatabasePool, databaseDialect } from "./database-client.js";
import {
  cartTotalPaise,
  couponDiscountPaise,
  isSupportedCoupon,
  lineTotalPaise,
  normalizeCouponCode
} from "./pricing.js";

export class DomainError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function mapProduct(row) {
  return {
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    pricePaise: Number(row.price_paise),
    stock: Number(row.stock),
    imageKey: row.image_key
  };
}

function mapCartItem(row) {
  return {
    sku: row.sku,
    name: row.name,
    qty: Number(row.qty),
    unitPricePaise: Number(row.unit_price_paise),
    lineTotalPaise: lineTotalPaise(row.unit_price_paise, row.qty)
  };
}

export class ShopKartStore {
  constructor(pool, dialect) {
    this.pool = pool;
    this.dialect = dialect;
  }

  static create(databaseUrl) {
    return new ShopKartStore(createDatabasePool(databaseUrl), databaseDialect(databaseUrl));
  }

  async close() {
    await this.pool.end();
  }

  async ping() {
    await this.pool.query("SELECT 1");
  }

  async findCustomerByEmail(email) {
    const [rows] = await this.pool.execute(
      "SELECT id, persona, email, password_hash, display_name FROM customers WHERE email = ?",
      [email]
    );
    if (!rows[0]) {
      return null;
    }
    return {
      id: Number(rows[0].id),
      persona: rows[0].persona,
      email: rows[0].email,
      passwordHash: rows[0].password_hash,
      displayName: rows[0].display_name
    };
  }

  async listProducts(query = "") {
    const normalized = `%${String(query).trim().toLowerCase()}%`;
    const [rows] = await this.pool.execute(
      `SELECT sku, name, description, category, price_paise, stock, image_key
       FROM products
       WHERE ? = '%%' OR LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category) LIKE ?
       ORDER BY name`,
      [normalized, normalized, normalized, normalized]
    );
    return rows.map(mapProduct);
  }

  async findProduct(sku) {
    const [rows] = await this.pool.execute(
      `SELECT sku, name, description, category, price_paise, stock, image_key
       FROM products WHERE sku = ?`,
      [sku]
    );
    return rows[0] ? mapProduct(rows[0]) : null;
  }

  async createCart(customerId) {
    const [result] = await this.pool.execute(
      `INSERT INTO carts (customer_id, status) VALUES (?, 'OPEN')${this.dialect === "postgresql" ? " RETURNING id" : ""}`,
      [customerId]
    );
    const cartId = this.dialect === "postgresql" ? Number(result[0].id) : Number(result.insertId);
    return this.getCart(cartId, customerId);
  }

  async getCart(cartId, customerId) {
    const [cartRows] = await this.pool.execute(
      "SELECT id, customer_id, status, coupon_code, created_at FROM carts WHERE id = ?",
      [cartId]
    );
    const cart = cartRows[0];
    if (!cart) {
      throw new DomainError(404, "CART_NOT_FOUND", "Cart was not found");
    }
    if (Number(cart.customer_id) !== Number(customerId)) {
      throw new DomainError(403, "CART_FORBIDDEN", "The cart belongs to another customer");
    }

    const [itemRows] = await this.pool.execute(
      `SELECT ci.sku, p.name, ci.qty, ci.unit_price_paise
       FROM cart_items ci JOIN products p ON p.sku = ci.sku
       WHERE ci.cart_id = ? ORDER BY p.name`,
      [cartId]
    );
    const items = itemRows.map(mapCartItem);
    const subtotalPaise = cartTotalPaise(items);
    const couponCode = cart.coupon_code || null;
    const discountPaise = couponDiscountPaise(subtotalPaise, couponCode);
    return {
      id: Number(cart.id),
      cartId: Number(cart.id),
      status: cart.status,
      items,
      couponCode,
      subtotalPaise,
      discountPaise,
      totalPaise: subtotalPaise - discountPaise
    };
  }

  async applyCoupon(cartId, customerId, couponCode) {
    const normalizedCode = normalizeCouponCode(couponCode);
    if (!isSupportedCoupon(normalizedCode)) {
      throw new DomainError(400, "INVALID_COUPON", "Coupon code is not valid");
    }

    const cart = await this.getCart(cartId, customerId);
    if (cart.status !== "OPEN") {
      throw new DomainError(409, "CART_NOT_OPEN", "Only an open cart can accept a coupon");
    }
    if (cart.items.length === 0) {
      throw new DomainError(409, "EMPTY_CART", "Add an item before applying a coupon");
    }

    await this.pool.execute("UPDATE carts SET coupon_code = ? WHERE id = ?", [normalizedCode, cartId]);
    return this.getCart(cartId, customerId);
  }

  async addCartItem(cartId, customerId, sku, quantity) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw new DomainError(400, "INVALID_QUANTITY", "Quantity must be a positive integer");
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [cartRows] = await connection.execute(
        "SELECT id, customer_id, status, coupon_code FROM carts WHERE id = ? FOR UPDATE",
        [cartId]
      );
      const cart = cartRows[0];
      if (!cart) {
        throw new DomainError(404, "CART_NOT_FOUND", "Cart was not found");
      }
      if (Number(cart.customer_id) !== Number(customerId)) {
        throw new DomainError(403, "CART_FORBIDDEN", "The cart belongs to another customer");
      }
      if (cart.status !== "OPEN") {
        throw new DomainError(409, "CART_NOT_OPEN", "Only an open cart can be changed");
      }

      const [productRows] = await connection.execute(
        "SELECT sku, price_paise, stock FROM products WHERE sku = ?",
        [sku]
      );
      const product = productRows[0];
      if (!product) {
        throw new DomainError(404, "PRODUCT_NOT_FOUND", "Product was not found");
      }

      const [existingRows] = await connection.execute(
        "SELECT qty FROM cart_items WHERE cart_id = ? AND sku = ?",
        [cartId, sku]
      );
      const requestedTotal = Number(existingRows[0]?.qty || 0) + qty;
      if (requestedTotal > Number(product.stock)) {
        throw new DomainError(409, "OUT_OF_STOCK", `Only ${product.stock} unit(s) are available`);
      }

      const upsert = this.dialect === "postgresql"
        ? `INSERT INTO cart_items (cart_id, sku, qty, unit_price_paise)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (cart_id, sku) DO UPDATE
           SET qty = EXCLUDED.qty, unit_price_paise = EXCLUDED.unit_price_paise`
        : `INSERT INTO cart_items (cart_id, sku, qty, unit_price_paise)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE qty = VALUES(qty), unit_price_paise = VALUES(unit_price_paise)`;
      await connection.execute(
        upsert,
        [cartId, sku, requestedTotal, product.price_paise]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return this.getCart(cartId, customerId);
  }

  async placeOrder(cartId, customerId, address) {
    const cleanAddress = String(address || "").trim();
    if (cleanAddress.length < 10 || cleanAddress.length > 240) {
      throw new DomainError(400, "INVALID_ADDRESS", "Address must contain between 10 and 240 characters");
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [cartRows] = await connection.execute(
        "SELECT id, customer_id, status, coupon_code FROM carts WHERE id = ? FOR UPDATE",
        [cartId]
      );
      const cart = cartRows[0];
      if (!cart) {
        throw new DomainError(404, "CART_NOT_FOUND", "Cart was not found");
      }
      if (Number(cart.customer_id) !== Number(customerId)) {
        throw new DomainError(403, "CART_FORBIDDEN", "The cart belongs to another customer");
      }
      if (cart.status !== "OPEN") {
        throw new DomainError(409, "CART_ALREADY_ORDERED", "The cart has already been ordered");
      }

      const [itemRows] = await connection.execute(
        `SELECT ci.sku, p.name, ci.qty, ci.unit_price_paise
         FROM cart_items ci JOIN products p ON p.sku = ci.sku
         WHERE ci.cart_id = ? ORDER BY p.name FOR UPDATE`,
        [cartId]
      );
      const items = itemRows.map(mapCartItem);
      if (items.length === 0) {
        throw new DomainError(409, "EMPTY_CART", "An empty cart cannot be ordered");
      }
      const subtotalPaise = cartTotalPaise(items);
      const couponCode = cart.coupon_code || null;
      const discountPaise = couponDiscountPaise(subtotalPaise, couponCode);
      const totalPaise = subtotalPaise - discountPaise;

      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
           customer_id, cart_id, status, subtotal_paise, discount_paise, total_paise, coupon_code, address
         ) VALUES (?, ?, 'PLACED', ?, ?, ?, ?, ?)${this.dialect === "postgresql" ? " RETURNING id" : ""}`,
        [customerId, cartId, subtotalPaise, discountPaise, totalPaise, couponCode, cleanAddress]
      );
      const orderId = this.dialect === "postgresql" ? Number(orderResult[0].id) : Number(orderResult.insertId);
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, sku, name, qty, unit_price_paise, line_total_paise)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.sku, item.name, item.qty, item.unitPricePaise, item.lineTotalPaise]
        );
      }
      await connection.execute("UPDATE carts SET status = 'ORDERED' WHERE id = ?", [cartId]);
      await connection.commit();
      return this.getOrder(orderId, customerId);
    } catch (error) {
      await connection.rollback();
      if (error?.code === "ER_DUP_ENTRY" || error?.code === "23505") {
        throw new DomainError(409, "CART_ALREADY_ORDERED", "The cart has already been ordered");
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  async getOrder(orderId, customerId) {
    const [orderRows] = await this.pool.execute(
      `SELECT id, customer_id, cart_id, status, subtotal_paise, discount_paise,
              total_paise, coupon_code, address, created_at
       FROM orders WHERE id = ?`,
      [orderId]
    );
    const order = orderRows[0];
    if (!order) {
      throw new DomainError(404, "ORDER_NOT_FOUND", "Order was not found");
    }
    if (Number(order.customer_id) !== Number(customerId)) {
      throw new DomainError(403, "ORDER_FORBIDDEN", "The order belongs to another customer");
    }

    const [itemRows] = await this.pool.execute(
      `SELECT sku, name, qty, unit_price_paise, line_total_paise
       FROM order_items WHERE order_id = ? ORDER BY name`,
      [orderId]
    );
    return {
      id: Number(order.id),
      orderId: Number(order.id),
      customerId: Number(order.customer_id),
      cartId: Number(order.cart_id),
      status: order.status,
      couponCode: order.coupon_code || null,
      subtotalPaise: Number(order.subtotal_paise),
      discountPaise: Number(order.discount_paise),
      totalPaise: Number(order.total_paise),
      address: order.address,
      createdAt: new Date(order.created_at).toISOString(),
      items: itemRows.map((item) => ({
        sku: item.sku,
        name: item.name,
        qty: Number(item.qty),
        unitPricePaise: Number(item.unit_price_paise),
        lineTotalPaise: Number(item.line_total_paise)
      }))
    };
  }

  async cancelOrder(orderId, customerId) {
    const order = await this.getOrder(orderId, customerId);
    if (order.status !== "PLACED") {
      throw new DomainError(409, "ORDER_NOT_PLACED", "Only a placed order can be cancelled");
    }
    await this.pool.execute("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [orderId]);
    return this.getOrder(orderId, customerId);
  }
}
