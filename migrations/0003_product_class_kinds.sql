-- Add kind to product_classes to distinguish mains vs beverages
-- Values are free-form text but expected to be things like:
-- 'main', 'beverage', or 'other' for future flexibility.
ALTER TABLE product_classes
ADD COLUMN kind TEXT NOT NULL DEFAULT 'other';

