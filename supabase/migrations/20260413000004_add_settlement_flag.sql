-- Add settlement_requested flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS settlement_requested BOOLEAN DEFAULT FALSE;

-- Update RLS for profiles to allow admins/staff to update this flag
-- Assuming an 'app_role' enum exists based on types.ts
DROP POLICY IF EXISTS "Admins and staff can update settlement_requested" ON public.profiles;

CREATE POLICY "Admins and staff can update settlement_requested"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
);

-- Grant select on the new column (public profiles might already have select)
GRANT SELECT (settlement_requested) ON public.profiles TO authenticated;
GRANT UPDATE (settlement_requested) ON public.profiles TO authenticated;
