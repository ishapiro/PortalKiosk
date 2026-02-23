-- Product classes (e.g. Drinks, Sandwiches, Sides)
CREATE TABLE IF NOT EXISTS product_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products (menu items)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_class_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_class_id) REFERENCES product_classes(id)
);

CREATE INDEX IF NOT EXISTS idx_products_class ON products(product_class_id);

-- Customization definitions (toppings, sides, etc.)
CREATE TABLE IF NOT EXISTS customization_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  product_class_id INTEGER,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'single',
  options_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (product_class_id) REFERENCES product_classes(id)
);

CREATE INDEX IF NOT EXISTS idx_customization_product ON customization_options(product_id);
CREATE INDEX IF NOT EXISTS idx_customization_class ON customization_options(product_class_id);

-- Stations (kiosks / display devices)
CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'kiosk',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Which product classes a station can show
CREATE TABLE IF NOT EXISTS station_product_classes (
  station_id TEXT NOT NULL,
  product_class_id INTEGER NOT NULL,
  PRIMARY KEY (station_id, product_class_id),
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (product_class_id) REFERENCES product_classes(id)
);

-- Orders (each has a status)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL DEFAULT 'new',
  station_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Order items (line items with customizations)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_class_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  customizations_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (product_class_id) REFERENCES product_classes(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_class ON order_items(product_class_id);
