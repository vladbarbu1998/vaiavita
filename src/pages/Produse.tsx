import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import qivaroImage from '@/assets/qivaro.webp';

interface DatabaseProduct {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  short_description_ro: string | null;
  short_description_en: string | null;
  price: number;
  status: string;
  images: string[] | null;
  stock: number;
}

// Fallback images for products without uploaded images
const fallbackImages: Record<string, string> = {
  'dent-tastic': dentTasticImage,
  'qivaro-supplements': qivaroImage,
};

const Produse = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, slug, name_ro, name_en, short_description_ro, short_description_en, price, status, images, stock')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    {/* Image */}
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-t-2xl">
                      <img 
                        src={getProductImage(product)} 
                        alt={language === 'ro' ? product.name_ro : product.name_en}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    
                    <div className="p-6 space-y-3">
                      {/* Badge */}
                      <div>
                        {getStatusBadge(product)}
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-display text-xl tracking-wide">
                        {language === 'ro' ? product.name_ro : product.name_en}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {language === 'ro' 
                          ? (product.short_description_ro || '') 
                          : (product.short_description_en || '')}
                      </p>
                      
                      {/* Price and CTA */}
                      <div className="flex items-center justify-between pt-3">
                        {product.status !== 'coming_soon' && product.price > 0 ? (
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(Number(product.price))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {language === 'ro' ? 'Preț în curând' : 'Price coming soon'}
                          </span>
                        )}
                        {isClickable && (
                          <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t('common.viewProduct')}
                            <ArrowRight className="w-4 h-4" />
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
