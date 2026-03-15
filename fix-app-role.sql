-- This script patches the database `app_role` enum type to officially include the `staff` variable,
-- preventing edge functions from throwing 500 fatal Postgres errors when assigning this role!

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
