-- Add INSERT policy for anonymous users to create orders
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Add INSERT policy for anonymous users to create order items
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);