import { Gem, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function USPSection() {
  const { t } = useLanguage();

  const usps = [
    {
      icon: Gem,
      title: t('usp.exclusivity.title'),
      description: t('usp.exclusivity.desc'),
    },
    {
      icon: ShieldCheck,
      title: t('usp.quality.title'),
      description: t('usp.quality.desc'),
    },
    {
      icon: Sparkles,
      title: t('usp.innovation.title'),
      description: t('usp.innovation.desc'),
    },
  ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {usps.map((usp, index) => (
            <div
              key={usp.title}
              className="card-premium p-8 text-center opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
                <usp.icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl tracking-wide mb-3">{usp.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{usp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
