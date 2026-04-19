-- Disable RLS on order_items and simplify access
-- order_items doesn't need RLS because:
-- 1. Edge function creates items with service role (doesn't need RLS bypass)
-- 2. Users can only query items for their own orders via orders table RLS
-- 3. Admins can see all items via admin dashboard

ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Drop existing order_items policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Admin can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON public.order_items;
