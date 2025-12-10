import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import dentTasticImage from '@/assets/dent-tastic-product.webp';

export function FeaturedProductSection() {
  const { t } = useLanguage();

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1 opacity-0 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl" />
              <img 
                src={dentTasticImage} 
                alt="Dent-Tastic Fresh Mint" 
                className="relative w-full max-w-md mx-auto rounded-2xl shadow-xl"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-6 opacity-0 animate-fade-up animation-delay-200">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">
              {t('featured.title')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('featured.description')}</p>
              <p>{t('featured.description2')}</p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/produse/dent-tastic">{t('featured.cta')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
