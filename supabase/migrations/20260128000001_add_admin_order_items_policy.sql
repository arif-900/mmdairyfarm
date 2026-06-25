-- Add service role policy for order_items (allows create-checkout function to insert)
CREATE POLICY "Service role can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

-- Also update the existing user insert policy to allow anonymous/service operations
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;

CREATE POLICY "Users can insert order items for their orders"
ON public.order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
    )
);

