import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import heroImage from '@/assets/hero-toothpaste.webp';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden gradient-animated">
      <div className="container-custom section-padding">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 opacity-0 animate-fade-up">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/produse">{t('hero.cta.products')}</Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/despre">{t('hero.cta.about')}</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative opacity-0 animate-fade-up animation-delay-200">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Dent-Tastic Toothpaste" 
                className="relative w-full max-w-lg mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
    </section>
  );
}
