import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Star, Minus, Plus, ShoppingCart, Check, Quote } from 'lucide-react';
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
    textRo: 'Folosesc Dent-Tastic de doi ani și l-am recomandat atât pacienților mei, cât și prietenilor. Cu toții am devenit dependenți de senzația sa revigorantă și de prospețimea de lungă durată pe care o oferă.',
    textEn: 'I have been using Dent-Tastic for two years and have recommended it to both my patients and friends. We have all become addicted to its invigorating sensation and the long-lasting freshness it provides.',
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
      description: 'Dent-Tastic Fresh Mint',
    });
  };

  const benefits = [
    '🌱 Compoziție naturală & formulă sigură – fără fluor, triclosan sau substanțe chimice agresive.',
    '🦷 Îngrijire avansată a gingiilor – reduce inflamațiile și sângerările gingivale.',
    '🔬 Ingrediente clinice active – quercetin și paeoniflorin, dovedite științific.',
    '💪 Protecție antibacteriană și antioxidantă – sprijină sănătatea țesuturilor orale.',
    '🌿 Respirație proaspătă de lungă durată – gust fresh de mentă.',
    '✅ Siguranță dovedită – ingrediente aprobate USFDA și UKFDA.',
  ];

  const benefitsEn = [
    '🌱 Natural composition & safe formula – without fluoride, triclosan or aggressive chemicals.',
    '🦷 Advanced gum care – reduces inflammation and gum bleeding.',
    '🔬 Active clinical ingredients – quercetin and paeoniflorin, scientifically proven.',
    '💪 Antibacterial and antioxidant protection – supports oral tissue health.',
    '🌿 Long-lasting fresh breath – fresh mint taste.',
    '✅ Proven safety – USFDA and UKFDA approved ingredients.',
  ];

  return (
    <MainLayout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4 opacity-0 animate-fade-up">
              <div className="card-premium overflow-hidden aspect-square bg-gradient-to-br from-muted/50 to-muted/30">
                <img src={images[activeImage]} alt="Dent-Tastic" className="w-full h-full object-contain p-8" />
              </div>
              <div className="flex gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`card-premium overflow-hidden w-20 h-20 p-2 transition-all ${activeImage === index ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'}`}
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
                    ? 'DENT-TASTIC Fresh Mint este o pastă de dinți naturală, special concepută pentru sănătatea gingiilor.'
                    : 'DENT-TASTIC Fresh Mint is a natural toothpaste specially designed for gum health.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{language === 'ro' ? 'Formulă patentată în SUA' : 'USA patented formula'}</Badge>
                <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{language === 'ro' ? 'Fără fluor' : 'Fluoride free'}</Badge>
              </div>

              <div className="text-4xl font-bold text-primary">29,99 lei</div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4 card-premium px-4 py-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-primary transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-primary transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t('common.addToCart')}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-16 opacity-0 animate-fade-up animation-delay-300">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-8">
                <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-display text-base">
                  {language === 'ro' ? 'Descriere' : 'Description'}
                </TabsTrigger>
                <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-display text-base">
                  {language === 'ro' ? 'Specificații' : 'Specifications'}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-display text-base">
                  {language === 'ro' ? 'Recenzii' : 'Reviews'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-0">
                <div className="card-premium p-8">
                  <ul className="space-y-4">
                    {(language === 'ro' ? benefits : benefitsEn).map((benefit, index) => (
                      <li key={index} className="text-base leading-relaxed">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-0">
                <div className="card-premium p-8 space-y-6">
                  <div>
                    <h4 className="font-display text-lg mb-2">{language === 'ro' ? 'Ingrediente:' : 'Ingredients:'}</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Quercetin 1%, Paeoniflorine 0.5%, Calcium Carbonate, Aqua, Sorbitol, Glycerin, Sodium Lauryl Sulfate, Cellulose Gum, Hydroxypropyl Guar, Flavor, Sodium Saccharin, Methylparaben, Sodium Silicate, Sodium Phosphate, Quercus Alba Bark Extract, Paeonia Lactiflora Extract, Propylparaben
                    </p>
                  </div>
                  <div>
                    <h4 className="font-display text-lg mb-2">{language === 'ro' ? 'Greutate netă:' : 'Net weight:'}</h4>
                    <p className="text-muted-foreground">100g</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <span className="text-2xl font-bold">5.0</span>
                    <span className="text-muted-foreground">(2 {language === 'ro' ? 'recenzii profesionale' : 'professional reviews'})</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {testimonials.map((testimonial, index) => (
                      <div key={index} className="card-premium p-6 relative">
                        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
                        <div className="flex gap-1 mb-3">
                          {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                        </div>
                        <p className="text-sm text-primary font-medium mb-2">{language === 'ro' ? testimonial.titleRo : testimonial.titleEn}</p>
                        <p className="text-muted-foreground leading-relaxed mb-4">{language === 'ro' ? testimonial.textRo : testimonial.textEn}</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{testimonial.initials}</div>
                          <div>
                            <p className="font-medium text-sm">{testimonial.name}</p>
                            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductDentTastic;
