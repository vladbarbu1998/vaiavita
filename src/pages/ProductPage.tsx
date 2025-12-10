import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Star, Minus, Plus, ShoppingCart, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductSpecificationsDisplay, ProductSpecifications } from '@/components/product/ProductSpecifications';
import { ImageGallery } from '@/components/product/ImageGallery';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import qivaroImage from '@/assets/qivaro.webp';

// Fallback images for products without uploaded images
const fallbackImages: Record<string, string> = {
  'dent-tastic': dentTasticImage,
  'qivaro-supplements': qivaroImage,
};

interface Category {
  id: string;
  name_ro: string;
  name_en: string;
  slug: string;
}

interface Product {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  description_ro: string | null;
  description_en: string | null;
  short_description_ro: string | null;
  short_description_en: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: string;
  images: string[] | null;
  specifications: ProductSpecifications | null;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  content: string | null;
  title: string | null;
  created_at: string;
  is_verified_purchase: boolean | null;
}

interface ReviewFormData {
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  content: string;
}

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    customer_name: '',
    customer_email: '',
    rating: 5,
    title: '',
    content: '',
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          navigate('/produse');
          return;
        }

        // Parse specifications
        let specs: ProductSpecifications | null = null;
        if (data.specifications && typeof data.specifications === 'object' && 'items' in data.specifications) {
          specs = data.specifications as unknown as ProductSpecifications;
        }

        setProduct({
          ...data,
          specifications: specs,
        });

        // Fetch product categories
        const { data: productCategoriesData } = await supabase
          .from('product_categories')
          .select('category_id')
          .eq('product_id', data.id);

        if (productCategoriesData && productCategoriesData.length > 0) {
          const categoryIds = productCategoriesData.map(pc => pc.category_id);
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, name_ro, name_en, slug')
            .in('id', categoryIds);
          
          if (categoriesData) {
            setCategories(categoriesData);
          }
        }

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, customer_name, rating, content, title, created_at, is_verified_purchase')
          .eq('product_id', data.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setReviewStats({ averageRating: avg, reviewCount: reviewsData.length });
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/produse');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, navigate]);

  const scrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name_ro,
        nameEn: product.name_en,
        price: Number(product.price),
        image: getProductImage(),
        slug: product.slug,
      });
    }
    
    toast({
      title: language === 'ro' ? 'Produs adăugat în coș!' : 'Product added to cart!',
      description: `${quantity}x ${language === 'ro' ? product.name_ro : product.name_en}`,
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    // Validate form
    if (!reviewForm.customer_name.trim() || !reviewForm.customer_email.trim() || !reviewForm.content.trim()) {
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' ? 'Completează toate câmpurile obligatorii.' : 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewForm.customer_email)) {
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' ? 'Introdu o adresă de email validă.' : 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    setReviewSubmitting(true);
    
    try {
      const productName = language === 'ro' ? product.name_ro : product.name_en;
      
      // Check if email has a delivered order containing this specific product
      // We check both product_id and product_name since product_id might be null
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_items!inner(product_id, product_name)
        `)
        .eq('customer_email', reviewForm.customer_email.trim().toLowerCase())
        .eq('status', 'delivered');
      
      // Filter orders that contain this product (by product_id or product_name)
      const validOrder = orderData?.find(order => {
        const items = order.order_items as Array<{ product_id: string | null; product_name: string }>;
        return items.some(item => 
          item.product_id === product.id || 
          item.product_name.trim().toLowerCase() === product.name_ro.trim().toLowerCase() ||
          item.product_name.trim().toLowerCase() === product.name_en.trim().toLowerCase()
        );
      });
      
      const isVerifiedPurchase = !!validOrder;
      
      // Only verified purchases with delivered orders can submit reviews
      if (!isVerifiedPurchase) {
        // Check if they have an order but it's not delivered yet
        const { data: pendingOrderData } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            order_items!inner(product_id, product_name)
          `)
          .eq('customer_email', reviewForm.customer_email.trim().toLowerCase())
          .neq('status', 'delivered');
        
        const hasPendingOrder = pendingOrderData?.some(order => {
          const items = order.order_items as Array<{ product_id: string | null; product_name: string }>;
          return items.some(item => 
            item.product_id === product.id || 
            item.product_name.trim().toLowerCase() === product.name_ro.trim().toLowerCase() ||
            item.product_name.trim().toLowerCase() === product.name_en.trim().toLowerCase()
          );
        });
        
        if (hasPendingOrder) {
          toast({
            title: language === 'ro' ? 'Comanda nu este finalizată' : 'Order not completed',
            description: language === 'ro' 
              ? 'Poți lăsa o recenzie doar după ce comanda a fost livrată.' 
              : 'You can leave a review only after your order has been delivered.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: language === 'ro' ? 'Nu poți lăsa o recenzie' : 'Cannot submit review',
            description: language === 'ro' 
              ? 'Doar clienții care au cumpărat acest produs pot lăsa o recenzie. Verifică adresa de email folosită la comandă.' 
              : 'Only customers who have purchased this product can leave a review. Please check the email address used for your order.',
            variant: 'destructive',
          });
        }
        setReviewSubmitting(false);
        return;
      }
      
      const orderId = validOrder.id;
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: product.id,
          customer_name: reviewForm.customer_name.trim(),
          customer_email: reviewForm.customer_email.trim().toLowerCase(),
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || null,
          content: reviewForm.content.trim(),
          is_verified_purchase: true,
          order_id: orderId,
          is_approved: true, // Auto-approve verified purchase reviews
        });
      
      if (error) throw error;
      
      // Refresh reviews to show the new one immediately
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, customer_name, rating, content, title, created_at, is_verified_purchase')
        .eq('product_id', product.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setReviewStats({ averageRating: avg, reviewCount: reviewsData.length });
        setReviews(reviewsData);
      }
      
      setReviewSubmitted(true);
      setShowReviewForm(false);
      setReviewForm({
        customer_name: '',
        customer_email: '',
        rating: 5,
        title: '',
        content: '',
      });
      
      toast({
        title: language === 'ro' ? 'Recenzie publicată!' : 'Review published!',
        description: language === 'ro' 
          ? 'Mulțumim pentru recenzie! A fost publicată cu succes.' 
          : 'Thank you for your review! It has been published successfully.',
      });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' ? 'Nu am putut trimite recenzia. Încearcă din nou.' : 'Could not submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getProductImage = () => {
    if (product?.images && product.images.length > 0) {
      return product.images[0];
    }
    return fallbackImages[product?.slug || ''] || dentTasticImage;
  };

  const getProductImages = (): string[] => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    // Return fallback image if available
    const fallback = fallbackImages[product?.slug || ''];
    return fallback ? [fallback] : [dentTasticImage];
  };

  if (loading) {
    return (
      <MainLayout>
        <section className="section-padding">
          <div className="container-custom flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </section>
      </MainLayout>
    );
  }

  if (!product) {
    return null;
  }

  const images = getProductImages();
  const isInStock = product.stock > 0 && product.status === 'active';

  return (
    <MainLayout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image Gallery */}
            <div className="relative">
              <ImageGallery 
                images={images} 
                productName={language === 'ro' ? product.name_ro : product.name_en} 
              />
            </div>

            {/* Product Details */}
            <div className="space-y-6 opacity-0 animate-fade-up animation-delay-200">
              <div>
                <Badge className={`mb-4 ${
                  isInStock 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {isInStock ? t('common.inStock') : t('common.outOfStock')}
                </Badge>
                {/* Categories */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {categories.map((category) => (
                      <Badge key={category.id} variant="secondary" className="text-xs">
                        {language === 'ro' ? category.name_ro : category.name_en}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <h1 className="font-display text-3xl md:text-4xl tracking-wide">
                  {language === 'ro' ? product.name_ro : product.name_en}
                </h1>
                
                {/* Rating Stars under title */}
                <button 
                  onClick={scrollToReviews}
                  className="flex items-center gap-2 mt-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${
                          star <= Math.floor(reviewStats.averageRating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : star <= reviewStats.averageRating + 0.5
                              ? 'fill-yellow-400/50 text-yellow-400' 
                              : 'text-muted-foreground/40'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">
                    {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-muted-foreground">
                    ({reviewStats.reviewCount})
                  </span>
                </button>

                {(product.short_description_ro || product.short_description_en) && (
                  <p className="text-muted-foreground leading-relaxed mt-4 whitespace-pre-line">
                    {language === 'ro' ? product.short_description_ro : product.short_description_en}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(Number(product.price))}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(Number(product.compare_at_price))}
                  </span>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              {isInStock && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="inline-flex items-center gap-1 card-premium px-2 py-1">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} 
                      className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('common.addToCart')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <div ref={tabsRef} className="mt-16 opacity-0 animate-fade-up animation-delay-300">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-8 overflow-x-auto">
                <TabsTrigger 
                  value="description" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap"
                >
                  {language === 'ro' ? 'Descriere' : 'Description'}
                </TabsTrigger>
                <TabsTrigger 
                  value="specifications" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap"
                >
                  {language === 'ro' ? 'Specificații' : 'Specifications'}
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 font-display text-base whitespace-nowrap"
                >
                  {language === 'ro' ? 'Recenzii' : 'Reviews'} ({reviewStats.reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-0">
                <div className="card-premium p-8">
                  {product.description_ro || product.description_en ? (
                    <div className="prose prose-lg max-w-none text-foreground whitespace-pre-line leading-relaxed">
                      {(language === 'ro' ? product.description_ro : product.description_en) || ''}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {language === 'ro' ? 'Nu există descriere disponibilă.' : 'No description available.'}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-0">
                <ProductSpecificationsDisplay specifications={product.specifications} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="card-premium p-8">
                  {/* Add Review Button */}
                  {!reviewSubmitted && !showReviewForm && (
                    <div className="mb-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowReviewForm(true)}
                      >
                        {language === 'ro' ? 'Scrie o recenzie' : 'Write a review'}
                      </Button>
                    </div>
                  )}

                  {/* Review Submitted Message */}
                  {reviewSubmitted && (
                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-700 dark:text-green-400">
                        {language === 'ro' 
                          ? 'Mulțumim pentru recenzie! Va fi afișată după aprobare.' 
                          : 'Thank you for your review! It will be displayed after approval.'}
                      </p>
                    </div>
                  )}

                  {/* Review Form */}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="mb-8 p-6 rounded-xl bg-muted/30 border border-border space-y-4">
                      <h3 className="font-display text-lg mb-4">
                        {language === 'ro' ? 'Scrie o recenzie' : 'Write a review'}
                      </h3>
                      
                      {/* Rating */}
                      <div className="space-y-2">
                        <Label>{language === 'ro' ? 'Rating *' : 'Rating *'}</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star 
                                className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="review_name">{language === 'ro' ? 'Nume *' : 'Name *'}</Label>
                          <Input
                            id="review_name"
                            value={reviewForm.customer_name}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, customer_name: e.target.value }))}
                            placeholder={language === 'ro' ? 'Numele tău' : 'Your name'}
                            maxLength={100}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review_email">{language === 'ro' ? 'Email *' : 'Email *'}</Label>
                          <Input
                            id="review_email"
                            type="email"
                            value={reviewForm.customer_email}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, customer_email: e.target.value }))}
                            placeholder={language === 'ro' ? 'email@exemplu.com' : 'email@example.com'}
                            maxLength={255}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            {language === 'ro' 
                              ? 'Emailul nu va fi afișat public. Folosit doar pentru verificare.' 
                              : 'Email will not be displayed publicly. Used for verification only.'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review_title">{language === 'ro' ? 'Titlu (opțional)' : 'Title (optional)'}</Label>
                        <Input
                          id="review_title"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder={language === 'ro' ? 'Titlul recenziei' : 'Review title'}
                          maxLength={200}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review_content">{language === 'ro' ? 'Recenzia ta *' : 'Your review *'}</Label>
                        <Textarea
                          id="review_content"
                          value={reviewForm.content}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                          placeholder={language === 'ro' ? 'Spune-ne părerea ta despre acest produs...' : 'Tell us what you think about this product...'}
                          rows={4}
                          maxLength={2000}
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="hero" disabled={reviewSubmitting}>
                          {reviewSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {language === 'ro' ? 'Se trimite...' : 'Submitting...'}
                            </>
                          ) : (
                            language === 'ro' ? 'Trimite recenzia' : 'Submit review'
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowReviewForm(false)}
                          disabled={reviewSubmitting}
                        >
                          {language === 'ro' ? 'Anulează' : 'Cancel'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {reviewStats.reviewCount > 0 ? (
                    <div className="space-y-6">
                      {/* Rating Summary */}
                      <div className="flex items-center gap-4 pb-6 border-b border-border">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-6 h-6 ${star <= Math.round(reviewStats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-2xl font-bold">{reviewStats.averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({reviewStats.reviewCount} {language === 'ro' ? 'recenzii' : 'reviews'})
                        </span>
                      </div>

                      {/* Reviews List */}
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="pb-6 border-b border-border last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{review.customer_name}</span>
                                  {review.is_verified_purchase && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                      {language === 'ro' ? 'Cumpărător verificat' : 'Verified purchase'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.title && (
                              <h4 className="font-medium mb-2">{review.title}</h4>
                            )}
                            {review.content && (
                              <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !showReviewForm && !reviewSubmitted && (
                    <p className="text-muted-foreground">
                      {language === 'ro' ? 'Nu există recenzii încă. Fii primul care scrie o recenzie!' : 'No reviews yet. Be the first to write a review!'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductPage;
