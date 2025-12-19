import { useState, useEffect, useRef, useMemo, TouchEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTrackingInfo } from '@/hooks/useIpTracking';
import { MainLayout } from '@/components/layout';
import { BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart, PROMO_CONFIG } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Star, Minus, Plus, ShoppingCart, Loader2, CheckCircle, ImagePlus, X, Gift, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductSpecificationsDisplay, ProductSpecifications } from '@/components/product/ProductSpecifications';
import { ImageGallery } from '@/components/product/ImageGallery';
import { ProfessionalTestimonials } from '@/components/product/ProfessionalTestimonials';
import dentTasticImage from '@/assets/dent-tastic-product.webp';
import qivaroImage from '@/assets/qivaro.webp';
import dentalmedLogo from '@/assets/dentalmed-logo.png';

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
  related_products: string[] | null;
  product_number: number;
}

interface RelatedProduct {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  price: number;
  images: string[] | null;
}

interface RelatedProductRating {
  productId: string;
  averageRating: number;
  reviewCount: number;
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
  content_ro: string | null;
  content_en: string | null;
  title_ro: string | null;
  title_en: string | null;
  created_at: string;
  is_verified_purchase: boolean | null;
  images: string[] | null;
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
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [relatedProductRatings, setRelatedProductRatings] = useState<Map<string, RelatedProductRating>>(new Map());
  const [promoGiftProduct, setPromoGiftProduct] = useState<{ slug: string; name_ro: string; name_en: string } | null>(null);
  const [promoTriggerProduct, setPromoTriggerProduct] = useState<{ slug: string; name_ro: string; name_en: string } | null>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [mobileAccordionValue, setMobileAccordionValue] = useState<string>('description');
  const [mobileRelatedIndex, setMobileRelatedIndex] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const mobileAccordionRef = useRef<HTMLDivElement>(null);
  const relatedTouchStartX = useRef<number>(0);
  const relatedTouchEndX = useRef<number>(0);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [couponSentWithReview, setCouponSentWithReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);
  
  // Review image lightbox state
  const [reviewLightboxOpen, setReviewLightboxOpen] = useState(false);
  const [reviewLightboxImages, setReviewLightboxImages] = useState<string[]>([]);
  const [reviewLightboxIndex, setReviewLightboxIndex] = useState(0);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    customer_name: '',
    customer_email: '',
    rating: 5,
    title: '',
    content: '',
  });

  // Fetch IP address on mount
  useEffect(() => {
    getTrackingInfo().then(info => {
      setIpAddress(info.ip_address);
    });
  }, []);

  const handleRelatedTouchStart = (e: TouchEvent) => {
    relatedTouchStartX.current = e.touches[0].clientX;
  };

  const handleRelatedTouchMove = (e: TouchEvent) => {
    relatedTouchEndX.current = e.touches[0].clientX;
  };

  const handleRelatedTouchEnd = () => {
    const diff = relatedTouchStartX.current - relatedTouchEndX.current;
    const threshold = 50;
    
    if (diff > threshold && mobileRelatedIndex < relatedProducts.length - 1) {
      setMobileRelatedIndex(prev => prev + 1);
    } else if (diff < -threshold && mobileRelatedIndex > 0) {
      setMobileRelatedIndex(prev => prev - 1);
    }
  };

  const handleQuickAddRelated = (relProd: RelatedProduct) => {
    addItem({
      id: relProd.id,
      name: relProd.name_ro,
      nameEn: relProd.name_en,
      price: relProd.price,
      image: relProd.images?.[0] || '',
      slug: relProd.slug,
    });
    
    toast({
      title: language === 'ro' ? 'Adăugat în coș' : 'Added to cart',
      description: language === 'ro' ? relProd.name_ro : relProd.name_en,
    });
  };

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

        const productData = {
          ...data,
          specifications: specs,
          related_products: data.related_products as string[] | null,
        };

        setProduct(productData);

        // Fetch related products if any
        if (data.related_products && (data.related_products as string[]).length > 0) {
          const { data: relatedData } = await supabase
            .from('products')
            .select('id, slug, name_ro, name_en, price, images')
            .in('id', data.related_products as string[])
            .eq('status', 'active');
          
          if (relatedData) {
            setRelatedProducts(relatedData);
            
            // Fetch ratings for related products using public_reviews view
            const relatedIds = relatedData.map(p => p.id);
            const { data: relatedReviewsData } = await supabase
              .from('public_reviews')
              .select('product_id, rating')
              .in('product_id', relatedIds);

            if (relatedReviewsData) {
              const ratingsMap = new Map<string, RelatedProductRating>();
              const reviewsByProduct = relatedReviewsData.reduce((acc, review) => {
                if (!acc[review.product_id]) {
                  acc[review.product_id] = [];
                }
                acc[review.product_id].push(review.rating);
                return acc;
              }, {} as Record<string, number[]>);

              Object.entries(reviewsByProduct).forEach(([productId, ratings]) => {
                const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                ratingsMap.set(productId, {
                  productId,
                  averageRating: avg,
                  reviewCount: ratings.length,
                });
              });

              setRelatedProductRatings(ratingsMap);
            }
          }
        }

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

        // Fetch reviews using public_reviews view (excludes customer_email)
        const { data: reviewsData } = await supabase
          .from('public_reviews')
          .select('id, customer_name, rating, content, title, content_ro, content_en, title_ro, title_en, created_at, is_verified_purchase, images')
          .eq('product_id', data.id)
          .order('created_at', { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setReviewStats({ averageRating: avg, reviewCount: reviewsData.length });
          setReviews(reviewsData);
        }

        // Fetch promo products for banner display
        const { data: promoProducts } = await supabase
          .from('products')
          .select('product_number, slug, name_ro, name_en')
          .in('product_number', [PROMO_CONFIG.triggerProductNumber, PROMO_CONFIG.giftProductNumber]);
        
        if (promoProducts) {
          const trigger = promoProducts.find(p => p.product_number === PROMO_CONFIG.triggerProductNumber);
          const gift = promoProducts.find(p => p.product_number === PROMO_CONFIG.giftProductNumber);
          if (trigger) setPromoTriggerProduct({ slug: trigger.slug, name_ro: trigger.name_ro, name_en: trigger.name_en });
          if (gift) setPromoGiftProduct({ slug: gift.slug, name_ro: gift.name_ro, name_en: gift.name_en });
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
    // Check if mobile (accordion) or desktop (tabs)
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      setMobileAccordionValue('reviews');
      // Wait for accordion to expand before scrolling
      setTimeout(() => {
        mobileAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      setActiveTab('reviews');
      // Wait for tab change animation before scrolling
      setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
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
      // Call edge function to verify purchase (bypasses RLS, works for unauthenticated users)
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-purchase', {
        body: {
          email: reviewForm.customer_email.trim().toLowerCase(),
          product_id: product.id,
          product_name_ro: product.name_ro,
          product_name_en: product.name_en,
        }
      });
      
      if (verifyError) {
        console.error('Verification error:', verifyError);
        toast({
          title: language === 'ro' ? 'Eroare' : 'Error',
          description: language === 'ro' ? 'A apărut o eroare. Încearcă din nou.' : 'An error occurred. Please try again.',
          variant: 'destructive',
        });
        setReviewSubmitting(false);
        return;
      }
      
      if (!verifyData?.verified) {
        const title = verifyData?.reason === 'already_reviewed' 
          ? (language === 'ro' ? 'Recenzie existentă' : 'Review exists')
          : verifyData?.reason === 'order_not_delivered'
          ? (language === 'ro' ? 'Comanda nu este finalizată' : 'Order not completed')
          : (language === 'ro' ? 'Nu poți lăsa o recenzie' : 'Cannot submit review');
        
        toast({
          title,
          description: language === 'ro' ? verifyData?.message_ro : verifyData?.message_en,
          variant: 'destructive',
        });
        setReviewSubmitting(false);
        return;
      }
      
      const orderId = verifyData.order_id;
      
      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (reviewImages.length > 0) {
        setUploadingImages(true);
        for (const file of reviewImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${product.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('reviews')
            .upload(filePath, file);
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('reviews')
              .getPublicUrl(filePath);
            uploadedImageUrls.push(publicUrl);
          }
        }
        setUploadingImages(false);
      }
      
      // Detect language and translate
      const titleText = reviewForm.title.trim() || null;
      const contentText = reviewForm.content.trim();
      
      // Assume Romanian by default, translate to English
      let titleRo = titleText;
      let titleEn = null as string | null;
      let contentRo = contentText;
      let contentEn = null as string | null;

      // Auto-translate to English
      const textsToTranslate: Record<string, string> = {};
      if (titleText) textsToTranslate.title = titleText;
      if (contentText) textsToTranslate.content = contentText;

      if (Object.keys(textsToTranslate).length > 0) {
        try {
          const { data: translationData } = await supabase.functions.invoke('translate-text', {
            body: { texts: textsToTranslate, sourceLanguage: 'ro', targetLanguage: 'en' }
          });

          if (translationData?.translations) {
            if (translationData.translations.title) titleEn = translationData.translations.title;
            if (translationData.translations.content) contentEn = translationData.translations.content;
          }
        } catch (transError) {
          console.error('Translation error:', transError);
          // Continue without translation
        }
      }

      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert({
          product_id: product.id,
          customer_name: reviewForm.customer_name.trim(),
          customer_email: reviewForm.customer_email.trim().toLowerCase(),
          rating: reviewForm.rating,
          title: titleText,
          content: contentText,
          title_ro: titleRo,
          title_en: titleEn,
          content_ro: contentRo,
          content_en: contentEn,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          is_verified_purchase: true,
          order_id: orderId,
          is_approved: true,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Send review coupon email and check if coupon was sent
      let couponWasSent = false;
      if (newReview?.id) {
        try {
          const couponResponse = await supabase.functions.invoke('send-review-coupon', {
            body: {
              review_id: newReview.id,
              customer_email: reviewForm.customer_email.trim().toLowerCase(),
              customer_name: reviewForm.customer_name.trim(),
              product_name: language === 'ro' ? product.name_ro : product.name_en,
              language: language,
            }
          });
          // Check if a new coupon was generated (coupon_code will be null if email already had one)
          if (couponResponse?.data?.coupon_code) {
            couponWasSent = true;
          }
        } catch (couponError) {
          console.error('Error sending review coupon:', couponError);
          // Don't block review submission if coupon fails
        }
      }
      
      setCouponSentWithReview(couponWasSent);
      
      // Refresh reviews to show the new one immediately (use public_reviews view for unauthenticated users)
      const { data: reviewsData } = await supabase
        .from('public_reviews')
        .select('id, customer_name, rating, content, title, content_ro, content_en, title_ro, title_en, created_at, is_verified_purchase, images')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setReviewStats({ averageRating: avg, reviewCount: reviewsData.length });
        setReviews(reviewsData);
      }
      
      setReviewSubmitted(true);
      setShowReviewForm(false);
      setReviewImages([]);
      setReviewImagePreviews([]);
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

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Produse', labelEn: 'Products', href: '/produse' },
  ];
  
  // Add first category if exists
  if (categories.length > 0) {
    const firstCategory = categories[0];
    breadcrumbItems.push({
      label: firstCategory.name_ro,
      labelEn: firstCategory.name_en,
      href: `/produse?categorie=${firstCategory.slug}`,
    });
  }
  
  // Add product name (no href = current page)
  breadcrumbItems.push({
    label: product.name_ro,
    labelEn: product.name_en,
  });

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <section className="section-padding overflow-hidden">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="relative overflow-hidden">
              <ImageGallery 
                images={images} 
                productName={language === 'ro' ? product.name_ro : product.name_en} 
              />
              
              {/* Dentalmed Recommendation Badge - Under gallery for toothpaste (product_number 1) */}
              {product.product_number === 1 && (
                <div className="mt-6 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 p-1.5 bg-white rounded-lg">
                      <img 
                        src={dentalmedLogo} 
                        alt="DentalMed" 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {language === 'ro' 
                        ? <>Recomandat cu încredere de partenerii noștri <a href="https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline hover:no-underline">DentalMed Brașov</a></>
                        : <>Recommended with confidence by our partners <a href="https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline hover:no-underline">DentalMed Brașov</a></>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6 opacity-0 animate-fade-up animation-delay-200 overflow-hidden">
              <div>
                <Badge className={`mb-4 ${
                  isInStock 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {isInStock ? t('common.inStock') : t('common.outOfStock')}
                </Badge>
                
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide break-words">
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

                {/* Promo Banner - Show on trigger product (ID 1) */}
                {product.product_number === PROMO_CONFIG.triggerProductNumber && promoGiftProduct && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-green-700 dark:text-green-400">
                          {language === 'ro' ? '🎁 Oferte speciale!' : '🎁 Special offers!'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ro' 
                            ? <>✓ La {PROMO_CONFIG.minQuantityGift}+ paste cumpărate → <Link to={`/produse/${promoGiftProduct.slug}`} className="text-green-600 hover:underline font-medium">{promoGiftProduct.name_ro}</Link> cadou!</>
                            : <>✓ Buy {PROMO_CONFIG.minQuantityGift}+ toothpastes → free <Link to={`/produse/${promoGiftProduct.slug}`} className="text-green-600 hover:underline font-medium">{promoGiftProduct.name_en}</Link>!</>
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ro' 
                            ? <>✓ La {PROMO_CONFIG.minQuantityFreeShipping}+ paste cumpărate → transport gratuit (România)!</>
                            : <>✓ Buy {PROMO_CONFIG.minQuantityFreeShipping}+ toothpastes → free shipping (Romania)!</>
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promo Banner - Show on gift product (ID 2) */}
                {product.product_number === PROMO_CONFIG.giftProductNumber && promoTriggerProduct && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-green-700 dark:text-green-400">
                          {language === 'ro' ? '🎁 Poți primi acest produs cadou!' : '🎁 Get this product for free!'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ro' 
                            ? <>Cumpără {PROMO_CONFIG.minQuantityGift}+ <Link to={`/produse/${promoTriggerProduct.slug}`} className="text-green-600 hover:underline font-medium">{promoTriggerProduct.name_ro}</Link> și primești această periuță cadou!</>
                            : <>Buy {PROMO_CONFIG.minQuantityGift}+ <Link to={`/produse/${promoTriggerProduct.slug}`} className="text-green-600 hover:underline font-medium">{promoTriggerProduct.name_en}</Link> and get this toothbrush for free!</>
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                  {formatPrice(Number(product.price))}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-base sm:text-lg md:text-xl text-muted-foreground line-through">
                    {formatPrice(Number(product.compare_at_price))}
                  </span>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              {isInStock && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="inline-flex items-center gap-1 card-premium px-2 py-1 w-fit">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setQuantity(Math.max(1, Math.min(product.stock, val)));
                        }
                      }}
                      className="w-14 text-center font-semibold bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} 
                      className="w-10 h-10 rounded-lg hover:bg-muted hover:text-primary transition-all flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button variant="hero" size="lg" className="w-full sm:flex-1 py-3 sm:py-2" onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('common.addToCart')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Related Products Section - Carousel on mobile */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 opacity-0 animate-fade-up animation-delay-300">
              <h4 className="font-display text-sm md:text-base tracking-wide mb-4 text-muted-foreground text-center md:text-left">
                {language === 'ro' ? 'Clienții au cumpărat și' : 'Customers also bought'}
              </h4>
              {/* Mobile: Full-width card with navigation inside (matching testimonials layout) */}
              <div className="md:hidden">
                <div 
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20 shadow-lg"
                  onTouchStart={handleRelatedTouchStart}
                  onTouchMove={handleRelatedTouchMove}
                  onTouchEnd={handleRelatedTouchEnd}
                >
                  {relatedProducts[mobileRelatedIndex] && (() => {
                    const relProd = relatedProducts[mobileRelatedIndex];
                    return (
                      <div className="group">
                        {/* Image with Quick Add button */}
                        <div className="relative">
                          <a href={`/produse/${relProd.slug}`} className="block">
                            <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 p-6">
                              {relProd.images?.[0] ? (
                                <img
                                  src={relProd.images[0]}
                                  alt={language === 'ro' ? relProd.name_ro : relProd.name_en}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </a>
                          {/* Quick Add Button */}
                          <button
                            onClick={() => handleQuickAddRelated(relProd)}
                            className="absolute bottom-0 right-4 translate-y-1/2 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 hover:scale-110 transition-all duration-200 z-10"
                            title={language === 'ro' ? 'Adaugă în coș' : 'Add to cart'}
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-5 pt-7">
                          <a href={`/produse/${relProd.slug}`} className="block">
                            {/* Title */}
                            <h5 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {language === 'ro' ? relProd.name_ro : relProd.name_en}
                            </h5>
                            {/* Rating */}
                            <div className="mt-2">
                              {(() => {
                                const rating = relatedProductRatings.get(relProd.id);
                                if (!rating || rating.reviewCount === 0) {
                                  return (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Star className="w-4 h-4" />
                                      <span className="text-sm">{language === 'ro' ? 'Fără recenzii' : 'No reviews'}</span>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className={`w-4 h-4 ${star <= Math.round(rating.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                                      ))}
                                    </div>
                                    <span className="text-sm font-medium">{rating.averageRating.toFixed(1)}</span>
                                    <span className="text-sm text-muted-foreground">({rating.reviewCount})</span>
                                  </div>
                                );
                              })()}
                            </div>
                            {/* Price and CTA */}
                            <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-primary/20">
                              <p className="text-primary font-bold text-xl">
                                {formatPrice(relProd.price)}
                              </p>
                              <span className="text-primary font-medium text-base flex items-center gap-1">
                                {language === 'ro' ? 'Vezi detalii' : 'View details'}
                                <ArrowRight className="w-5 h-5" />
                              </span>
                            </div>
                          </a>
                        </div>

                        {/* Navigation inside card */}
                        {relatedProducts.length > 1 && (
                          <div className="flex items-center justify-between px-5 pb-5 pt-2 border-t border-primary/10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${mobileRelatedIndex <= 0 ? 'opacity-30' : ''}`}
                              onClick={() => setMobileRelatedIndex(prev => Math.max(0, prev - 1))}
                              disabled={mobileRelatedIndex <= 0}
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              {language === 'ro' ? 'Anterior' : 'Previous'}
                            </Button>
                            <div className="flex gap-1.5">
                              {relatedProducts.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setMobileRelatedIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    index === mobileRelatedIndex 
                                      ? 'bg-primary w-4' 
                                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                  }`}
                                />
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${mobileRelatedIndex >= relatedProducts.length - 1 ? 'opacity-30' : ''}`}
                              onClick={() => setMobileRelatedIndex(prev => Math.min(relatedProducts.length - 1, prev + 1))}
                              disabled={mobileRelatedIndex >= relatedProducts.length - 1}
                            >
                              {language === 'ro' ? 'Următor' : 'Next'}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Desktop: Grid layout */}
              <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 gap-4">
                {relatedProducts.map((relProd) => (
                  <div
                    key={relProd.id}
                    className="group card-premium overflow-hidden hover:shadow-sm transition-all duration-300"
                  >
                    {/* Image with Quick Add button */}
                    <div className="relative">
                      <a href={`/produse/${relProd.slug}`} className="block">
                        <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 p-3 rounded-t-2xl">
                          {relProd.images?.[0] ? (
                            <img
                              src={relProd.images[0]}
                              alt={language === 'ro' ? relProd.name_ro : relProd.name_en}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </a>
                      {/* Quick Add Button */}
                      <button
                        onClick={() => handleQuickAddRelated(relProd)}
                        className="absolute bottom-0 right-2 translate-y-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:bg-primary/90 hover:scale-110 transition-all duration-200 z-10"
                        title={language === 'ro' ? 'Adaugă în coș' : 'Add to cart'}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                    <a href={`/produse/${relProd.slug}`} className="block p-3 pt-5">
                      {/* Title - fixed height for 2 lines */}
                      <h5 className="font-medium text-sm leading-snug line-clamp-2 h-10 group-hover:text-primary transition-colors">
                        {language === 'ro' ? relProd.name_ro : relProd.name_en}
                      </h5>
                      {/* Rating - fixed height */}
                      <div className="h-6 mt-1.5">
                        {(() => {
                          const rating = relatedProductRatings.get(relProd.id);
                          if (!rating || rating.reviewCount === 0) {
                            return (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Star className="w-3 h-3" />
                                <span className="text-xs">{language === 'ro' ? 'Fără recenzii' : 'No reviews'}</span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-3 h-3 ${star <= Math.round(rating.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <span className="text-xs font-medium">{rating.averageRating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({rating.reviewCount})</span>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Price and CTA */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 pt-2 mt-2 border-t border-border/50">
                        <p className="text-primary font-semibold text-sm">
                          {formatPrice(relProd.price)}
                        </p>
                        <span className="text-primary font-medium text-xs flex items-center gap-1">
                          {language === 'ro' ? 'Vezi produsul' : 'View product'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professional Testimonials - Only for Product #1 (Dent-Tastic) */}
          {product.product_number === 1 && <ProfessionalTestimonials />}


          <div ref={mobileAccordionRef} className="mt-12 md:hidden opacity-0 animate-fade-up animation-delay-400">
            <Accordion type="single" collapsible value={mobileAccordionValue} onValueChange={(val) => setMobileAccordionValue(val || '')} className="w-full space-y-3">
              {/* Description Accordion */}
              <AccordionItem value="description" className="card-premium border-none">
                <AccordionTrigger className="px-4 py-3 font-display text-base hover:no-underline">
                  {language === 'ro' ? 'Descriere' : 'Description'}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {product.description_ro || product.description_en ? (
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line leading-relaxed">
                      {(language === 'ro' ? product.description_ro : product.description_en) || ''}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {language === 'ro' ? 'Nu există descriere disponibilă.' : 'No description available.'}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Specifications Accordion */}
              <AccordionItem value="specifications" className="card-premium border-none">
                <AccordionTrigger className="px-4 py-3 font-display text-base hover:no-underline">
                  {language === 'ro' ? 'Specificații' : 'Specifications'}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ProductSpecificationsDisplay specifications={product.specifications} />
                </AccordionContent>
              </AccordionItem>

              {/* Reviews Accordion */}
              <AccordionItem value="reviews" className="card-premium border-none">
                <AccordionTrigger className="px-4 py-3 font-display text-base hover:no-underline">
                  {language === 'ro' ? 'Recenzii' : 'Reviews'} ({reviewStats.reviewCount})
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* Reviews Overview */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display text-base">
                        {language === 'ro' ? 'Sumar Recenzii' : 'Reviews Summary'}
                      </h3>
                      {!reviewSubmitted && !showReviewForm && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowReviewForm(true)}
                        >
                          {language === 'ro' ? 'Scrie' : 'Write'}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {/* Average Rating */}
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-bold text-foreground">
                          {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                        </span>
                        <div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${
                                  star <= Math.floor(reviewStats.averageRating) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : star <= reviewStats.averageRating + 0.5
                                      ? 'fill-yellow-400/50 text-yellow-400' 
                                      : 'text-muted-foreground/40'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {reviewStats.reviewCount} {language === 'ro' ? 'recenzii' : 'reviews'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Submitted Message */}
                  {reviewSubmitted && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {language === 'ro' ? 'Recenzie publicată!' : 'Review published!'}
                      </p>
                    </div>
                  )}

                  {/* Review Form - Compact for mobile */}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                      <h3 className="font-display text-base mb-3">
                        {language === 'ro' ? 'Scrie o recenzie' : 'Write a review'}
                      </h3>
                      
                      {/* Rating */}
                      <div className="space-y-1">
                        <Label className="text-sm">{language === 'ro' ? 'Rating *' : 'Rating *'}</Label>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star 
                                className={`w-7 h-7 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="review_name_mobile" className="text-sm">{language === 'ro' ? 'Nume *' : 'Name *'}</Label>
                        <Input
                          id="review_name_mobile"
                          value={reviewForm.customer_name}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, customer_name: e.target.value }))}
                          placeholder={language === 'ro' ? 'Numele tău' : 'Your name'}
                          maxLength={100}
                          required
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="review_email_mobile" className="text-sm">{language === 'ro' ? 'Email *' : 'Email *'}</Label>
                        <Input
                          id="review_email_mobile"
                          type="email"
                          value={reviewForm.customer_email}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, customer_email: e.target.value }))}
                          placeholder={language === 'ro' ? 'email@exemplu.com' : 'email@example.com'}
                          maxLength={255}
                          required
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="review_content_mobile" className="text-sm">{language === 'ro' ? 'Recenzia ta *' : 'Your review *'}</Label>
                        <Textarea
                          id="review_content_mobile"
                          value={reviewForm.content}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                          placeholder={language === 'ro' ? 'Spune-ne părerea ta...' : 'Tell us what you think...'}
                          rows={3}
                          maxLength={2000}
                          required
                        />
                      </div>

                      {/* Image Upload for Mobile */}
                      <div className="space-y-2">
                        <Label className="text-sm">{language === 'ro' ? 'Imagini (opțional)' : 'Images (optional)'}</Label>
                        <div className="flex flex-wrap gap-2">
                          {reviewImagePreviews.map((preview, index) => (
                            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden">
                              <img src={preview} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewImages(prev => prev.filter((_, i) => i !== index));
                                  setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {reviewImages.length < 5 && (
                            <button
                              type="button"
                              onClick={() => reviewImageInputRef.current?.click()}
                              className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                            >
                              <ImagePlus className="w-5 h-5 text-muted-foreground" />
                            </button>
                          )}
                          <input
                            ref={reviewImageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const remainingSlots = 5 - reviewImages.length;
                              const newFiles = files.slice(0, remainingSlots);
                              
                              setReviewImages(prev => [...prev, ...newFiles]);
                              
                              newFiles.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setReviewImagePreviews(prev => [...prev, ev.target?.result as string]);
                                };
                                reader.readAsDataURL(file);
                              });
                              
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ro' ? `${reviewImages.length}/5 imagini` : `${reviewImages.length}/5 images`}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button type="submit" variant="hero" size="sm" disabled={reviewSubmitting || uploadingImages}>
                          {reviewSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            language === 'ro' ? 'Trimite' : 'Submit'
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowReviewForm(false)}
                          disabled={reviewSubmitting}
                        >
                          {language === 'ro' ? 'Anulează' : 'Cancel'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Reviews List */}
                  {reviewStats.reviewCount > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{review.customer_name}</span>
                                {review.is_verified_purchase && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {(() => {
                            const displayContent = language === 'ro' 
                              ? (review.content_ro || review.content) 
                              : (review.content_en || review.content_ro || review.content);
                            return displayContent && (
                              <p className="text-muted-foreground text-sm leading-relaxed">{displayContent}</p>
                            );
                          })()}
                          {/* Review Images - Mobile */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {review.images.map((img, index) => (
                                <button 
                                  key={index} 
                                  type="button"
                                  onClick={() => {
                                    setReviewLightboxImages(review.images as string[]);
                                    setReviewLightboxIndex(index);
                                    setReviewLightboxOpen(true);
                                  }}
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-zoom-in"
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : !showReviewForm && !reviewSubmitted && (
                    <p className="text-muted-foreground text-sm">
                      {language === 'ro' ? 'Nu există recenzii încă.' : 'No reviews yet.'}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Desktop: Tabs Section */}
          <div ref={tabsRef} className="hidden md:block mt-16 opacity-0 animate-fade-up animation-delay-400">
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

              <TabsContent value="reviews" className="mt-0 space-y-6">
                  {/* Reviews Overview - Separate Card */}
                  <div className="card-premium p-6 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg">
                        {language === 'ro' ? 'Sumar Recenzii' : 'Reviews Summary'}
                      </h3>
                      {!reviewSubmitted && !showReviewForm && (
                        <Button 
                          variant="outline" 
                          onClick={() => setShowReviewForm(true)}
                        >
                          {language === 'ro' ? 'Scrie o recenzie' : 'Write a review'}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Average Rating */}
                      <div className="flex flex-col items-center text-center min-w-[100px]">
                        <span className="text-5xl font-bold text-foreground">
                          {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                        </span>
                        <div className="flex items-center gap-0.5 mt-2">
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
                        <span className="text-sm text-muted-foreground mt-1">
                          {reviewStats.reviewCount} {language === 'ro' ? 'recenzii' : 'reviews'}
                        </span>
                      </div>
                      
                      {/* Rating Distribution */}
                      <div className="flex-1 space-y-2 w-full md:max-w-md">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = reviews.filter(r => r.rating === stars).length;
                          const percentage = reviewStats.reviewCount > 0 
                            ? (count / reviewStats.reviewCount) * 100 
                            : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-12 shrink-0">
                                {stars} {stars === 1 ? (language === 'ro' ? 'stea' : 'star') : (language === 'ro' ? 'stele' : 'stars')}
                              </span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-8 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Reviews Content Card */}
                  <div className="card-premium p-8">

                    {/* Review Submitted Message */}
                    {reviewSubmitted && (
                      <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                          <p className="text-green-700 dark:text-green-400 font-medium">
                            {language === 'ro' 
                              ? 'Mulțumim pentru recenzie! A fost publicată cu succes.' 
                              : 'Thank you for your review! It has been published successfully.'}
                          </p>
                        </div>
                        {couponSentWithReview && (
                          <p className="text-sm text-green-600/90 dark:text-green-400/90 ml-8 mt-2">
                            {language === 'ro'
                              ? '🎁 Ai primit un cupon de 15% reducere pe email! Verifică inbox-ul.'
                              : '🎁 You received a 15% discount coupon via email! Check your inbox.'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Discount Offer Banner */}
                    {!reviewSubmitted && !showReviewForm && (
                      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <div className="flex items-start gap-3">
                          <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">
                              {language === 'ro' 
                                ? '🎁 Primești 15% reducere la următoarea comandă!' 
                                : '🎁 Get 15% off your next order!'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {language === 'ro'
                                ? 'Lasă o recenzie pentru acest produs și primești un cupon de 15% reducere pe email. Folosește adresa de email de la comanda ta.'
                                : 'Leave a review for this product and receive a 15% discount coupon via email. Use the same email address from your order.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Review Form */}
                    {showReviewForm && (
                      <form onSubmit={handleSubmitReview} className="mb-8 p-6 rounded-xl bg-muted/30 border border-border space-y-4">
                        <h3 className="font-display text-lg mb-2">
                          {language === 'ro' ? 'Scrie o recenzie' : 'Write a review'}
                        </h3>
                        <p className="text-sm text-primary mb-4">
                          {language === 'ro' 
                            ? '🎁 După trimiterea recenziei, vei primi un cupon de 15% reducere pe email!' 
                            : '🎁 After submitting your review, you will receive a 15% discount coupon via email!'}
                        </p>
                        
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

                        {/* Image Upload */}
                        <div className="space-y-2">
                          <Label>{language === 'ro' ? 'Imagini (opțional)' : 'Images (optional)'}</Label>
                          <div className="flex flex-wrap gap-3">
                            {reviewImagePreviews.map((preview, index) => (
                              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewImages(prev => prev.filter((_, i) => i !== index));
                                    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {reviewImages.length < 5 && (
                              <button
                                type="button"
                                onClick={() => reviewImageInputRef.current?.click()}
                                className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                              >
                                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">
                                  {language === 'ro' ? 'Adaugă' : 'Add'}
                                </span>
                              </button>
                            )}
                            <input
                              ref={reviewImageInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const remainingSlots = 5 - reviewImages.length;
                                const newFiles = files.slice(0, remainingSlots);
                                
                                setReviewImages(prev => [...prev, ...newFiles]);
                                
                                newFiles.forEach(file => {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setReviewImagePreviews(prev => [...prev, e.target?.result as string]);
                                  };
                                  reader.readAsDataURL(file);
                                });
                                
                                e.target.value = '';
                              }}
                              className="hidden"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === 'ro' ? 'Poți adăuga până la 5 imagini.' : 'You can add up to 5 images.'}
                          </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button type="submit" variant="hero" disabled={reviewSubmitting || uploadingImages}>
                            {reviewSubmitting || uploadingImages ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {uploadingImages 
                                  ? (language === 'ro' ? 'Se încarcă imaginile...' : 'Uploading images...') 
                                  : (language === 'ro' ? 'Se trimite...' : 'Submitting...')}
                              </>
                            ) : (
                              language === 'ro' ? 'Trimite recenzia' : 'Submit review'
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewImages([]);
                              setReviewImagePreviews([]);
                            }}
                            disabled={reviewSubmitting}
                          >
                            {language === 'ro' ? 'Anulează' : 'Cancel'}
                          </Button>
                        </div>
                      </form>
                    )}

                    {reviewStats.reviewCount > 0 ? (
                      <div className="space-y-6">
                        {/* Reviews List */}
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
                            {(() => {
                              const displayTitle = language === 'ro' 
                                ? (review.title_ro || review.title) 
                                : (review.title_en || review.title_ro || review.title);
                              return displayTitle && (
                                <h4 className="font-medium mb-2">{displayTitle}</h4>
                              );
                            })()}
                            {(() => {
                              const displayContent = language === 'ro' 
                                ? (review.content_ro || review.content) 
                                : (review.content_en || review.content_ro || review.content);
                              return displayContent && (
                                <p className="text-muted-foreground leading-relaxed mb-3">{displayContent}</p>
                              );
                            })()}
                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {review.images.map((img, index) => (
                                  <button 
                                    key={index} 
                                    type="button"
                                    onClick={() => {
                                      setReviewLightboxImages(review.images as string[]);
                                      setReviewLightboxIndex(index);
                                      setReviewLightboxOpen(true);
                                    }}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-zoom-in"
                                  >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
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

      {/* Review Image Lightbox */}
      <Dialog open={reviewLightboxOpen} onOpenChange={setReviewLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/98 backdrop-blur-xl border border-border">
          <div className="relative w-full h-full min-h-[80vh] flex items-center justify-center p-8">
            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-background/90 hover:bg-muted shadow-lg"
              onClick={() => setReviewLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Navigation Arrows */}
            {reviewLightboxImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/90 hover:bg-muted shadow-lg h-12 w-12"
                  onClick={() => setReviewLightboxIndex(prev => prev === 0 ? reviewLightboxImages.length - 1 : prev - 1)}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-background/90 hover:bg-muted shadow-lg h-12 w-12"
                  onClick={() => setReviewLightboxIndex(prev => prev === reviewLightboxImages.length - 1 ? 0 : prev + 1)}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Zoomed Image */}
            <img 
              src={reviewLightboxImages[reviewLightboxIndex]} 
              alt="" 
              className="max-w-full max-h-[80vh] object-contain" 
            />

            {/* Image Counter */}
            {reviewLightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-border shadow-md">
                {reviewLightboxIndex + 1} / {reviewLightboxImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProductPage;
