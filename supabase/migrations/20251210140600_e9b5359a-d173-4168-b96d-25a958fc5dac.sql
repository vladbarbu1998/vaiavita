-- Create product_categories junction table for many-to-many relationship
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Enable Row Level Security
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Product categories are viewable by everyone" 
ON public.product_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product categories" 
ON public.product_categories 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create index for better performance
CREATE INDEX idx_product_categories_product_id ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category_id ON public.product_categories(category_id);