-- Add 'postal' to delivery_method enum
ALTER TYPE delivery_method ADD VALUE IF NOT EXISTS 'postal';