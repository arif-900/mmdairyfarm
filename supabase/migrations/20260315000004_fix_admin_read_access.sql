-- Fix admin read access for production dashboard
-- Grants admin/superadmin roles proper SELECT access to orders, profiles, order_items

-- =====================
-- ORDERS TABLE
-- =====================
-- Allow admins to read all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'staff')
);

-- =====================
-- PROFILES TABLE
-- =====================
-- Allow admins to read all profiles (needed for customer name mapping in Orders tab)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'staff')
);

-- =====================
-- ORDER_ITEMS TABLE
-- =====================
-- Ensure RLS is disabled on order_items (for admin analytics in OverviewTab)
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Drop any stale conflicting policies
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Admin can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON public.order_items;

-- =====================
-- SUBSCRIPTIONS TABLE
-- =====================
-- Allow admins to read all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'staff')
);

-- =====================
-- ORDER_FEEDBACK TABLE
-- =====================
-- Allow admins and staff to read all feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.order_feedback;
CREATE POLICY "Admins can view all feedback"
ON public.order_feedback FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'staff')
);

-- =====================
-- ANNOUNCEMENTS TABLE
-- =====================
-- Allow admins and staff to manage announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'staff')
);

-- =====================
-- USER_ROLES TABLE
-- =====================
-- Allow admins and staff to view all roles (needed for finding delivery boys)
DROP POLICY IF EXISTS "Admins and Staff can view all roles" ON public.user_roles;
CREATE POLICY "Admins and Staff can view all roles"
ON public.user_roles FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- =====================
-- PRODUCTS TABLE
-- =====================
-- Ensure admins and staff can manage products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'staff')
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
