-- PostgreSQL Trigger to automatically decrement product stock upon order creation

-- 1. Create the function that will execute when an order item is inserted
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures it runs with elevated privileges to bypass RLS
AS $$
BEGIN
    -- Only deduct stock if the product actually has a stock column defined
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id AND stock >= NEW.quantity;

    -- If the update didn't happen because stock < quantity, it either means
    -- the frontend validation failed (race condition) or someone forced the API.
    -- We can either raise an exception to rollback the entire order, or let it slide.
    -- Raising an exception is safer to prevent negative stock!
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product ID %', NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Drop the trigger if it already exists to avoid duplication errors
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;

-- 3. Attach the trigger to the order_items table
CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_order();

-- 4. Notify PostgREST to recognize the new schema definitions
NOTIFY pgrst, 'reload schema';
