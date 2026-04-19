-- Add delivery_date column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivery_date DATE;
