-- Allow anyone to read coupons for validation during checkout
CREATE POLICY "Anyone can read active coupons for validation" 
ON public.coupons 
FOR SELECT 
USING (is_active = true);