-- Add additional locker columns for complete data storage
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS locker_city TEXT,
ADD COLUMN IF NOT EXISTS locker_postal_code TEXT,
ADD COLUMN IF NOT EXISTS locker_lat NUMERIC,
ADD COLUMN IF NOT EXISTS locker_lng NUMERIC;