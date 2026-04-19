-- Add 'delivery_boy' role to app_role enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'delivery_boy') THEN
        ALTER TYPE public.app_role ADD VALUE 'delivery_boy';
    END IF;
END $$;

-- Update RLS policies to include delivery_boy role
-- Profiles: allow delivery_boy to view their own profile (already covered by auth.uid() check usually, but let's be explicit if needed)
-- In ultimate-rls-fix.sql, it was:
-- USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'delivery_boy'));

-- Orders: allow delivery_boy to view assigned orders
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
CREATE POLICY "Enable read access for all users"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'delivery_boy'));

DROP POLICY IF EXISTS "Enable update for users based on email" ON public.orders;
CREATE POLICY "Enable update for users based on email"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'delivery_boy'));

-- Order Items: allow delivery_boy to view items for assigned orders
DROP POLICY IF EXISTS "Enable read items" ON public.order_items;
CREATE POLICY "Enable read items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'delivery_boy'))
));

-- Subscriptions: allow delivery_boy to view (if needed for delivery, though usually just orders)
DROP POLICY IF EXISTS "Enable read access for subscriptions" ON public.subscriptions;
CREATE POLICY "Enable read access for subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'delivery_boy'));

NOTIFY pgrst, 'reload schema';
