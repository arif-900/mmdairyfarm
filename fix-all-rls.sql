-- Comprehensive RLS Fix for Staff and Admins

-- 1. Ensure has_role function is robust, accepting raw text to prevent casting crashes
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role text)
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
      AND role::text = _role
  )
$$;

-- 2. Clean up Subscriptions Policies (Dropping all previous versions)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'subscriptions'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;

        CREATE POLICY "Customer can view own subs, higher can view all"
        ON public.subscriptions FOR SELECT
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

        CREATE POLICY "Customer can insert own subs"
        ON public.subscriptions FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Customer can update own subs, higher can update all"
        ON public.subscriptions FOR UPDATE
        USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
    END IF;
END $$;

-- 3. Clean up Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
DROP POLICY IF EXISTS "Customers view own, staff/admin view all" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own" ON public.orders;
DROP POLICY IF EXISTS "Staff and admin can update any order" ON public.orders;

CREATE POLICY "Customers view own, staff/admin view all"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Customers insert own"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff and admin can update any order"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- 4. Clean up Order Items
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Customers view own items, staff/admin view all" ON public.order_items;
DROP POLICY IF EXISTS "Customers insert own items" ON public.order_items;

CREATE POLICY "Customers view own items, staff/admin view all"
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

CREATE POLICY "Customers insert own items"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
));

-- Inform PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
