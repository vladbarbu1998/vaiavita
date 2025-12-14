import { Star, ExternalLink, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const googleReviews = [
  {
    name: 'Calin',
    rating: 5,
    text: 'Pasta de dinti buna pentru pret. curata bine, lasa gura fresh si nu e prea iute. Am incercat si paste mai scumpe si nu pot spune ca sunt mari diferente. O folosesc zilnic si nu am avut probleme cu dintii sau gingiile. Recomand.',
    textEn: 'Good toothpaste for the price. Cleans well, leaves mouth fresh and not too spicy. I tried more expensive pastes and I can\'t say there are major differences. I use it daily and have had no problems with my teeth or gums. Recommend.',
    date: '4 ore în urmă',
    dateEn: '4 hours ago',
  },
  {
    name: 'Udrea Mihaela',
    rating: 5,
    text: 'Recomand, soluție excelentă profesională la un cost corect. Mi-a fost recomandată de medicul stomatolog pentru reducerea inflamației gingivale.',
    textEn: 'I recommend, excellent professional solution at a fair cost. It was recommended to me by my dentist for reducing gum inflammation.',
    date: 'acum o zi',
    dateEn: 'a day ago',
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
            {language === 'ro' ? '2 recenzii verificate' : '2 verified reviews'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {googleReviews.map((review, index) => (
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
              <p className="text-foreground mb-6 leading-relaxed relative z-10">
                {language === 'ro' ? review.text : review.textEn}
              </p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {review.name.charAt(0)}
                  </div>
                  <span className="font-medium">{review.name}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {language === 'ro' ? review.date : review.dateEn}
                </span>
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
