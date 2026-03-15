-- Enable realtime for orders table for admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;