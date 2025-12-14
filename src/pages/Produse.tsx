import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { ArrowRight, Loader2, ShoppingCart, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import qivaroImage from '@/assets/qivaro.webp';

interface DatabaseProduct {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  price: number;
  status: string;
  images: string[] | null;
  stock: number;
}

interface ProductRating {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

// Fallback images for products without uploaded images
const fallbackImages: Record<string, string> = {
  'dent-tastic': dentTasticImage,
  'qivaro-supplements': qivaroImage,
};

const Produse = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [productRatings, setProductRatings] = useState<Map<string, ProductRating>>(new Map());
  const [loading, setLoading] = useState(true);

  const handleQuickAdd = (e: React.MouseEvent, product: DatabaseProduct) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0 || product.status !== 'active') return;
    
    addItem({
      id: product.id,
      name: product.name_ro,
      nameEn: product.name_en,
      price: product.price,
      image: getProductImage(product),
      slug: product.slug,
    });
    
    toast({
      title: language === 'ro' ? 'Adăugat în coș' : 'Added to cart',
      description: language === 'ro' ? product.name_ro : product.name_en,
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, slug, name_ro, name_en, price, status, images, stock')
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setProducts(data || []);

        // Fetch ratings for all products
        if (data && data.length > 0) {
          const productIds = data.map(p => p.id);
          // Use public_reviews view to avoid exposing customer_email
          const { data: reviewsData } = await supabase
            .from('public_reviews')
            .select('product_id, rating')
            .in('product_id', productIds);

          if (reviewsData) {
            const ratingsMap = new Map<string, ProductRating>();
            
            // Group reviews by product and calculate averages
            const reviewsByProduct = reviewsData.reduce((acc, review) => {
              if (!acc[review.product_id]) {
                acc[review.product_id] = [];
              }
              acc[review.product_id].push(review.rating);
              return acc;
            }, {} as Record<string, number[]>);

            Object.entries(reviewsByProduct).forEach(([productId, ratings]) => {
              const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
              ratingsMap.set(productId, {
                productId,
                averageRating: avg,
                reviewCount: ratings.length,
              });
            });

            setProductRatings(ratingsMap);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getStatusBadge = (product: DatabaseProduct) => {
    if (product.status === 'coming_soon') {
      return <Badge variant="secondary">{t('common.comingSoon')}</Badge>;
    }
    if (product.stock <= 0 || product.status === 'inactive') {
      return <Badge variant="destructive">{t('common.outOfStock')}</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{t('common.inStock')}</Badge>;
  };

  const getProductImage = (product: DatabaseProduct) => {
    // Try to get from database images first
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    // Fall back to local images
    return fallbackImages[product.slug] || dentTasticImage;
  };

  const isProductClickable = (product: DatabaseProduct) => {
    return product.status === 'active';
  };

  const renderRating = (productId: string) => {
    const rating = productRatings.get(productId);
    
    if (!rating || rating.reviewCount === 0) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="text-xs">
            {language === 'ro' ? 'Fără recenzii' : 'No reviews'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                star <= Math.round(rating.averageRating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-muted-foreground/30'
              }`} 
            />
          ))}
        </div>
        <span className="text-xs md:text-sm font-medium text-foreground">
          {rating.averageRating.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">
          ({rating.reviewCount})
        </span>
      </div>
    );
  };

  return (
    <MainLayout>
      {/* Hero Banner */}
      <section className="gradient-animated py-16 md:py-24">
        <div className="container-custom">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-center opacity-0 animate-fade-up">
            {language === 'ro' ? 'PRODUSE' : 'PRODUCTS'}
          </h1>
          <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto opacity-0 animate-fade-up animation-delay-100">
            {language === 'ro' 
              ? 'Descoperă selecția noastră de produse premium pentru sănătate și vitalitate.'
              : 'Discover our selection of premium health and vitality products.'}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {language === 'ro' ? 'Nu există produse disponibile.' : 'No products available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => {
                const isClickable = isProductClickable(product);
                const CardWrapper = isClickable ? Link : 'div';
                const cardProps = isClickable 
                  ? { to: `/produse/${product.slug}` } 
                  : {};
                
                return (
                  <CardWrapper
                    key={product.id}
                    {...cardProps as any}
                    className={`card-interactive overflow-hidden opacity-0 animate-fade-up block ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Image with Quick Add button */}
                    <div className="relative">
                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-t-2xl">
                        <img 
                          src={getProductImage(product)} 
                          alt={language === 'ro' ? product.name_ro : product.name_en}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      {/* Quick Add Button */}
                      {isClickable && product.stock > 0 && (
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="absolute bottom-0 right-3 translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 hover:scale-110 transition-all duration-200 z-10"
                          title={language === 'ro' ? 'Adaugă în coș' : 'Add to cart'}
                        >
                          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="p-4 pt-6 flex flex-col">
                      {/* Badge - fixed height */}
                      <div className="h-5">
                        {getStatusBadge(product)}
                      </div>
                      
                      {/* Title - fixed height for 2 lines */}
                      <h3 className="font-display text-sm md:text-base tracking-wide line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem] mt-3">
                        {language === 'ro' ? product.name_ro : product.name_en}
                      </h3>
                      
                      {/* Rating - instead of description */}
                      <div className="min-h-[1.5rem] mt-3">
                        {renderRating(product.id)}
                      </div>
                      
                      {/* Price and CTA - fixed position */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 pt-3 mt-4 border-t border-border/50">
                        {product.status !== 'coming_soon' && product.price > 0 ? (
                          <span className="text-base lg:text-lg font-bold text-primary">
                            {formatPrice(Number(product.price))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {language === 'ro' ? 'Preț în curând' : 'Price coming soon'}
                          </span>
                        )}
                        {isClickable && (
                          <span className="text-primary font-medium text-xs lg:text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t('common.viewProduct')}
                            <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Produse;
