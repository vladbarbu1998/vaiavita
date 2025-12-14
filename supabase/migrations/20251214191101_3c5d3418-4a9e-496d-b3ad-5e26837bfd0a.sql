-- Allow anyone to view approved reviews (fixes public_reviews view for anonymous users)
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);