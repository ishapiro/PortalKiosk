-- System-wide key/value settings (e.g. kiosk thank-you message)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Initialize last order number so visible order numbers start high
INSERT OR IGNORE INTO system_settings (key, value)
VALUES ('last_order_number', '1134');

