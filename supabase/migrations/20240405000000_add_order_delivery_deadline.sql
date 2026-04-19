-- Add order_delivery_days and expected_delivery_date to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_delivery_days INTEGER DEFAULT 3;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMP WITH TIME ZONE;

-- Optionally, set a default expected date for existing orders
UPDATE orders SET expected_delivery_date = created_at + interval '3 days' WHERE expected_delivery_date IS NULL;
