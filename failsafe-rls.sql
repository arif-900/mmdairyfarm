-- Ultimate Failsafe RLS Policy Fix

-- 1. Drop the problematic function entirely to recreate it from scratch
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- 2. Create an ultra-safe function that catches any internal postgres errors
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

-- 3. Simplify Orders Policies (Fall back to basic auth check if needed to unblock)
DROP POLICY IF EXISTS "Customers view own, staff/admin view all" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own" ON public.orders;
DROP POLICY IF EXISTS "Staff and admin can update any order" ON public.orders;

CREATE POLICY "Enable read access for all users"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Enable insert for authenticated users only"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on email"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));


-- 4. Simplify Subscriptions Policies
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'subscriptions'
    ) THEN
        DROP POLICY IF EXISTS "Customer can view own subs, higher can view all" ON public.subscriptions;
        DROP POLICY IF EXISTS "Customer can insert own subs" ON public.subscriptions;
        DROP POLICY IF EXISTS "Customer can update own subs, higher can update all" ON public.subscriptions;

        CREATE POLICY "Enable read access for subscriptions"
        ON public.subscriptions FOR SELECT
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

        CREATE POLICY "Enable insert for subscriptions"
        ON public.subscriptions FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Enable update for subscriptions"
        ON public.subscriptions FOR UPDATE
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
    END IF;
END $$;

-- Force Cache Reload
NOTIFY pgrst, 'reload schema';
