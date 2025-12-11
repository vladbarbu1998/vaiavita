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
      {/* Decorative elements - hidden on mobile */}
      <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="hidden sm:block absolute bottom-0 left-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-5 opacity-0 animate-fade-up">
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
                  <item.icon className="w-5 h-5 text-primary" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="lg" disabled className="cursor-not-allowed opacity-70 mt-4">
              {t('qivaro.cta')}
            </Button>
          </div>

          {/* Image */}
          <div className="opacity-0 animate-fade-up animation-delay-200 flex items-center justify-center">
            {/* Multi-border frame effect - layered borders */}
            <div className="relative p-3 sm:p-6 md:p-10 group w-full max-w-[280px] sm:max-w-sm md:max-w-md mx-auto">
              {/* Outermost border - subtle - hidden on very small screens */}
              <div className="hidden sm:block absolute inset-0 rounded-[2rem] border-2 border-primary/15 bg-background/5" />
              {/* Middle border */}
              <div className="hidden sm:block absolute inset-3 md:inset-5 rounded-[1.5rem] border-2 border-primary/25" />
              {/* Inner border - most visible */}
              <div className="absolute inset-1 sm:inset-6 md:inset-10 rounded-2xl border-2 border-primary/35" />
              
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[2rem]" />
              
              <div className="relative p-1 sm:p-3 md:p-6">
                <img 
                  src={qivaroImage} 
                  alt="Qivaro Supplements" 
                  className="relative w-full h-auto rounded-xl drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
