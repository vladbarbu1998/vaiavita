-- Add locker details columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS locker_name TEXT,
ADD COLUMN IF NOT EXISTS locker_address TEXT,
ADD COLUMN IF NOT EXISTS ecolet_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ecolet_sync_error TEXT;