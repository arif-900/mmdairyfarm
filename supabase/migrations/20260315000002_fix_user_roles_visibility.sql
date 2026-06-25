-- Fix user_roles RLS to allow admins and staff to view all roles
-- This is necessary for the management dashboards to find delivery boys and staff members

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins and Staff can view all roles"
ON public.user_roles FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- Also ensure admins can manage roles if they need to manually through the SQL editor or future UI
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
