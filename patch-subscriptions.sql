-- Patch for missing columns in Subscriptions table
-- This resolves the "column 'frequency' does not exist" 400 Bad Request API error.

BEGIN;

-- Instead of CREATE TABLE IF NOT EXISTS which silently fails if the table exists but is missing columns,
-- we explicitly ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily' NOT NULL,
ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')),
ADD COLUMN IF NOT EXISTS delivery_address TEXT NOT NULL DEFAULT '';

COMMIT;

NOTIFY pgrst, 'reload schema';
