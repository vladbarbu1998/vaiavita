import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRight, Check } from 'lucide-react';
import dentTasticImage from '@/assets/dent-tastic-product.webp';

export function FeaturedProductSection() {
  const { t, language } = useLanguage();

  const features = language === 'ro' 
    ? ['Formulă patentată în SUA', 'Fără fluor & triclosan', 'Ingrediente clinice active']
    : ['USA patented formula', 'Fluoride & triclosan free', 'Active clinical ingredients'];

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Subtle background pattern - hidden on mobile */}
      <div className="absolute inset-0 opacity-30 hidden lg:block">
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image - First on mobile */}
          <Link 
            to="/produse/pasta-dent-tastic"
            className="order-1 lg:order-1 opacity-0 animate-fade-up flex items-center justify-center group w-full"
          >
            {/* Single elegant frame - same width as text */}
            <div className="relative w-full mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl blur-xl" />
              
              {/* Single border frame */}
              <div className="relative rounded-2xl border-2 border-primary/30 bg-background/5 p-3 sm:p-4 shadow-xl">
                <img 
                  src={dentTasticImage} 
                  alt="Dent-Tastic Fresh Mint" 
                  className="relative w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </Link>

          {/* Content - Second on mobile */}
          <div className="order-2 lg:order-2 space-y-5 opacity-0 animate-fade-up animation-delay-200">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide">
              {t('featured.title')}
            </h2>
            
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>{t('featured.description')}</p>
              <p>{t('featured.description2')}</p>
            </div>

            {/* Feature list */}
            <div className="flex flex-wrap gap-3 pt-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg" asChild className="group mt-4 w-full sm:w-auto">
              <Link to="/produse/pasta-dent-tastic">
                {t('featured.cta')}
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
