ALTER TABLE carts
  ADD COLUMN coupon_code VARCHAR(20);

ALTER TABLE orders
  ADD COLUMN subtotal_paise INTEGER,
  ADD COLUMN discount_paise INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN coupon_code VARCHAR(20);

UPDATE orders
SET subtotal_paise = total_paise
WHERE subtotal_paise IS NULL;

ALTER TABLE orders
  ALTER COLUMN subtotal_paise SET NOT NULL;

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_subtotal_positive CHECK (subtotal_paise > 0),
  ADD CONSTRAINT chk_orders_discount_nonnegative CHECK (discount_paise >= 0);
