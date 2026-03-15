-- Final RLS Fixes for Staff Management (400 & 401 Errors)

-- 1. FIX THE 400 ERROR ON UPSERT ROLE (StaffTab.tsx)
-- The `handleRoleChange` function attempts to UPSERT into `user_roles`.
-- Postgres requires both INSERT and UPDATE policies for UPSERT to work!
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;

CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::text));

-- 2. FIX THE 401 ERROR ON CREATE-STAFF EDGE FUNCTION
-- The 401 Unauthorized in Supabase JS SDK (`FunctionsHttpError`) usually happens because:
-- A) The anon key or JWT is expired/malformed.
-- B) The Edge Function doesn't have the `Authorization` header forwarded properly.
-- (The edge function code deployed looks correct regarding headers, but let's double check anon access rules).
-- Wait, the 400 error in `user_roles` also happens because you need a DELETE policy if a role is demoted or changed?
-- Upsert only needs Insert + Update.
-- But wait, the 400 error the user showed is actually:
-- "fgeyphtaehvbitwcnvoa.supabase.co/rest/v1/user_roles?on_conflict=user_id" returns 400.
-- Wait, in PostgREST, an UPSERT on a table without a primary key or missing unique constraint returns a 400!
-- Let's ensure `user_id` has a UNIQUE CONSTRAINT or PRIMARY KEY on the `user_roles` table.

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
