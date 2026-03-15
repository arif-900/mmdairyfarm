-- Migrating the Products table to support Stock Management

-- 1. Add the stock column with a default of 0 and prevent negative stock.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0);

-- 2. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
