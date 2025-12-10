-- Add card description columns for product cards (72 char limit)
ALTER TABLE public.products
ADD COLUMN card_description_ro text,
ADD COLUMN card_description_en text;