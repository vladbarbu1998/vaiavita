import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRight, Globe, Award, Heart, Zap } from 'lucide-react';
import despreImage from '@/assets/despre.webp';

export function WhyChooseUsSection() {
  const { t, language } = useLanguage();

  const benefits = [
    { icon: Globe, label: language === 'ro' ? 'Produse internaționale' : 'International products' },
    { icon: Award, label: language === 'ro' ? 'Standarde înalte' : 'High standards' },
    { icon: Heart, label: language === 'ro' ? 'Pasiune pentru calitate' : 'Passion for quality' },
    { icon: Zap, label: language === 'ro' ? 'Soluții inovatoare' : 'Innovative solutions' },
  ];

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background decoration - hidden on mobile */}
      <div className="absolute inset-0 opacity-40 hidden sm:block">
        <div className="absolute top-1/3 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image - First on mobile */}
          <div className="order-1 lg:order-1 opacity-0 animate-fade-up flex items-center justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md aspect-square flex items-center justify-center">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] blur-2xl opacity-60" />
              <div className="relative bg-card/50 backdrop-blur-sm rounded-[2rem] p-4 sm:p-8 w-full h-full flex items-center justify-center border border-border/30 shadow-card overflow-hidden">
                <img 
                  src={despreImage} 
                  alt="VAIAVITA Products" 
                  className="w-full h-auto max-h-[85%] object-contain hover:scale-105 transition-transform duration-700 rounded-2xl"
                />
              </div>
            </div>
          </div>

          {/* Content - Second on mobile */}
          <div className="order-2 lg:order-2 space-y-5 opacity-0 animate-fade-up animation-delay-200">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide">
              {t('why.title')}
            </h2>
            
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>{t('why.description')}</p>
              <p>{t('why.description2')}</p>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{benefit.label}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" size="lg" asChild className="group mt-4 w-full sm:w-auto">
              <Link to="/despre">
                {t('why.cta')}
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
