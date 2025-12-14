import { Star, ExternalLink, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const googleReviews = [
  {
    name: 'Calin',
    rating: 5,
    text: 'Pasta de dinti buna pentru pret. curata bine, lasa gura fresh si nu e prea iute. Am incercat si paste mai scumpe si nu pot spune ca sunt mari diferente. O folosesc zilnic si nu am avut probleme cu dintii sau gingiile. Recomand.',
    textEn: 'Good toothpaste for the price. Cleans well, leaves mouth fresh and not too spicy. I tried more expensive pastes and I can\'t say there are major differences. I use it daily and have had no problems with my teeth or gums. Recommend.',
    reviewLink: 'https://share.google/Ke5iTVWqryoEsqGIJ',
  },
  {
    name: 'Udrea Mihaela',
    rating: 5,
    text: 'Recomand, soluție excelentă profesională la un cost corect. Mi-a fost recomandată de medicul stomatolog pentru reducerea inflamației gingivale.',
    textEn: 'I recommend, excellent professional solution at a fair cost. It was recommended to me by my dentist for reducing gum inflammation.',
    reviewLink: 'https://share.google/OaP8VG0lENmC3d24f',
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
          <div className="flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-2xl font-bold ml-3">5.0</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {googleReviews.map((review, index) => (
            <div
              key={index}
              className="card-interactive p-6 relative opacity-0 animate-fade-up flex flex-col h-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Review text - flex-grow pushes footer to bottom */}
              <p className="text-foreground mb-6 leading-relaxed relative z-10 flex-grow">
                {language === 'ro' ? review.text : review.textEn}
              </p>
              
              {/* Footer - always at bottom */}
              <div className="flex items-center justify-between text-sm mt-auto">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {review.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{review.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </span>
                  </div>
                </div>
                <a
                  href={review.reviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {language === 'ro' ? 'Vezi recenzia' : 'View review'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up animation-delay-300">
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://share.google/S1mBfqRss8LeQeKjH"
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
              href="https://g.page/r/CT2JPb1rKm82EBM/review"
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
