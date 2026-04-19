-- Fix Product Visibility and RLS Policies
-- Execute this in the Supabase SQL Editor

-- 1. Ensure RLS is enabled on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing product selection policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- 3. Create broad SELECT policy for the website
-- This allows:
-- - Anonymous users (unlogged) to see products with is_active = true
-- - Logged in customers to see products with is_active = true
-- - Admins and Staff to see ALL products (active or not)
CREATE POLICY "Product Visibility Policy"
ON public.products FOR SELECT
USING (
  is_active = true 
  OR public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
);

-- 4. Ensure admins have full access (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix any potentially missing is_active values (though NOT NULL, good to be safe)
UPDATE public.products SET is_active = true WHERE is_active IS NULL;
