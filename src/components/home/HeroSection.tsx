import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-toothpaste.webp';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden gradient-animated min-h-[85vh] flex items-center">
      {/* Decorative circles - hidden on mobile to prevent overflow */}
      <div className="hidden lg:block absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="hidden lg:block absolute bottom-20 left-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container-custom section-padding relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Text Content - First on mobile */}
          <div className="order-1 lg:order-1 space-y-6 opacity-0 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>{t('hero.badge')}</span>
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide leading-[1.1]">
              {t('hero.title')}
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button variant="hero" size="lg" asChild className="group">
                <Link to="/produse">
                  {t('hero.cta.products')}
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/despre">{t('hero.cta.about')}</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image - Second on mobile */}
          <Link 
            to="/produse/pasta-dent-tastic"
            className="order-2 lg:order-2 relative opacity-0 animate-fade-up animation-delay-200 flex items-center justify-center w-full group"
          >
            <div className="relative w-full max-w-md lg:max-w-lg mx-auto">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl blur-3xl scale-110" />
              
              <img 
                src={heroImage} 
                alt="Dent-Tastic Toothpaste" 
                className="relative w-full h-auto rounded-3xl drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
