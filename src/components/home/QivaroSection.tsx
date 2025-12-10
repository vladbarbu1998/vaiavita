import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import qivaroImage from '@/assets/qivaro.webp';

export function QivaroSection() {
  const { t } = useLanguage();

  return (
    <section className="section-padding gradient-animated">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 opacity-0 animate-fade-up">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">
              {t('qivaro.title')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('qivaro.description')}</p>
              <p>{t('qivaro.description2')}</p>
            </div>
            <Button variant="secondary" size="lg" disabled className="cursor-not-allowed opacity-70">
              {t('qivaro.cta')}
            </Button>
          </div>

          {/* Image */}
          <div className="opacity-0 animate-fade-up animation-delay-200">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl" />
              <img 
                src={qivaroImage} 
                alt="Qivaro Supplements" 
                className="relative w-full max-w-lg mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
