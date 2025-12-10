import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import despreImage from '@/assets/despre.webp';

export function WhyChooseUsSection() {
  const { t } = useLanguage();

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="opacity-0 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl" />
              <img 
                src={despreImage} 
                alt="VAIAVITA Products" 
                className="relative w-full max-w-md mx-auto"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 opacity-0 animate-fade-up animation-delay-200">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">
              {t('why.title')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('why.description')}</p>
              <p>{t('why.description2')}</p>
            </div>
            <Button variant="outline" size="lg" asChild>
              <Link to="/despre">{t('why.cta')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
