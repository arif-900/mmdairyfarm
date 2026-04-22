-- Security Hardening: Function Search Paths, RLS, and Storage
-- Resolves multiple Supabase linter warnings (0011, 0024, 0025)

-- ==========================================
-- 1. SECURE FUNCTION SEARCH PATHS (Lint 0011)
-- ==========================================
-- Standardizes functions to use 'public' search_path, preventing search-path injection.
-- We use a robust DO block to apply these safely without failing on signature mismatches.

DO $$ 
DECLARE 
    f_name TEXT;
    f_sig TEXT;
    functions_to_harden TEXT[] := ARRAY[
        'update_stock_status', 'check_email_exists', 'generate_delivery_otp', 
        'decrement_stock_on_order', 'set_order_delivery_otp', 
        'update_announcements_updated_at', 'count_remaining_deliveries', 
        'activate_subscription_v2', 'credit_earned_coins', 'upper', 
        'get_rider_subscription_ids', 'is_assigned_rider_for_subscription', 
        'log_order_status_update', 'get_agent_cash_in_hand', 
        'refund_order_to_wallet', 'update_timestamp_column', 
        'sync_order_collection_to_ledger', 'refund_subscription_to_wallet', 
        'create_simple_order', 'update_updated_at_column'
    ];
BEGIN 
    FOREACH f_name IN ARRAY functions_to_harden LOOP
        -- Find the exact signature for the function in the public schema
        FOR f_sig IN 
            SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' 
              AND p.proname = f_name
        LOOP
            IF f_sig IS NOT NULL THEN
                EXECUTE format('ALTER FUNCTION %s SET search_path = public', f_sig);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ==========================================
-- 2. HARDEN CHAT_HISTORY RLS (Lint 0024)
-- ==========================================
-- Replaces overly permissive 'WITH CHECK (true)' with role-based validation.

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_history' AND schemaname = 'public') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

        -- Drop permissive policy
        DROP POLICY IF EXISTS "Enable insert for all users" ON public.chat_history;

        -- Create more secure policy (Authenticated only)
        CREATE POLICY "Authenticated users can insert chat" 
        ON public.chat_history FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');

        -- Ensure users can only see their own chat history
        DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_history' AND column_name = 'user_id') THEN
            CREATE POLICY "Users can view own chat history" 
            ON public.chat_history FOR SELECT 
            USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- ==========================================
-- 3. RESTRICT STORAGE BUCKET LISTING (Lint 0025)
-- ==========================================
-- Prevents broad listing of production_videos contents while maintaining read access.

DO $$ 
BEGIN 
    -- Only refine if the bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'production_videos') THEN
        -- Drop the broad policies identified by the linter
        DROP POLICY IF EXISTS "Public Read Access 1uqy65a_0" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Delete Access 1uqy65a_1" ON storage.objects;

        -- Create a secure SELECT policy: Allow reading but NOT broad listing
        -- For a public bucket, objects are accessible via public URL even without a 
        -- SELECT policy on storage.objects. Removing the broad policy prevents
        -- discovery of all files via the API.
        
        -- If admins/staff need to list files specifically:
        CREATE POLICY "Admin/Staff can manage production videos"
        ON storage.objects FOR ALL
        TO authenticated
        USING (
            bucket_id = 'production_videos' 
            AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
        );
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
