-- Drop the restrictive ALL policy that blocks anonymous inserts
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Recreate as PERMISSIVE policies for specific operations
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
USING (is_admin(auth.uid()));

-- Drop and recreate the INSERT policy as explicitly PERMISSIVE
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Also fix order_items table
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);