-- Add locker_locality_id column to orders table for Ecolet API requirement
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS locker_locality_id integer;