import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Mail } from 'lucide-react';

export function ContactTeaserSection() {
  const { t } = useLanguage();

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="card-premium p-8 md:p-12 text-left max-w-3xl mx-auto opacity-0 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
            {t('contact.description')}
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/contact">{t('contact.cta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
