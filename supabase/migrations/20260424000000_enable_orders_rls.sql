-- Standardize and Enable RLS for Orders and Order Items
-- Resolves Supabase Linter errors and ensures proper security enforcement.

-- ==========================================
-- 1. CLEANUP STALE POLICIES
-- ==========================================

-- Drop all existing policies on orders table (consolidating from various migrations)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders in their tenant" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff and admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders in their tenant" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff and above can update orders in tenant" ON public.orders;
DROP POLICY IF EXISTS "Staff can view assigned orders" ON public.orders;

-- Drop all existing policies on order_items table
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view assigned order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable read items" ON public.order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Admin can insert order items" ON public.order_items;

-- ==========================================
-- 2. ENABLE RLS
-- ==========================================

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. ORDERS POLICIES
-- ==========================================

-- SELECT: Users (own), Staff/Admins (all)
CREATE POLICY "Orders read access"
ON public.orders FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'delivery_boy')  -- Delivery boys need to see orders too
);

-- INSERT: Authenticated users can create their own orders
CREATE POLICY "Orders insert access"
ON public.orders FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
);

-- UPDATE: Admins and Staff can update everything; Users can update status to 'cancelled' for their own pending orders
CREATE POLICY "Orders update access"
ON public.orders FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'delivery_boy')
    OR (auth.uid() = user_id AND status = 'pending')
);

-- DELETE: Strictly Admins only
CREATE POLICY "Orders delete access"
ON public.orders FOR DELETE
USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
);

-- ==========================================
-- 4. ORDER_ITEMS POLICIES
-- ==========================================

-- SELECT: Users (own items), Staff/Admins (all items for analytics)
-- This ensures that OverviewTab analytics work across all items for admins.
CREATE POLICY "Order items read access"
ON public.order_items FOR SELECT
USING (
    public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'delivery_boy')
    OR EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- INSERT: Authenticated users (via order ownership) or Service Role (edge functions)
CREATE POLICY "Order items insert access"
ON public.order_items FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- UPDATE: Admins and Staff
CREATE POLICY "Order items update access"
ON public.order_items FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'delivery_boy')
);

-- DELETE: Admins
CREATE POLICY "Order items delete access"
ON public.order_items FOR DELETE
USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
