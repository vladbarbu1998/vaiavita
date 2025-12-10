import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
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
  },
];

const Produse = () => {
  const { language, t } = useLanguage();

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
            {products.map((product, index) => (
              <div
                key={product.id}
                className="card-premium overflow-hidden opacity-0 animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square overflow-hidden bg-muted/30 p-4">
                  <img 
                    src={product.image} 
                    alt={language === 'ro' ? product.nameRo : product.nameEn}
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-xl tracking-wide">
                      {language === 'ro' ? product.nameRo : product.nameEn}
                    </h3>
                    {getStatusBadge(product.status)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {language === 'ro' ? product.descriptionRo : product.descriptionEn}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    {product.price > 0 ? (
                      <span className="text-2xl font-bold text-primary">
                        {product.price.toFixed(2)} lei
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {language === 'ro' ? 'Preț în curând' : 'Price coming soon'}
                      </span>
                    )}
                    {product.status === 'in_stock' && (
                      <Button asChild>
                        <Link to={`/produse/${product.slug}`}>
                          {t('common.viewProduct')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Produse;
