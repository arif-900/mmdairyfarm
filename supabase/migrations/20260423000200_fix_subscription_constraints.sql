-- Migration: Ensure delivery_time allows 'both' and verify columns
-- Date: 2026-04-23 00:02:00

-- 1. Support 'both' slot in subscription_items if not already present
DO $$ 
BEGIN 
    -- We can't easily check check constraints by name in a portable way without a few joins, 
    -- so we'll just drop and recreate to be sure.
    ALTER TABLE public.subscription_items DROP CONSTRAINT IF EXISTS subscription_items_delivery_time_check;
    ALTER TABLE public.subscription_items ADD CONSTRAINT subscription_items_delivery_time_check 
        CHECK (delivery_time IN ('morning', 'evening', 'both'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update delivery_time constraint. It might not exist as a named constraint.';
END $$;

-- 2. Audit and ensure columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'selected_weight') THEN
        ALTER TABLE public.subscription_items ADD COLUMN selected_weight INTEGER DEFAULT 1000;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'unit_type') THEN
        ALTER TABLE public.subscription_items ADD COLUMN unit_type TEXT DEFAULT 'ml';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'price_per_unit') THEN
        ALTER TABLE public.subscription_items ADD COLUMN price_per_unit NUMERIC DEFAULT 0;
    END IF;
END $$;
