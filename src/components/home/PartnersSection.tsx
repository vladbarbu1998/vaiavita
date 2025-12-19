import { useLanguage } from '@/context/LanguageContext';
import { Link } from 'react-router-dom';
import dentalmedLogo from '@/assets/dentalmed-logo.png';

export const PartnersSection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-secondary/20">
      <div className="container-custom">
        <div className="text-center mb-8 opacity-0 animate-fade-up">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
            {language === 'ro' ? 'Recomandat de' : 'Recommended by'}
          </p>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide">
            {language === 'ro' ? 'PARTENERII NOȘTRI' : 'OUR PARTNERS'}
          </h2>
        </div>
        
        <div className="flex justify-center opacity-0 animate-fade-up animation-delay-200">
          <Link 
            to="/despre"
            className="group card-premium p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 max-w-xl hover:border-primary/30 transition-all"
          >
            <div className="w-40 md:w-48 shrink-0 p-4 bg-white rounded-xl">
              <img 
                src={dentalmedLogo} 
                alt="DentalMed Com Brașov" 
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-display text-lg md:text-xl tracking-wide mb-2">
                DentalMed Com Brașov
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'ro' 
                  ? 'Partener de încredere în domeniul stomatologiei moderne, cu peste 25 de ani de experiență.'
                  : 'Trusted partner in modern dentistry with over 25 years of experience.'}
              </p>
              <span className="text-xs text-primary group-hover:underline">
                {language === 'ro' ? 'Află mai multe →' : 'Learn more →'}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};