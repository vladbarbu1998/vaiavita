-- Drop the insecure public SELECT policy that exposes all order data
DROP POLICY IF EXISTS "Customers can view their orders by email" ON public.orders;

-- Create a restrictive policy - only admins can view orders
-- Customers will access their order via the order confirmation page (which uses order_number from URL)
CREATE POLICY "Only admins can view orders"
ON public.orders
FOR SELECT
USING (is_admin(auth.uid()));