-- Add background_gif column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS background_gif TEXT;
