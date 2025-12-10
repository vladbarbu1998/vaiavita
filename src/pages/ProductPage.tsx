import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Star, Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductSpecificationsDisplay, ProductSpecifications } from '@/components/product/ProductSpecifications';
import { ImageGallery } from '@/components/product/ImageGallery';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import qivaroImage from '@/assets/qivaro.webp';

// Fallback images for products without uploaded images
const fallbackImages: Record<string, string> = {
  'dent-tastic': dentTasticImage,
  'qivaro-supplements': qivaroImage,
};

interface Product {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  description_ro: string | null;
  description_en: string | null;
  short_description_ro: string | null;
  short_description_en: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: string;
  images: string[] | null;
  specifications: ProductSpecifications | null;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  content: string | null;
  title: string | null;
  created_at: string;
  is_verified_purchase: boolean | null;
}

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          navigate('/produse');
          return;
        }

        // Parse specifications
        let specs: ProductSpecifications | null = null;
        if (data.specifications && typeof data.specifications === 'object' && 'items' in data.specifications) {
          specs = data.specifications as unknown as ProductSpecifications;
        }

        setProduct({
          ...data,
          specifications: specs,
        });

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, customer_name, rating, content, title, created_at, is_verified_purchase')
          .eq('product_id', data.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setReviewStats({ averageRating: avg, reviewCount: reviewsData.length });
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/produse');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, navigate]);

  const scrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name_ro,
        nameEn: product.name_en,
        price: Number(product.price),
        image: getProductImage(),
        slug: product.slug,
      });
    }
    
    toast({
      title: language === 'ro' ? 'Produs adăugat în coș!' : 'Product added to cart!',
      description: `${quantity}x ${language === 'ro' ? product.name_ro : product.name_en}`,
    });
  };

  const getProductImage = () => {
    if (product?.images && product.images.length > 0) {
      return product.images[0];
    }
    return fallbackImages[product?.slug || ''] || dentTasticImage;
  };

  const getProductImages = (): string[] => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    // Return fallback image if available
    const fallback = fallbackImages[product?.slug || ''];
    return fallback ? [fallback] : [dentTasticImage];
  };

  if (loading) {
    return (
      <MainLayout>
        <section className="section-padding">
          <div className="container-custom flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </section>
      </MainLayout>
    );
  }

  if (!product) {
    return null;
  }

  const images = getProductImages();
  const isInStock = product.stock > 0 && product.status === 'active';

  return (
    <MainLayout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image Gallery */}
            <div className="relative">
              <ImageGallery 
                images={images} 
                productName={language === 'ro' ? product.name_ro : product.name_en} 
              />
            </div>

            {/* Product Details */}
            <div className="space-y-6 opacity-0 animate-fade-up animation-delay-200">
              <div>
                <Badge className={`mb-4 ${
                  isInStock 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {isInStock ? t('common.inStock') : t('common.outOfStock')}
                </Badge>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <h1 className="font-display text-3xl md:text-4xl tracking-wide">
                    {language === 'ro' ? product.name_ro : product.name_en}
                  </h1>
                  {reviewStats.reviewCount > 0 && (
                    <button 
                      onClick={scrollToReviews}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors shrink-0"
                    >
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= Math.round(reviewStats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground">
                        ({reviewStats.reviewCount} {language === 'ro' ? 'recenzii' : 'reviews'})
                      </span>
                    </button>
                  )}
                </div>
                {(product.short_description_ro || product.short_description_en) && (
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    {language === 'ro' ? product.short_description_ro : product.short_description_en}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(Number(product.price))}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(Number(product.compare_at_price))}
                  </span>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              {isInStock && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="inline-flex items-center gap-1 card-premium px-2 py-1">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} 
                      className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('common.addToCart')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <div ref={tabsRef} className="mt-16 opacity-0 animate-fade-up animation-delay-300">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-8 overflow-x-auto">
                <TabsTrigger 
                  value="description" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap"
                >
                  {language === 'ro' ? 'Descriere' : 'Description'}
                </TabsTrigger>
                <TabsTrigger 
                  value="specifications" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap"
                >
                  {language === 'ro' ? 'Specificații' : 'Specifications'}
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap"
                >
                  {language === 'ro' ? 'Recenzii' : 'Reviews'} ({reviewStats.reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-0">
                <div className="card-premium p-8">
                  {product.description_ro || product.description_en ? (
                    <div 
                      className="prose prose-lg max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: (language === 'ro' ? product.description_ro : product.description_en) || '' 
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {language === 'ro' ? 'Nu există descriere disponibilă.' : 'No description available.'}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-0">
                <ProductSpecificationsDisplay specifications={product.specifications} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="card-premium p-8">
                  {reviewStats.reviewCount > 0 ? (
                    <div className="space-y-6">
                      {/* Rating Summary */}
                      <div className="flex items-center gap-4 pb-6 border-b border-border">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-6 h-6 ${star <= Math.round(reviewStats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-2xl font-bold">{reviewStats.averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({reviewStats.reviewCount} {language === 'ro' ? 'recenzii' : 'reviews'})
                        </span>
                      </div>

                      {/* Reviews List */}
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="pb-6 border-b border-border last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{review.customer_name}</span>
                                  {review.is_verified_purchase && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                      {language === 'ro' ? 'Cumpărător verificat' : 'Verified purchase'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.title && (
                              <h4 className="font-medium mb-2">{review.title}</h4>
                            )}
                            {review.content && (
                              <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {language === 'ro' ? 'Nu există recenzii încă.' : 'No reviews yet.'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductPage;
