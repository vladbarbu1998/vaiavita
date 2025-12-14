-- Allow anyone to increment coupon uses_count after using it at checkout
CREATE POLICY "Anyone can update coupon uses_count" 
ON public.coupons 
FOR UPDATE 
USING (is_active = true)
WITH CHECK (is_active = true);