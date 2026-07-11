CREATE TABLE IF NOT EXISTS llm_users (
  id BIGSERIAL PRIMARY KEY, user_name VARCHAR(120) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS llm_products (
  id BIGSERIAL PRIMARY KEY, product_name VARCHAR(160) NOT NULL, sku VARCHAR(64) UNIQUE NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0), in_stock BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES llm_users(id),
  status VARCHAR(32) NOT NULL, total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id),
  product_id BIGINT NOT NULL REFERENCES llm_products(id), quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0)
);
INSERT INTO llm_users (id, user_name, email) VALUES
  (1, 'Asha Rao', 'asha@example.test'), (2, 'Vikram Shah', 'vikram@example.test'),
  (3, 'Mina Das', 'mina@example.test') ON CONFLICT DO NOTHING;
INSERT INTO llm_products (id, product_name, sku, price, in_stock) VALUES
  (1, 'Desk Lamp', 'LAMP-01', 39.00, TRUE), (2, 'Notebook', 'NOTE-01', 8.50, TRUE),
  (3, 'Travel Mug', 'MUG-01', 22.00, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO orders (id, user_id, status, total_amount, created_at) VALUES
  (1, 1, 'paid', 78.00, NOW() - INTERVAL '5 days'),
  (2, 2, 'paid', 25.50, NOW() - INTERVAL '3 days'),
  (3, 1, 'paid', 22.00, NOW() - INTERVAL '1 day') ON CONFLICT DO NOTHING;
INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 2, 39.00), (2, 2, 2, 3, 8.50), (3, 3, 3, 1, 22.00) ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('llm_users','id'), COALESCE(MAX(id), 1)) FROM llm_users;
SELECT setval(pg_get_serial_sequence('llm_products','id'), COALESCE(MAX(id), 1)) FROM llm_products;
SELECT setval(pg_get_serial_sequence('orders','id'), COALESCE(MAX(id), 1)) FROM orders;
SELECT setval(pg_get_serial_sequence('order_items','id'), COALESCE(MAX(id), 1)) FROM order_items;
