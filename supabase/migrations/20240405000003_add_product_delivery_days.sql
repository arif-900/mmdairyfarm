-- Change delivery_date to delivery_days (INTEGER) in products and order_items
ALTER TABLE products DROP COLUMN IF EXISTS delivery_date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_days INTEGER DEFAULT 0;

ALTER TABLE order_items DROP COLUMN IF EXISTS delivery_date;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivery_days INTEGER DEFAULT 0;
