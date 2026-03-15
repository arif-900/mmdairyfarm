-- 1. Ensure the authenticated and anon roles have access to the table
GRANT ALL ON TABLE public.products TO authenticated, anon, service_role;

-- 2. Drop existing policies to cleanly recreate them
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- 3. Create proper policies using the explicit ::text cast for the has_role function
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

-- 4. Force schema cache reload
NOTIFY pgrst, 'reload schema';
