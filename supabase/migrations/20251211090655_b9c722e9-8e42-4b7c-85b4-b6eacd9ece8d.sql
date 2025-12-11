-- Add bilingual columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS title_ro text,
ADD COLUMN IF NOT EXISTS title_en text,
ADD COLUMN IF NOT EXISTS content_ro text,
ADD COLUMN IF NOT EXISTS content_en text;

-- Migrate existing data (copy current content to _ro columns, assuming most reviews are in Romanian)
UPDATE public.reviews 
SET title_ro = title, content_ro = content
WHERE title_ro IS NULL AND content_ro IS NULL;