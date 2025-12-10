import { Star, ExternalLink } from 'lucide-react';
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
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        <div className="text-center mb-12 opacity-0 animate-fade-up">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mb-4">
            {t('reviews.title')}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-2xl font-bold ml-2">5.0</span>
          </div>
          <p className="text-muted-foreground">
            {language === 'ro' ? '3 recenzii' : '3 reviews'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {mockReviews.map((review, index) => (
            <div
              key={index}
              className="card-premium p-6 opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-4 leading-relaxed">{review.text}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium">{review.name}</span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up animation-delay-300">
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://g.page/r/YOUR_GOOGLE_PLACE_ID/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              {t('reviews.viewAll')}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="default" size="lg" asChild>
            <a
              href="https://g.page/r/YOUR_GOOGLE_PLACE_ID/review"
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
