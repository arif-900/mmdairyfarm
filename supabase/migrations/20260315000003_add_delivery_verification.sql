-- Add delivery_otp to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_otp TEXT;

-- Function to generate a random 6-digit OTP
CREATE OR REPLACE FUNCTION generate_delivery_otp() 
RETURNS TEXT AS $$
DECLARE
    otp TEXT;
BEGIN
    otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN otp;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set delivery_otp on order creation
CREATE OR REPLACE FUNCTION set_order_delivery_otp() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_otp IS NULL THEN
        NEW.delivery_otp := generate_delivery_otp();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_set_order_delivery_otp ON public.orders;
CREATE TRIGGER tr_set_order_delivery_otp
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION set_order_delivery_otp();

-- Populate OTP for existing orders if empty
UPDATE public.orders 
SET delivery_otp = generate_delivery_otp() 
WHERE delivery_otp IS NULL;
