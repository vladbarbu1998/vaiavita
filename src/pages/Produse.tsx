import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ArrowRight } from 'lucide-react';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import qivaroImage from '@/assets/qivaro.webp';

interface Product {
  id: string;
  slug: string;
  nameRo: string;
  nameEn: string;
  descriptionRo: string;
  descriptionEn: string;
  price: number;
  status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  image: string;
  hasPage: boolean;
}

const products: Product[] = [
  {
    id: '1',
    slug: 'dent-tastic',
    nameRo: 'Pasta de dinți Dent-Tastic Fresh Mint',
    nameEn: 'Dent-Tastic Fresh Mint Toothpaste',
    descriptionRo: 'Pastă de dinți naturală cu quercetin și paeoniflorin pentru sănătatea gingiilor.',
    descriptionEn: 'Natural toothpaste with quercetin and paeoniflorin for gum health.',
    price: 29.99,
    status: 'in_stock',
    image: dentTasticImage,
    hasPage: true,
  },
  {
    id: '2',
    slug: 'qivaro-supplements',
    nameRo: 'Suplimente Qivaro Premium',
    nameEn: 'Qivaro Premium Supplements',
    descriptionRo: 'Suplimente nutritive de elită din SUA, create în laboratoare avansate.',
    descriptionEn: 'Elite nutritional supplements from the USA, created in advanced laboratories.',
    price: 0,
    status: 'coming_soon',
    image: qivaroImage,
    hasPage: false,
  },
];

const Produse = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{t('common.inStock')}</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">{t('common.outOfStock')}</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary">{t('common.comingSoon')}</Badge>;
    }
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => {
              const CardWrapper = product.hasPage ? Link : 'div';
              const cardProps = product.hasPage 
                ? { to: `/produse/${product.slug}` } 
                : {};
              
              return (
                <CardWrapper
                  key={product.id}
                  {...cardProps as any}
                  className={`card-interactive overflow-hidden opacity-0 animate-fade-up block ${product.hasPage ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image - clickable */}
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-t-2xl">
                    <img 
                      src={product.image} 
                      alt={language === 'ro' ? product.nameRo : product.nameEn}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="p-6 space-y-3">
                    {/* Badge ABOVE title */}
                    <div>
                      {getStatusBadge(product.status)}
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-display text-xl tracking-wide">
                      {language === 'ro' ? product.nameRo : product.nameEn}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {language === 'ro' ? product.descriptionRo : product.descriptionEn}
                    </p>
                    
                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-3">
                      {product.price > 0 ? (
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {language === 'ro' ? 'Preț în curând' : 'Price coming soon'}
                        </span>
                      )}
                      {product.hasPage && (
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
        </div>
      </section>
    </MainLayout>
  );
};

export default Produse;
