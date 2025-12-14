-- Add IP address tracking to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Add IP address tracking to reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Add IP address tracking to contact_submissions
ALTER TABLE public.contact_submissions
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text;