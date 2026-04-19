-- Run this in your Supabase SQL Editor to enable Dynamic Weight-Based Pricing for the Admin Dashboard.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS base_price_per_kg NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS available_weights INTEGER[] DEFAULT '{250, 500, 1000}',
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'g',
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 4.6,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 39,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{Flavorful, Traditional}';

-- Update existing products to have a base price matching their standard price (if not already set)
UPDATE products 
SET base_price_per_kg = price 
WHERE base_price_per_kg IS NULL;

-- Notify that the schema has changed
COMMENT ON COLUMN products.base_price_per_kg IS 'Price per 1000g (1kg) of the product';
COMMENT ON COLUMN products.available_weights IS 'Array of selectable weights in grams/milliliters (e.g. {250, 500, 1000})';
