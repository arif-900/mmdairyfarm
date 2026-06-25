-- Migration to add "Coins as Reward" Feature

-- 1. Add reward_coins to user profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER NOT NULL DEFAULT 0;

-- 2. Add coins fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coins_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins_earned INTEGER NOT NULL DEFAULT 0;

-- 3. Trigger Function: Credit coins when an order is matched as delivered
CREATE OR REPLACE FUNCTION public.credit_earned_coins()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if the status changing directly to delivered
    IF OLD.status != 'delivered' AND NEW.status = 'delivered' AND NEW.coins_earned > 0 THEN
        UPDATE public.profiles
        SET reward_coins = reward_coins + NEW.coins_earned
        WHERE user_id = NEW.user_id;
    END IF;
    
    -- Refund used coins if an order changes to cancelled
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' AND NEW.coins_used > 0 THEN
        UPDATE public.profiles
        SET reward_coins = reward_coins + NEW.coins_used
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotency
DROP TRIGGER IF EXISTS on_order_delivered_or_cancelled ON public.orders;

-- 4. Create the trigger on the orders table
CREATE TRIGGER on_order_delivered_or_cancelled
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.credit_earned_coins();

-- 5. RPC Function: Allow users to cancel their own pending order
CREATE OR REPLACE FUNCTION public.cancel_my_pending_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.orders 
    SET status = 'cancelled' 
    WHERE id = p_order_id 
      AND user_id = auth.uid() 
      AND status = 'pending'
    RETURNING true INTO v_updated;

    RETURN COALESCE(v_updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
