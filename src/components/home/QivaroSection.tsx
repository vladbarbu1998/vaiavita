import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Clock, Leaf, Award } from 'lucide-react';
import qivaroImage from '@/assets/qivaro.webp';

export function QivaroSection() {
  const { t, language } = useLanguage();

  const highlights = [
    { icon: Leaf, label: language === 'ro' ? 'Ingrediente naturale' : 'Natural ingredients' },
    { icon: Award, label: language === 'ro' ? 'Calitate premium' : 'Premium quality' },
    { icon: Clock, label: language === 'ro' ? 'Disponibil în curând' : 'Coming soon' },
  ];

  return (
    <section className="section-padding section-gradient-2 relative overflow-hidden">
      {/* Decorative elements - hidden on mobile/tablet */}
      <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="hidden lg:block absolute bottom-0 left-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image - First on mobile */}
          <div className="order-1 lg:order-2 opacity-0 animate-fade-up animation-delay-200 flex items-center justify-center w-full">
            <div className="relative w-full max-w-md lg:max-w-lg mx-auto p-3 sm:p-4">
              {/* Decorative borders - only on larger screens */}
              <div className="hidden lg:block absolute -inset-4 rounded-2xl border-2 border-primary/15" />
              <div className="hidden lg:block absolute -inset-2 rounded-xl border-2 border-primary/25" />
              
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
              
              {/* Image container */}
              <div className="relative rounded-xl border-2 border-primary/30 overflow-hidden bg-background/50 p-3 sm:p-4">
                <img 
                  src={qivaroImage} 
                  alt="Qivaro Supplements" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Content - Second on mobile */}
          <div className="order-2 lg:order-1 space-y-5 opacity-0 animate-fade-up">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide">
              {t('qivaro.title')}
            </h2>
            
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>{t('qivaro.description')}</p>
              <p>{t('qivaro.description2')}</p>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-4 pt-2">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="lg" disabled className="cursor-not-allowed opacity-70 mt-4 w-full sm:w-auto">
              {t('qivaro.cta')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
