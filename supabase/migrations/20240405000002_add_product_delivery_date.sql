-- Add delivery_date column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_date DATE;
