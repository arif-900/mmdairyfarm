-- 1. DROP the old functions again just in case
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- 2. Recreate the bulletproof function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    role_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = _user_id
          AND user_roles.role::text = _role_param
    ) INTO role_exists;
    
    RETURN COALESCE(role_exists, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- 3. APPLY EXPLICIT GRANTS!
-- If the React app (authenticated users) isn't granted access, PostgREST returns 400 or 401/403!
GRANT ALL ON TABLE public.profiles TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.orders TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.order_items TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.products TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.user_roles TO authenticated, anon, service_role;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        GRANT ALL ON TABLE public.subscriptions TO authenticated, anon, service_role;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN
        GRANT ALL ON TABLE public.announcements TO authenticated, anon, service_role;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_logs') THEN
        GRANT ALL ON TABLE public.notification_logs TO authenticated, anon, service_role;
    END IF;
END $$;


-- 4. REBUILD POLICIES WITH EXPLICIT TYPES (::text) to prevent ambiguous function Resolution Crashes.

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

-- ORDERS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.orders;

CREATE POLICY "Enable read access for all users"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

CREATE POLICY "Enable insert for authenticated users only"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on email"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

-- ORDER ITEMS
DROP POLICY IF EXISTS "Enable read items" ON public.order_items;
CREATE POLICY "Enable read items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text))
));

-- SUBSCRIPTIONS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Enable read access for subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable insert for subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable update for subscriptions" ON public.subscriptions;

        CREATE POLICY "Enable read access for subscriptions"
        ON public.subscriptions FOR SELECT
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

        CREATE POLICY "Enable insert for subscriptions"
        ON public.subscriptions FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Enable update for subscriptions"
        ON public.subscriptions FOR UPDATE
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
