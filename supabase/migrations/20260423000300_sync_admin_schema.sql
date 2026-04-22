-- Support recovery for missing columns in subscription_items
-- Date: 2026-04-23 00:03:00

DO $$ 
BEGIN 
    -- 1. Ensure assigned_rider_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'assigned_rider_id') THEN
        ALTER TABLE public.subscription_items ADD COLUMN assigned_rider_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;

    -- 2. Ensure selected_weight exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'selected_weight') THEN
        ALTER TABLE public.subscription_items ADD COLUMN selected_weight INTEGER DEFAULT 1000;
    END IF;

    -- 3. Ensure unit_type exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'unit_type') THEN
        ALTER TABLE public.subscription_items ADD COLUMN unit_type TEXT DEFAULT 'ml';
    END IF;

    -- 4. Ensure price_per_unit exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_items' AND column_name = 'price_per_unit') THEN
        ALTER TABLE public.subscription_items ADD COLUMN price_per_unit NUMERIC DEFAULT 0;
    END IF;
    
    -- 5. Fix delivery_time constraint for 'both'
    ALTER TABLE public.subscription_items DROP CONSTRAINT IF EXISTS subscription_items_delivery_time_check;
    ALTER TABLE public.subscription_items ADD CONSTRAINT subscription_items_delivery_time_check 
        CHECK (delivery_time IN ('morning', 'evening', 'both'));

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration encountered an error, but proceeding...';
END $$;
