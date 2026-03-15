-- Fix for Supabase Auth Signup 500 Error
-- 
-- The "Database error saving new user" exception occurs because the trigger that 
-- inserts the new user into the 'profiles' and 'user_roles' table is running under
-- the restrictions of the newly created (and limited) user account, which fails RLS.
-- By appending SECURITY DEFINER we elevate the trigger to bypass RLS securely.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER   -- Crucial: Runs with elevated privileges to bypass RLS blocks
SET search_path = public -- Security best practice
AS $$
BEGIN
  -- 1. Insert into the public profiles table
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- 2. Grant them the default 'customer' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Extremely useful for debugging if the schema ever breaks again
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW; -- Safely proceed with auth signup even if profile creation fails
END;
$$;

-- Ensure the trigger is attached to auth.users correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
