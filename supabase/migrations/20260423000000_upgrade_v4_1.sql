-- Upgrade to V4.1: Guided Subscriptions & Hybrid Delivery Model
-- Date: 2026-04-23 00:00:00

-- 1. Support 'both' in subscription_items.delivery_time
ALTER TABLE public.subscription_items DROP CONSTRAINT IF EXISTS subscription_items_delivery_time_check;
ALTER TABLE public.subscription_items ADD CONSTRAINT subscription_items_delivery_time_check 
    CHECK (delivery_time IN ('morning', 'evening', 'both'));

-- 2. Add assigned_rider_id to subscription_items for the Hybrid Model (Default Rider)
ALTER TABLE public.subscription_items ADD COLUMN IF NOT EXISTS assigned_rider_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 3. Add delivery_slot and delivery_boy_id to deliveries
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_slot TEXT CHECK (delivery_slot IN ('morning', 'evening'));
-- delivery_boy_id added in V3.1 but ensuring consistency
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_boy_id') THEN
        ALTER TABLE public.deliveries ADD COLUMN delivery_boy_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable RLS and Policies for new columns (if applicable)
-- No new tables, just columns, so existing RLS for Staff/Admin covers it.
