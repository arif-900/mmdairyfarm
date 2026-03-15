-- Ultimate SQL RLS Fix with Explicit Drops
-- The `CASCADE` on the function didn't delete the `products` policies because they weren't linked tightly,
-- so this script explicitly drops EVERYTHING first to guarantee a clean slate.

-- 1. DROP the old function
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


-- REBUILD 1: PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));


-- REBUILD 2: ANNOUNCEMENTS
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


-- REBUILD 3: PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));


-- REBUILD 4: ORDERS
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
DROP POLICY IF EXISTS "Customers view own, staff/admin view all" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own" ON public.orders;
DROP POLICY IF EXISTS "Staff and admin can update any order" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.orders;

CREATE POLICY "Enable read access for all users"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Enable insert for authenticated users only"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on email"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));


-- REBUILD 5: ORDER ITEMS
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers view own items, staff/admin view all" ON public.order_items;
DROP POLICY IF EXISTS "Customers insert own items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Enable read items" ON public.order_items;

CREATE POLICY "Enable read items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
));


-- REBUILD 6: SUBSCRIPTIONS
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'subscriptions'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Customer can view own subs, higher can view all" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable read access for subscriptions" ON public.subscriptions;
        
        DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Customer can insert own subs" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable insert for subscriptions" ON public.subscriptions;
        
        DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Customer can update own subs, higher can update all" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable update for subscriptions" ON public.subscriptions;

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

NOTIFY pgrst, 'reload schema';
