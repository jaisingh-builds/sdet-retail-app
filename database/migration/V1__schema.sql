CREATE TABLE IF NOT EXISTS customers (
  id BIGINT NOT NULL AUTO_INCREMENT,
  persona VARCHAR(30) NOT NULL,
  email VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'ENV_REQUIRED',
  display_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customers_persona (persona),
  UNIQUE KEY uk_customers_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  sku VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price_paise INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL,
  image_key VARCHAR(80) NOT NULL,
  PRIMARY KEY (sku),
  CONSTRAINT chk_products_price CHECK (price_paise > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  status ENUM('OPEN', 'ORDERED') NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_carts_customer_status (customer_id, status),
  CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id BIGINT NOT NULL,
  sku VARCHAR(30) NOT NULL,
  qty INT UNSIGNED NOT NULL,
  unit_price_paise INT UNSIGNED NOT NULL,
  PRIMARY KEY (cart_id, sku),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (sku) REFERENCES products(sku),
  CONSTRAINT chk_cart_items_qty CHECK (qty > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  cart_id BIGINT NOT NULL,
  status ENUM('PLACED', 'CANCELLED') NOT NULL DEFAULT 'PLACED',
  total_paise INT UNSIGNED NOT NULL,
  address VARCHAR(240) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_cart (cart_id),
  KEY idx_orders_customer (customer_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_orders_cart FOREIGN KEY (cart_id) REFERENCES carts(id)
) ENGINE=InnoDB AUTO_INCREMENT=7001;

CREATE TABLE IF NOT EXISTS order_items (
  order_id BIGINT NOT NULL,
  sku VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  qty INT UNSIGNED NOT NULL,
  unit_price_paise INT UNSIGNED NOT NULL,
  line_total_paise INT UNSIGNED NOT NULL,
  PRIMARY KEY (order_id, sku),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;
