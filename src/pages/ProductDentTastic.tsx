import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Star, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import heroImage from '@/assets/hero-toothpaste.webp';

const testimonials = [
  {
    rating: 5,
    titleRo: 'Medic stomatolog specialist',
    titleEn: 'Dental Specialist',
    textRo: 'Pacienții noștri adoră această pastă de dinți și mulți dintre ei au început chiar să o achiziționeze în cantități mai mari. Dentistul nostru a observat, de asemenea, o reducere semnificativă a sângerărilor gingivale de când am introdus această pastă în cabinet.',
    textEn: 'Our patients love this toothpaste and many of them have even started purchasing it in larger quantities. Our dentist has also noticed a significant reduction in gum bleeding since we introduced this paste in the office.',
    initials: 'HK',
    name: 'HK Dentist',
    role: 'Medic stomatolog',
  },
  {
    rating: 5,
    titleRo: 'Medic stomatolog specialist',
    titleEn: 'Dental Specialist',
    textRo: 'Folosesc Dent-Tastic de doi ani și l-am recomandat atât pacienților mei, cât și prietenilor. Cu toții am devenit dependenți de senzația sa revigorantă și de prospețimea de lungă durată pe care o oferă. Încercați și voi — beneficiile depășesc cu mult sănătatea orală convențională. Împărtășiți și cu familia voastră; merită tot ce e mai bun.',
    textEn: 'I have been using Dent-Tastic for two years and have recommended it to both my patients and friends. We have all become addicted to its invigorating sensation and the long-lasting freshness it provides. Try it too — the benefits far exceed conventional oral health. Share with your family as well; they deserve the best.',
    initials: 'PR',
    name: 'Prof. "Bakr"',
    role: 'Ortodont',
  },
];

const ProductDentTastic = () => {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = [dentTasticImage, heroImage];

  const handleAddToCart = () => {
    addItem({
      id: 'dent-tastic',
      name: 'Pasta de dinți Dent-Tastic Fresh Mint',
      nameEn: 'Dent-Tastic Fresh Mint Toothpaste',
      price: 29.99,
      image: dentTasticImage,
      slug: 'dent-tastic',
    });
    toast({
      title: language === 'ro' ? 'Produs adăugat în coș!' : 'Product added to cart!',
      description: language === 'ro' ? 'Dent-Tastic Fresh Mint' : 'Dent-Tastic Fresh Mint',
    });
  };

  const benefits = [
    '🌱 Compoziție naturală & formulă sigură – fără fluor, triclosan sau substanțe chimice agresive.',
    '🦷 Îngrijire avansată a gingiilor – reduce inflamațiile și sângerările gingivale.',
    '🔬 Ingrediente clinice active – quercetin și paeoniflorin, dovedite științific că inhibă bacteriile responsabile de bolile gingivale.',
    '💪 Protecție antibacteriană și antioxidantă – sprijină sănătatea țesuturilor orale și previne acumularea plăcii dentare.',
    '🌿 Respirație proaspătă de lungă durată – gust fresh de mentă, senzație plăcută și revigorantă.',
    '✅ Siguranță dovedită – ingrediente aprobate USFDA și UKFDA, cu eficiență confirmată în studii clinice.',
  ];

  const benefitsEn = [
    '🌱 Natural composition & safe formula – without fluoride, triclosan or aggressive chemicals.',
    '🦷 Advanced gum care – reduces inflammation and gum bleeding.',
    '🔬 Active clinical ingredients – quercetin and paeoniflorin, scientifically proven to inhibit bacteria responsible for gum disease.',
    '💪 Antibacterial and antioxidant protection – supports oral tissue health and prevents plaque buildup.',
    '🌿 Long-lasting fresh breath – fresh mint taste, pleasant and invigorating sensation.',
    '✅ Proven safety – USFDA and UKFDA approved ingredients, with efficacy confirmed in clinical studies.',
  ];

  return (
    <MainLayout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4 opacity-0 animate-fade-up">
              <div className="card-premium overflow-hidden aspect-square">
                <img 
                  src={images[activeImage]} 
                  alt="Dent-Tastic"
                  className="w-full h-full object-contain p-8"
                />
              </div>
              <div className="flex gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`card-premium overflow-hidden w-20 h-20 p-2 transition-all ${
                      activeImage === index ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6 opacity-0 animate-fade-up animation-delay-200">
              <div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 mb-4">
                  {t('common.inStock')} – {language === 'ro' ? 'livrare rapidă' : 'fast delivery'}
                </Badge>
                <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-4">
                  {language === 'ro' ? 'Pasta de dinți Dent-Tastic Fresh Mint' : 'Dent-Tastic Fresh Mint Toothpaste'}
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {language === 'ro' 
                    ? 'DENT-TASTIC Fresh Mint este o pastă de dinți naturală, special concepută pentru sănătatea gingiilor. Formula sa inovatoare cu quercetin și paeoniflorin, ingrediente dovedite clinic, combate bacteriile care cauzează bolile gingivale, reduce inflamația și sângerările, protejează smalțul și țesuturile orale.'
                    : 'DENT-TASTIC Fresh Mint is a natural toothpaste specially designed for gum health. Its innovative formula with quercetin and paeoniflorin, clinically proven ingredients, fights bacteria that cause gum disease, reduces inflammation and bleeding, protects enamel and oral tissues.'}
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  {language === 'ro'
                    ? 'Cu un gust proaspăt de mentă și fără fluor sau triclosan, oferă o curățare delicată, protecție antibacteriană și o respirație proaspătă de lungă durată.'
                    : 'With a fresh mint taste and without fluoride or triclosan, it offers gentle cleaning, antibacterial protection and long-lasting fresh breath.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="outline">{language === 'ro' ? 'Formulă patentată în SUA' : 'USA patented formula'}</Badge>
                <Badge variant="outline">{language === 'ro' ? 'Fără fluor & triclosan' : 'Fluoride & triclosan free'}</Badge>
                <Badge variant="outline">{language === 'ro' ? 'Ingrediente clinice active' : 'Active clinical ingredients'}</Badge>
              </div>

              <div className="text-4xl font-bold text-primary">
                29,99 lei
              </div>

              {/* Benefits */}
              <div className="card-premium p-6 bg-primary/5">
                <ul className="space-y-3">
                  {(language === 'ro' ? benefits : benefitsEn).map((benefit, index) => (
                    <li key={index} className="text-sm leading-relaxed">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4 card-premium px-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t('common.addToCart')}
                </Button>
              </div>

              {/* Specifications */}
              <div className="pt-6 border-t border-border">
                <h3 className="font-display text-xl tracking-wide mb-4">
                  {language === 'ro' ? 'Specificații' : 'Specifications'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>{language === 'ro' ? 'Ingrediente:' : 'Ingredients:'}</strong>
                    <p className="text-muted-foreground mt-1">
                      Quercetin 1%, Paeoniflorine 0.5%, Calcium Carbonate, Aqua, Sorbitol, Glycerin, Sodium Lauryl Sulfate, Cellulose Gum, Hydroxypropyl Guar, Flavor, Sodium Saccharin, Methylparaben, Sodium Silicate, Sodium Phosphate, Quercus Alba Bark Extract, Paeonia Lactiflora Extract, Propylparaben
                    </p>
                  </div>
                  <div>
                    <strong>{language === 'ro' ? 'Greutate netă:' : 'Net weight:'}</strong>
                    <span className="text-muted-foreground ml-2">100g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Testimonials */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-12 opacity-0 animate-fade-up">
            {language === 'ro' ? 'Feedback Real – Testimoniale Profesionale' : 'Real Feedback – Professional Testimonials'}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="card-premium p-8 opacity-0 animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-primary font-medium mb-3">
                  {language === 'ro' ? testimonial.titleRo : testimonial.titleEn}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {language === 'ro' ? testimonial.textRo : testimonial.textEn}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductDentTastic;
