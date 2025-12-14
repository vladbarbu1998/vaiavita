-- Drop the public SELECT policy that exposes all order items
DROP POLICY IF EXISTS "Order items viewable with order" ON public.order_items;

-- Add SELECT policy restricted to admins only
CREATE POLICY "Only admins can view order items"
ON public.order_items
FOR SELECT
USING (is_admin(auth.uid()));