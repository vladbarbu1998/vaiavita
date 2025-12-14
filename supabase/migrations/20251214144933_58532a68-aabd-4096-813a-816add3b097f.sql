-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews 
WITH (security_invoker = true)
AS
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