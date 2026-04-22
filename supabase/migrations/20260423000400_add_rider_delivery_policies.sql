-- Migration: Add RLS Policies for Riders (Subscription Only)
-- Date: 2026-04-23 00:04:00

-- 1. Ensure RLS is enabled
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 2. View Policy: Riders can see SUBSCRIPTION deliveries assigned to them
DROP POLICY IF EXISTS "Riders can view assigned subscription deliveries" ON public.deliveries;
CREATE POLICY "Riders can view assigned subscription deliveries" 
    ON public.deliveries 
    FOR SELECT 
    USING (
        delivery_boy_id = auth.uid() 
        AND is_subscription = true
    );

-- 3. Update Policy: Riders can mark assigned SUBSCRIPTION deliveries as delivered/skipped
DROP POLICY IF EXISTS "Riders can update assigned subscription deliveries" ON public.deliveries;
CREATE POLICY "Riders can update assigned subscription deliveries" 
    ON public.deliveries 
    FOR UPDATE 
    USING (
        delivery_boy_id = auth.uid() 
        AND is_subscription = true
    );
