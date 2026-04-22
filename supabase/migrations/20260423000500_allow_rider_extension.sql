-- Migration: Fix RLS Recursion for Riders (Security Definer Style)
-- Date: 2026-04-23 00:05:00

-- 1. Helper Function: Check if a user is the assigned rider for a subscription
-- We use SECURITY DEFINER to bypass RLS loops during the check
CREATE OR REPLACE FUNCTION public.is_assigned_rider_for_subscription(sub_id UUID, rider_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.subscription_items 
        WHERE subscription_id = sub_id 
        AND assigned_rider_id = rider_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up failing policies from previous attempt
DROP POLICY IF EXISTS "Riders can view assigned subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Riders can view own assigned items" ON public.subscription_items;
DROP POLICY IF EXISTS "Riders can extend own assigned items" ON public.subscription_items;

-- 3. Apply New SAFE Policies using the helper
CREATE POLICY "Riders can view assigned subscriptions (safe)" 
    ON public.subscriptions 
    FOR SELECT 
    USING (public.is_assigned_rider_for_subscription(id, auth.uid()));

CREATE POLICY "Riders can view assigned sub items (safe)" 
    ON public.subscription_items 
    FOR SELECT 
    USING (assigned_rider_id = auth.uid());

CREATE POLICY "Riders can extend assigned sub items (safe)" 
    ON public.subscription_items 
    FOR UPDATE 
    USING (assigned_rider_id = auth.uid())
    WITH CHECK (assigned_rider_id = auth.uid());

-- 4. Final verification of table grants
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.subscription_items TO authenticated;
