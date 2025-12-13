import { Star, ExternalLink, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const mockReviews = [
  {
    name: 'Maria P.',
    rating: 5,
    text: 'Produse excelente! Am comandat pasta de dinți Dent-Tastic și sunt foarte mulțumită de rezultate.',
    date: '2 săptămâni în urmă',
  },
  {
    name: 'Andrei M.',
    rating: 5,
    text: 'Livrare rapidă și ambalaj impecabil. Recomand cu încredere!',
    date: '1 lună în urmă',
  },
  {
    name: 'Elena D.',
    rating: 5,
    text: 'Calitate superioară. Se simte diferența față de produsele obișnuite de pe piață.',
    date: '1 lună în urmă',
  },
];

export function GoogleReviewsSection() {
  const { t, language } = useLanguage();

  return (
    <section className="section-padding section-gradient-1 relative">
      <div className="container-custom">
        <div className="text-center mb-12 opacity-0 animate-fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Google Reviews
          </span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide mb-6">
            {t('reviews.title')}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-2xl font-bold ml-3">5.0</span>
          </div>
          <p className="text-muted-foreground">
            {language === 'ro' ? '3 recenzii verificate' : '3 verified reviews'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {mockReviews.map((review, index) => (
            <div
              key={index}
              className="card-interactive p-6 relative opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed relative z-10">{review.text}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {review.name.charAt(0)}
                  </div>
                  <span className="font-medium">{review.name}</span>
                </div>
                <span className="text-muted-foreground text-xs">{review.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up animation-delay-300">
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://g.page/r/CT2JPb1rKm82EAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              {t('reviews.viewAll')}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="hero" size="lg" asChild>
            <a
              href="https://g.page/r/CT2JPb1rKm82EAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              {t('reviews.leave')}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
