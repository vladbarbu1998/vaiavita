import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  content_ro: string;
  content_en: string;
  author: string;
  title_ro: string;
  title_en: string;
}

const testimonials: Testimonial[] = [
  {
    content_ro: 'Pacienții noștri adoră această pastă de dinți și mulți dintre ei au început chiar să o achiziționeze în cantități mai mari. Dentistul nostru a observat, de asemenea, o reducere semnificativă a sângerărilor gingivale de când am introdus această pastă în cabinet.',
    content_en: 'Our patients love this toothpaste and many of them have started purchasing it in larger quantities. Our dentist has also noticed a significant reduction in gum bleeding since we introduced this toothpaste in our practice.',
    author: 'HK Dentist',
    title_ro: 'Medic stomatolog',
    title_en: 'Dentist',
  },
  {
    content_ro: 'Folosesc Dent-Tastic de doi ani și l-am recomandat atât pacienților mei, cât și prietenilor. Cu toții am devenit dependenți de senzația sa revigorantă și de prospețimea de lungă durată pe care o oferă. Încercați și voi — beneficiile depășesc cu mult sănătatea orală convențională. Împărtășiți și cu familia voastră; merită tot ce e mai bun.',
    content_en: 'I have been using Dent-Tastic for two years and have recommended it to both my patients and friends. We have all become addicted to its refreshing sensation and the long-lasting freshness it provides. Try it too — the benefits far exceed conventional oral health. Share it with your family as well; they deserve the best.',
    author: 'Prof. "Bakr"',
    title_ro: 'Ortodont',
    title_en: 'Orthodontist',
  },
];

export function ProfessionalTestimonials() {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="mt-10 opacity-0 animate-fade-up animation-delay-400">
      <h4 className="font-display text-lg md:text-xl tracking-wide mb-4 text-center">
        {language === 'ro' ? 'Testimoniale Profesionale' : 'Professional Testimonials'}
      </h4>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-2xl mx-auto">
        {language === 'ro' 
          ? 'Dent-Tastic Fresh Mint este recomandată de profesioniști în domeniul dentar și de pacienții lor pentru delicatețea formulei, suportul pentru sănătatea gingiilor și prospețimea de lungă durată.'
          : 'Dent-Tastic Fresh Mint is recommended by dental professionals and their patients for its gentle formula, gum health support, and long-lasting freshness.'}
      </p>

      {/* Mobile: Carousel */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={prevTestimonial}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 max-w-[320px]">
            <div className="card-premium p-5 relative">
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <p className="text-sm leading-relaxed text-foreground/90 mb-4 pr-8">
                "{language === 'ro' 
                  ? testimonials[currentIndex].content_ro 
                  : testimonials[currentIndex].content_en}"
              </p>
              <div className="border-t border-border/50 pt-3 mt-3">
                <p className="font-semibold text-foreground">
                  {testimonials[currentIndex].author}
                </p>
                <p className="text-xs text-primary font-medium">
                  {language === 'ro' 
                    ? testimonials[currentIndex].title_ro 
                    : testimonials[currentIndex].title_en}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={nextTestimonial}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="card-premium p-6 relative group hover:shadow-lg transition-shadow duration-300">
            <Quote className="w-10 h-10 text-primary/15 absolute top-5 right-5 group-hover:text-primary/25 transition-colors" />
            <p className="text-sm md:text-base leading-relaxed text-foreground/90 mb-5 pr-10">
              "{language === 'ro' ? testimonial.content_ro : testimonial.content_en}"
            </p>
            <div className="border-t border-border/50 pt-4 mt-4">
              <p className="font-semibold text-foreground text-base">
                {testimonial.author}
              </p>
              <p className="text-sm text-primary font-medium">
                {language === 'ro' ? testimonial.title_ro : testimonial.title_en}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
