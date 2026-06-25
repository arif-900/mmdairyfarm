-- 1. Create Enums for COD Ledger
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cod_tx_type') THEN
        CREATE TYPE public.cod_tx_type AS ENUM ('COLLECTION', 'SETTLEMENT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cod_tx_status') THEN
        CREATE TYPE public.cod_tx_status AS ENUM ('COLLECTED', 'SUBMITTED', 'VERIFIED');
    END IF;
END $$;

-- 2. Create the COD Ledger Table
CREATE TABLE IF NOT EXISTS public.cod_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type public.cod_tx_type NOT NULL,
    status public.cod_tx_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Enable RLS
ALTER TABLE public.cod_ledger ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Agents can view their own ledger" ON public.cod_ledger;
CREATE POLICY "Agents can view their own ledger"
ON public.cod_ledger FOR SELECT
USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents can insert settlement requests" ON public.cod_ledger;
CREATE POLICY "Agents can insert settlement requests"
ON public.cod_ledger FOR INSERT
WITH CHECK (auth.uid() = agent_id AND type = 'SETTLEMENT' AND status = 'SUBMITTED');

DROP POLICY IF EXISTS "Admins and Staff can manage all ledger entries" ON public.cod_ledger;
CREATE POLICY "Admins and Staff can manage all ledger entries"
ON public.cod_ledger FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- 5. Helper Function to get current cash in hand for an agent
CREATE OR REPLACE FUNCTION public.get_agent_cash_in_hand(p_agent_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_collected DECIMAL;
    v_settled DECIMAL;
BEGIN
    -- Sum all collections (which are implicitly verified once marked collected by agent/admin)
    SELECT COALESCE(SUM(amount), 0) INTO v_collected
    FROM public.cod_ledger
    WHERE agent_id = p_agent_id AND type = 'COLLECTION';

    -- Sum all verified settlements
    SELECT COALESCE(SUM(amount), 0) INTO v_settled
    FROM public.cod_ledger
    WHERE agent_id = p_agent_id AND type = 'SETTLEMENT' AND status = 'VERIFIED';

    RETURN v_collected - v_settled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_cod_ledger_agent ON public.cod_ledger(agent_id);
CREATE INDEX IF NOT EXISTS idx_cod_ledger_status ON public.cod_ledger(status);
-- 7. Trigger to sync orders.is_cash_collected with cod_ledger
CREATE OR REPLACE FUNCTION public.sync_order_collection_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
    -- If marked as collected
    IF (NEW.is_cash_collected = true AND (OLD.is_cash_collected = false OR OLD.is_cash_collected IS NULL)) THEN
        -- Only if it's a COD order and has an agent
        IF (NEW.payment_method = 'cod' AND NEW.assigned_to IS NOT NULL AND NEW.total_amount IS NOT NULL) THEN
            -- Check if entry already exists to prevent duplicates
            IF NOT EXISTS (SELECT 1 FROM public.cod_ledger WHERE order_id = NEW.id AND type = 'COLLECTION') THEN
                INSERT INTO public.cod_ledger (agent_id, order_id, amount, type, status, created_by)
                VALUES (
                    NEW.assigned_to, 
                    NEW.id, 
                    NEW.total_amount, 
                    'COLLECTION', 
                    'COLLECTED', 
                    COALESCE(auth.uid(), NEW.assigned_to) -- Fallback to agent ID if system/API update
                );
            END IF;
        END IF;
    -- If marked as NOT collected (manual correction/reversal)
    ELSIF (NEW.is_cash_collected = false AND OLD.is_cash_collected = true) THEN
        DELETE FROM public.cod_ledger 
        WHERE order_id = NEW.id AND type = 'COLLECTION' AND status = 'COLLECTED';
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: If anything fails, still allow the order update but log the error (if possible)
    -- In Supabase, we can't easily log to a file, but we can prevent the whole transaction from failing
    RAISE WARNING 'Ledger sync failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_order_collection_to_ledger ON public.orders;
CREATE TRIGGER trg_sync_order_collection_to_ledger
AFTER UPDATE OF is_cash_collected ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_collection_to_ledger();
