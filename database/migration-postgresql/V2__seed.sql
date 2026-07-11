INSERT INTO customers (id, persona, email, display_name)
VALUES
  (1, 'alice', 'alice@shopkart.test', 'Alice Rao'),
  (2, 'bob', 'bob@shopkart.test', 'Bob Mathew'),
  (3, 'carol', 'carol@shopkart.test', 'Carol Fernandes')
ON CONFLICT (id) DO UPDATE SET
  persona = EXCLUDED.persona,
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name;

SELECT setval(pg_get_serial_sequence('customers', 'id'), (SELECT MAX(id) FROM customers), true);

INSERT INTO products (sku, name, description, category, price_paise, stock, image_key)
VALUES
  ('SKU-BAG', 'Metro Carryall', 'Structured everyday bag with a padded laptop sleeve and weather-resistant finish.', 'Bags', 49900, 10, 'bag'),
  ('SKU-PEN', 'Precision Pen Set', 'Smooth-writing metal pens supplied in a compact presentation case.', 'Stationery', 9900, 100, 'pens'),
  ('SKU-MUG', 'Studio Ceramic Mug', 'Hand-finished ceramic mug with a comfortable handle and matte glaze.', 'Home', 24900, 3, 'mug'),
  ('SKU-CAP', 'Everyday Cap', 'Adjustable cotton cap reserved for the out-of-stock negative scenario.', 'Apparel', 39900, 0, 'cap'),
  ('SKU-TEE', 'Training Tee', 'Breathable cotton training tee with reinforced neck and shoulder seams.', 'Apparel', 59900, 25, 'tee'),
  ('SKU-KEY', 'Utility Key Organiser', 'Compact key organiser that keeps up to eight keys quiet and accessible.', 'Accessories', 14900, 50, 'keys'),
  ('SKU-BTL', 'Insulated Bottle', 'Double-wall bottle designed for commutes, workouts and long sessions.', 'Fitness', 34900, 18, 'bottle'),
  ('SKU-LMP', 'Focus Desk Lamp', 'Adjustable LED desk lamp with reading and focus modes.', 'Workspace', 79900, 8, 'lamp')
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price_paise = EXCLUDED.price_paise,
  stock = EXCLUDED.stock,
  image_key = EXCLUDED.image_key;
