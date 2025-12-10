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
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 opacity-0 animate-fade-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {language === 'ro' ? 'În Curând' : 'Coming Soon'}
            </span>
            
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">
              {t('qivaro.title')}
            </h2>
            
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>{t('qivaro.description')}</p>
              <p>{t('qivaro.description2')}</p>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-4 pt-2">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="lg" disabled className="cursor-not-allowed opacity-70 mt-4">
              {t('qivaro.cta')}
            </Button>
          </div>

          {/* Image - Equal size container */}
          <div className="opacity-0 animate-fade-up animation-delay-200 flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl scale-105 opacity-50" />
              <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 w-full h-full flex items-center justify-center border border-border/30 shadow-card">
                <img 
                  src={qivaroImage} 
                  alt="Qivaro Supplements" 
                  className="w-full h-auto max-h-[85%] object-contain hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
