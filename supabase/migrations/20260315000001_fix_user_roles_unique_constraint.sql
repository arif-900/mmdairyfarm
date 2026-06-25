-- SAFE VERSION: Fix user_roles unique constraint
-- This version checks for existence before adding to avoid "already exists" errors

DO $$ 
BEGIN
    -- 1. Remove old composite unique constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_role_key;
    END IF;

    -- 2. Clean up duplicates (keep latest)
    DELETE FROM public.user_roles a
    USING public.user_roles b
    WHERE a.created_at < b.created_at
      AND a.user_id = b.user_id;

    -- 3. Add the unique constraint on user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key') THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
