-- Fix for the `create-staff` Edge Function 400 Error.
-- The Edge Function attempts to verify that the caller is an Admin by reading the `user_roles` table.
-- Because RLS is enabled, the API silently blocks the read and returns [] unless a SELECT policy exists.

-- 1. Ensure the table has public access granted
GRANT ALL ON TABLE public.user_roles TO authenticated, anon, service_role;

-- 2. Drop any conflicting policies
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- 3. Create a policy that allows Users to read their own role so the Edge Function can verify them
CREATE POLICY "Users can read their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create a policy allowing Admins to read all user roles (necessary for the Staff Management Tab lists)
CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::text));

-- 5. Force the Supabase PostgREST API to flush its cache and apply these rules immediately
NOTIFY pgrst, 'reload schema';
