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
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1 opacity-0 animate-fade-up">
            <div className="relative group">
              {/* Decorative frame */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl rotate-2 group-hover:rotate-1 transition-transform duration-500" />
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 to-primary/10 rounded-3xl -rotate-2 group-hover:-rotate-1 transition-transform duration-500" />
              
              <div className="relative bg-card rounded-2xl p-8 shadow-card">
                <img 
                  src={dentTasticImage} 
                  alt="Dent-Tastic Fresh Mint" 
                  className="w-full max-w-sm mx-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-6 opacity-0 animate-fade-up animation-delay-200">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {language === 'ro' ? 'Produs Vedeta' : 'Featured Product'}
            </span>
            
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">
              {t('featured.title')}
            </h2>
            
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
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

            <Button variant="hero" size="lg" asChild className="group mt-4">
              <Link to="/produse/dent-tastic">
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
