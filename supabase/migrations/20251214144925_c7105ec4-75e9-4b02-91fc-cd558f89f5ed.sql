-- Create a public view for reviews that excludes sensitive customer_email
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  id,
  product_id,
  customer_name,
  rating,
  title,
  title_ro,
  title_en,
  content,
  content_ro,
  content_en,
  images,
  is_approved,
  is_verified_purchase,
  created_at,
  order_id,
  review_token
FROM public.reviews
WHERE is_approved = true;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Drop the old public SELECT policy that exposes customer_email
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON public.reviews;

-- Create restrictive policy - only admins can SELECT from reviews table directly
CREATE POLICY "Only admins can view reviews"
ON public.reviews
FOR SELECT
USING (is_admin(auth.uid()));