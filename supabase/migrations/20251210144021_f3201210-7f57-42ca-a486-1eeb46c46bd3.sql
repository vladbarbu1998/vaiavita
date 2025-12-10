-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload review images
CREATE POLICY "Anyone can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reviews');

-- Allow public read access to review images
CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reviews');

-- Allow deletion of own uploaded images (by path matching)
CREATE POLICY "Users can delete their uploaded review images"
ON storage.objects FOR DELETE
USING (bucket_id = 'reviews');

-- Add images column to reviews table if not exists
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::TEXT[];