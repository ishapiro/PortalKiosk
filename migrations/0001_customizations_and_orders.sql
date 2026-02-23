-- Add max_selections to customization_options
ALTER TABLE customization_options
ADD COLUMN max_selections INTEGER;

-- Add customer_name, order_number, delivered_at to orders
ALTER TABLE orders
ADD COLUMN customer_name TEXT NOT NULL DEFAULT '';

ALTER TABLE orders
ADD COLUMN order_number INTEGER;

ALTER TABLE orders
ADD COLUMN delivered_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number
ON orders(order_number);

