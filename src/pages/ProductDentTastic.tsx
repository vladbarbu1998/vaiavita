import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Star, Minus, Plus, ShoppingCart, Check, Quote, Upload, Send, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductSpecificationsDisplay, ProductSpecifications } from '@/components/product/ProductSpecifications';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import heroImage from '@/assets/hero-toothpaste.webp';
import { SEOHead } from '@/components/seo/SEOHead';

// Product ID from database
const PRODUCT_ID = 'a04ebe48-1ceb-4188-a9c4-99a8e14f0481';

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
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [specifications, setSpecifications] = useState<ProductSpecifications | null>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [productPrice, setProductPrice] = useState(32.99);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    review: '',
  });
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Fetch product data from database
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('price, specifications')
          .eq('id', PRODUCT_ID)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProductPrice(Number(data.price));
          if (data.specifications && typeof data.specifications === 'object' && 'items' in data.specifications) {
            setSpecifications(data.specifications as unknown as ProductSpecifications);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoadingSpecs(false);
      }
    };

    fetchProduct();
  }, []);

  const images = [dentTasticImage, heroImage];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: PRODUCT_ID,
        name: 'Pasta de dinți Dent-Tastic Fresh Mint',
        nameEn: 'Dent-Tastic Fresh Mint Toothpaste',
        price: productPrice,
        image: dentTasticImage,
        slug: 'dent-tastic',
        sku: 'dent01',
      });
    }
    toast({
      title: language === 'ro' ? 'Produs adăugat în coș!' : 'Product added to cart!',
      description: `${quantity}x Dent-Tastic Fresh Mint`,
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setReviewError('');

    // Validate form
    if (!reviewForm.name || !reviewForm.email || !reviewForm.review) {
      setReviewError(language === 'ro' ? 'Toate câmpurile sunt obligatorii.' : 'All fields are required.');
      setIsSubmitting(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewForm.email)) {
      setReviewError(language === 'ro' ? 'Adresa de email nu este validă.' : 'Email address is not valid.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if the email exists in any order
      const { data: orderExists, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', reviewForm.email.trim().toLowerCase())
        .limit(1);

      if (orderError) {
        console.error('Error checking order:', orderError);
        setReviewError(language === 'ro' ? 'A apărut o eroare. Încearcă din nou.' : 'An error occurred. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (!orderExists || orderExists.length === 0) {
        setReviewError(
          language === 'ro' 
            ? 'Nu am găsit nicio comandă cu acest email. Doar clienții care au cumpărat pot lăsa recenzii.' 
            : 'No order found with this email. Only customers who have purchased can leave reviews.'
        );
        setIsSubmitting(false);
        return;
      }

      // Insert review into database - auto-approved since email is verified
      const userAgent = navigator.userAgent;
      
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          product_id: PRODUCT_ID,
          customer_name: reviewForm.name.trim(),
          customer_email: reviewForm.email.trim().toLowerCase(),
          rating: reviewForm.rating,
          content: reviewForm.review.trim(),
          is_verified_purchase: true,
          is_approved: true, // Auto-approve verified purchase reviews
          order_id: orderExists[0].id,
          user_agent: userAgent,
        });

      if (reviewError) {
        console.error('Error submitting review:', reviewError);
        setReviewError(language === 'ro' ? 'A apărut o eroare la trimiterea recenziei.' : 'An error occurred while submitting the review.');
        setIsSubmitting(false);
        return;
      }

      toast({
        title: language === 'ro' ? 'Recenzie publicată!' : 'Review published!',
        description: language === 'ro' 
          ? 'Mulțumim pentru feedback-ul tău!'
          : 'Thank you for your feedback!',
      });
      
      setReviewForm({ name: '', email: '', rating: 5, review: '' });
      setReviewImages([]);
    } catch (error) {
      console.error('Review submission error:', error);
      setReviewError(language === 'ro' ? 'A apărut o eroare. Încearcă din nou.' : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - reviewImages.length);
      setReviewImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
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
      <SEOHead
        title="Dent-Tastic Fresh Mint - Pastă de Dinți Naturală | VAIAVITA"
        description="Pastă de dinți naturală Dent-Tastic Fresh Mint cu quercetin și paeoniflorin. Fără fluor, fără triclosan. Formulă patentată SUA pentru sănătatea gingiilor."
        url="/produse/dent-tastic"
        type="product"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            'name': 'Dent-Tastic Fresh Mint',
            'description': 'Pastă de dinți naturală cu quercetin și paeoniflorin, special concepută pentru sănătatea gingiilor. Formulă patentată în SUA, fără fluor și triclosan.',
            'image': 'https://vaiavita.ro/og-image.jpg',
            'sku': 'dent01',
            'brand': { '@type': 'Brand', 'name': 'VAIAVITA' },
            'offers': {
              '@type': 'Offer',
              'price': productPrice.toString(),
              'priceCurrency': 'RON',
              'availability': 'https://schema.org/InStock',
              'url': 'https://vaiavita.ro/produse/dent-tastic',
              'seller': { '@type': 'Organization', 'name': 'VAIAVITA S.R.L.' },
            },
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': '5.0',
              'reviewCount': '2',
              'bestRating': '5',
              'worstRating': '1',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Acasă', 'item': 'https://vaiavita.ro/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Produse', 'item': 'https://vaiavita.ro/produse' },
              { '@type': 'ListItem', 'position': 3, 'name': 'Dent-Tastic Fresh Mint', 'item': 'https://vaiavita.ro/produse/dent-tastic' },
            ],
          },
        ]}
      />
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
                    ? 'DENT-TASTIC Fresh Mint este o pastă de dinți naturală, special concepută pentru sănătatea gingiilor. Formula sa inovatoare cu quercetin și paeoniflorin, ingrediente dovedite clinic, combate bacteriile care cauzează bolile gingivale.'
                    : 'DENT-TASTIC Fresh Mint is a natural toothpaste specially designed for gum health. Its innovative formula with quercetin and paeoniflorin, clinically proven ingredients, fights bacteria that cause gum disease.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{language === 'ro' ? 'Formulă patentată în SUA' : 'USA patented formula'}</Badge>
                <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{language === 'ro' ? 'Fără fluor' : 'Fluoride free'}</Badge>
                <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{language === 'ro' ? 'Ingrediente clinice' : 'Clinical ingredients'}</Badge>
              </div>

              <div className="text-4xl font-bold text-primary">{formatPrice(productPrice)}</div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="inline-flex items-center gap-1 card-premium px-2 py-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center">
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
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-8 overflow-x-auto">
                <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap">
                  {language === 'ro' ? 'Descriere' : 'Description'}
                </TabsTrigger>
                <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap">
                  {language === 'ro' ? 'Specificații' : 'Specifications'}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap">
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
                {loadingSpecs ? (
                  <div className="card-premium p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ProductSpecificationsDisplay specifications={specifications} />
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="space-y-8">
                  {/* Rating Summary */}
                  <div className="card-premium p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary mb-2">5.0</div>
                      <div className="flex gap-1 justify-center mb-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-sm text-muted-foreground">2 {language === 'ro' ? 'recenzii' : 'reviews'}</p>
                    </div>
                    <div className="flex-1 w-full sm:w-auto space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-3 text-sm">
                          <span className="w-3">{stars}</span>
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: stars === 5 ? '100%' : '0%' }} />
                          </div>
                          <span className="w-8 text-muted-foreground">{stars === 5 ? '2' : '0'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Testimonials */}
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

                  {/* Review Submission Form */}
                  <div className="card-premium p-8">
                    <h3 className="font-display text-2xl tracking-wide mb-2">
                      {language === 'ro' ? 'Scrie o recenzie' : 'Write a review'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {language === 'ro' 
                        ? 'Doar clienții verificați pot lăsa recenzii. Introdu emailul cu care ai plasat comanda.'
                        : 'Only verified customers can leave reviews. Enter the email you used for your order.'}
                    </p>

                    {reviewError && (
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive mb-6">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{reviewError}</p>
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {language === 'ro' ? 'Nume *' : 'Name *'}
                          </label>
                          <input
                            type="text"
                            value={reviewForm.name}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {language === 'ro' ? 'Adresă email *' : 'Email address *'}
                          </label>
                          <input
                            type="email"
                            value={reviewForm.email}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder={language === 'ro' ? 'Email-ul folosit la comandă' : 'Email used for your order'}
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'ro' ? 'Rating *' : 'Rating *'}
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'ro' ? 'Recenzie *' : 'Review *'}
                        </label>
                        <textarea
                          value={reviewForm.review}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, review: e.target.value }))}
                          rows={4}
                          placeholder={language === 'ro' ? 'Spune-ne experiența ta cu produsul...' : 'Tell us about your experience with the product...'}
                          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'ro' ? 'Poze (opțional, max 5)' : 'Photos (optional, max 5)'}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {reviewImages.map((file, index) => (
                            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {reviewImages.length < 5 && (
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center transition-colors">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <Button type="submit" variant="hero" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            {language === 'ro' ? 'Se trimite...' : 'Submitting...'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            {language === 'ro' ? 'Trimite recenzia' : 'Submit review'}
                          </span>
                        )}
                      </Button>
                    </form>
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
