-- Employees who can work on orders at the station
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Track which employee is preparing an order
ALTER TABLE orders
ADD COLUMN preparing_employee_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_orders_preparing_employee
ON orders(preparing_employee_id);

