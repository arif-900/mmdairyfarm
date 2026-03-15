-- First, ensure the ENUM exists (it should now, but just in case)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Give the API roles permission to read/write this table
GRANT ALL ON TABLE public.user_roles TO authenticated, anon, service_role;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it somehow exists to avoid errors
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- RLS Policy: Users can strictly only read their own role (Prevents unauthorized rank sniffing)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Also, let's make sure that whenever a regular new customer signs up, they get the 'customer' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create cart for user (fail-safe)
    INSERT INTO public.carts (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    
    -- Assign customer role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Safely recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inform PostgREST to reload its schema cache to stop the 404 error!
NOTIFY pgrst, 'reload schema';
