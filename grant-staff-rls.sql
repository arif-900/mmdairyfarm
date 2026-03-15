-- This script updates the database security policies so Staff members
-- can see and manage store data like Orders, Subscriptions, and Profiles.

-- First, ensure the has_role function accepts the staff role correctly
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));


-- ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
        orders.user_id = auth.uid() 
        OR public.has_role(auth.uid(), 'admin') 
        OR public.has_role(auth.uid(), 'staff')
    )
));


-- SUBSCRIPTIONS POLICIES (if the table exists from Phase 3)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'subscriptions'
    ) THEN
        DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
        CREATE POLICY "Users can view their own subscriptions"
        ON public.subscriptions FOR SELECT
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

        DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
        CREATE POLICY "Users can update their own subscriptions"
        ON public.subscriptions FOR UPDATE
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
    END IF;
END $$;


-- PROFILES POLICIES (so Staff can see customer names)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));


-- ANNOUNCEMENTS POLICIES
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'announcements'
    ) THEN
        DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
        CREATE POLICY "Admins can insert announcements"
        ON public.announcements FOR INSERT
        WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

        DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
        CREATE POLICY "Admins can update announcements"
        ON public.announcements FOR UPDATE
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

        DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
        CREATE POLICY "Admins can delete announcements"
        ON public.announcements FOR DELETE
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
    END IF;
END $$;

-- Inform PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
