import { Gem, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function USPSection() {
  const { t } = useLanguage();

  const usps = [
    {
      icon: Gem,
      title: t('usp.exclusivity.title'),
      description: t('usp.exclusivity.desc'),
      gradient: 'from-emerald-500/20 to-teal-500/10',
    },
    {
      icon: ShieldCheck,
      title: t('usp.quality.title'),
      description: t('usp.quality.desc'),
      gradient: 'from-teal-500/20 to-cyan-500/10',
    },
    {
      icon: Sparkles,
      title: t('usp.innovation.title'),
      description: t('usp.innovation.desc'),
      gradient: 'from-cyan-500/20 to-emerald-500/10',
    },
  ];

  return (
    <section className="section-padding section-gradient-1 relative">
      <div className="container-custom">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {usps.map((usp, index) => (
            <div
              key={usp.title}
              className="card-interactive p-8 text-center group opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br ${usp.gradient} text-primary mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <usp.icon className="w-9 h-9" />
              </div>
              <h3 className="font-display text-2xl tracking-wide mb-4 group-hover:text-primary transition-colors">
                {usp.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {usp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
