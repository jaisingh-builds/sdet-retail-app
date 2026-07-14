ALTER TABLE carts
  ADD COLUMN coupon_code VARCHAR(20) NULL;

ALTER TABLE orders
  ADD COLUMN subtotal_paise INT UNSIGNED NULL,
  ADD COLUMN discount_paise INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN coupon_code VARCHAR(20) NULL;

UPDATE orders
SET subtotal_paise = total_paise
WHERE subtotal_paise IS NULL;

ALTER TABLE orders
  MODIFY COLUMN subtotal_paise INT UNSIGNED NOT NULL;
