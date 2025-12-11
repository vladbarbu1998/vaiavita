import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Truck, 
  MapPin, 
  Package, 
  CreditCard, 
  Banknote, 
  ArrowLeft,
  ShoppingBag,
  Loader2,
  Gift
} from 'lucide-react';

// Romanian counties
const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brăila',
  'Brașov', 'București', 'Buzău', 'Călărași', 'Caraș-Severin', 'Cluj', 'Constanța',
  'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
  'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt',
  'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea',
  'Vâlcea', 'Vaslui', 'Vrancea'
];

type DeliveryMethod = 'shipping' | 'pickup' | 'locker';
type PaymentMethod = 'stripe' | 'cash_on_delivery';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  country: string;
  address: string;
  addressLine2: string;
  city: string;
  county: string;
  postalCode: string;
  notes: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  scope: string;
  product_id: string | null;
  category_id: string | null;
  min_order_value: number | null;
  max_uses: number | null;
  uses_count: number | null;
  is_active: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
}

const Checkout = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items, totalPrice, clearCart, hasPromoFreeShipping } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    deliveryMethod: 'shipping',
    paymentMethod: 'cash_on_delivery',
    country: 'România',
    address: '',
    addressLine2: '',
    city: '',
    county: '',
    postalCode: '',
    notes: '',
  });

  // Calculate discount based on coupon
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return totalPrice * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, totalPrice);
  };

  const discount = calculateDiscount();
  // Free shipping if: promo applies (4+ trigger products) OR total >= 150
  const shippingCost = form.deliveryMethod === 'shipping' && !hasPromoFreeShipping && totalPrice < 150 ? 19.99 : 0;
  const finalTotal = totalPrice - discount + shippingCost;

  // Validate coupon against cart items
  const validateCouponScope = async (coupon: Coupon): Promise<{ valid: boolean; message: string }> => {
    if (coupon.scope === 'all') {
      return { valid: true, message: '' };
    }

    if (coupon.scope === 'product' && coupon.product_id) {
      const hasProduct = items.some(item => item.id === coupon.product_id);
      if (!hasProduct) {
        return { 
          valid: false, 
          message: language === 'ro' 
            ? 'Cuponul este valabil doar pentru un anumit produs care nu este în coș.' 
            : 'Coupon is only valid for a specific product not in your cart.' 
        };
      }
      return { valid: true, message: '' };
    }

    if (coupon.scope === 'category' && coupon.category_id) {
      // Fetch products with their categories
      const productIds = items.map(item => item.id);
      const { data: products } = await supabase
        .from('products')
        .select('id, category_id')
        .in('id', productIds);

      const hasMatchingCategory = products?.some(p => p.category_id === coupon.category_id);
      if (!hasMatchingCategory) {
        return { 
          valid: false, 
          message: language === 'ro' 
            ? 'Cuponul este valabil doar pentru o anumită categorie de produse care nu este în coș.' 
            : 'Coupon is only valid for a specific category not in your cart.' 
        };
      }
      return { valid: true, message: '' };
    }

    return { valid: true, message: '' };
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponError('');
    setIsApplyingCoupon(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        setCouponError(language === 'ro' ? 'Cupon invalid.' : 'Invalid coupon.');
        setIsApplyingCoupon(false);
        return;
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        setCouponError(language === 'ro' ? 'Cuponul nu este încă activ.' : 'Coupon is not yet active.');
        setIsApplyingCoupon(false);
        return;
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        setCouponError(language === 'ro' ? 'Cuponul a expirat.' : 'Coupon has expired.');
        setIsApplyingCoupon(false);
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.uses_count && coupon.uses_count >= coupon.max_uses) {
        setCouponError(language === 'ro' ? 'Cuponul a atins limita de utilizări.' : 'Coupon has reached its usage limit.');
        setIsApplyingCoupon(false);
        return;
      }

      // Check minimum order value
      if (coupon.min_order_value && totalPrice < coupon.min_order_value) {
        setCouponError(
          language === 'ro' 
            ? `Comanda minimă pentru acest cupon este ${coupon.min_order_value} lei.` 
            : `Minimum order for this coupon is ${coupon.min_order_value} lei.`
        );
        setIsApplyingCoupon(false);
        return;
      }

      // Validate scope
      const scopeValidation = await validateCouponScope(coupon);
      if (!scopeValidation.valid) {
        setCouponError(scopeValidation.message);
        setIsApplyingCoupon(false);
        return;
      }

      setAppliedCoupon(coupon);
      toast.success(language === 'ro' ? 'Cupon aplicat cu succes!' : 'Coupon applied successfully!');
    } catch (error) {
      console.error('Coupon error:', error);
      setCouponError(language === 'ro' ? 'Eroare la aplicarea cuponului.' : 'Error applying coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const updateForm = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error(language === 'ro' ? 'Coșul este gol' : 'Cart is empty');
      return;
    }

    // Validate required fields
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error(language === 'ro' ? 'Completează toate câmpurile obligatorii' : 'Fill in all required fields');
      return;
    }

    if (form.deliveryMethod === 'shipping' && (!form.address || !form.city || !form.county)) {
      toast.error(language === 'ro' ? 'Completează adresa de livrare' : 'Fill in shipping address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: `VV-${Date.now()}`, // Temporary, will be overwritten by trigger
          customer_email: form.email,
          customer_phone: form.phone,
          customer_first_name: form.firstName,
          customer_last_name: form.lastName,
          delivery_method: form.deliveryMethod as 'shipping' | 'pickup' | 'locker',
          payment_method: form.paymentMethod as 'stripe' | 'netopia' | 'cash_on_delivery',
          shipping_address: form.deliveryMethod === 'shipping' ? {
            country: form.country,
            address: form.address,
            addressLine2: form.addressLine2,
            city: form.city,
            county: form.county,
            postalCode: form.postalCode,
          } : null,
          pickup_location: form.deliveryMethod === 'pickup' ? 'Brașov, România' : null,
          subtotal: totalPrice,
          shipping_cost: shippingCost,
          discount: discount,
          coupon_code: appliedCoupon?.code || null,
          total: finalTotal,
          customer_notes: form.notes || null,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Update coupon uses_count if a coupon was applied
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ uses_count: (appliedCoupon.uses_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Create order items (including gifts)
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: language === 'ro' ? item.name : item.nameEn,
        quantity: item.quantity,
        unit_price: item.isGift ? 0 : item.price,
        total_price: item.isGift ? 0 : item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Handle payment based on method
      if (form.paymentMethod === 'cash_on_delivery') {
        clearCart();
        navigate(`/comanda-confirmata?order=${order.order_number}`);
      } else if (form.paymentMethod === 'stripe') {
        toast.info(language === 'ro' ? 'Plata cu card va fi disponibilă în curând' : 'Card payment coming soon');
        clearCart();
        navigate(`/comanda-confirmata?order=${order.order_number}`);
      }
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(language === 'ro' ? 'Eroare la plasarea comenzii' : 'Error placing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <MainLayout>
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center max-w-md mx-auto space-y-8 opacity-0 animate-fade-up">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-14 h-14 text-primary/60" />
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-3xl md:text-4xl tracking-wide">
                  {language === 'ro' ? 'Coșul tău este gol' : 'Your cart is empty'}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {language === 'ro' 
                    ? 'Adaugă produse în coș pentru a finaliza comanda.'
                    : 'Add products to your cart to complete checkout.'}
                </p>
              </div>
              <Button variant="hero" size="lg" asChild>
                <Link to="/produse">
                  {language === 'ro' ? 'Vezi produse' : 'View products'}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="section-padding">
        <div className="container-custom">
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/cos">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ro' ? 'Înapoi la coș' : 'Back to cart'}
              </Link>
            </Button>
            <h1 className="font-display text-3xl md:text-4xl tracking-wide opacity-0 animate-fade-up">
              {language === 'ro' ? 'Finalizare comandă' : 'Checkout'}
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-8 opacity-0 animate-fade-up animation-delay-100">
                
                {/* Billing / Shipping Info */}
                <div className="card-premium p-6 space-y-5">
                  <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    {language === 'ro' ? 'Date facturare și livrare' : 'Billing & shipping info'}
                  </h2>
                  
                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      {language === 'ro' ? 'Țară/regiune' : 'Country/Region'} *
                    </Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => updateForm('country', e.target.value)}
                      required
                    />
                  </div>

                  {/* Name row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {language === 'ro' ? 'Prenume' : 'First name'} *
                      </Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => updateForm('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {language === 'ro' ? 'Nume' : 'Last name'} *
                      </Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => updateForm('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {language === 'ro' ? 'Telefon' : 'Phone'} *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateForm('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* City & County */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        {language === 'ro' ? 'Localitate' : 'City'} *
                      </Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => updateForm('city', e.target.value)}
                        placeholder={language === 'ro' ? 'Localitate' : 'City'}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county">
                        {language === 'ro' ? 'Județ' : 'County'} *
                      </Label>
                      <Select
                        value={form.county}
                        onValueChange={(value) => updateForm('county', value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={language === 'ro' ? 'Selectează un județ' : 'Select county'} />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50 max-h-60">
                          {ROMANIAN_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {language === 'ro' ? 'Adresă' : 'Address'} *
                    </Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                      placeholder={language === 'ro' ? 'Strada, număr' : 'Street, number'}
                      required={form.deliveryMethod === 'shipping'}
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">
                      {language === 'ro' ? 'Apartament, complex etc.' : 'Apartment, suite, etc.'} ({language === 'ro' ? 'opțional' : 'optional'})
                    </Label>
                    <Input
                      id="addressLine2"
                      value={form.addressLine2}
                      onChange={(e) => updateForm('addressLine2', e.target.value)}
                      placeholder={language === 'ro' ? 'Apartament, bloc, scară' : 'Apartment, building, entrance'}
                    />
                  </div>

                  {/* Postal Code */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="postalCode">
                      {language === 'ro' ? 'Cod poștal' : 'Postal code'}
                    </Label>
                    <Input
                      id="postalCode"
                      value={form.postalCode}
                      onChange={(e) => updateForm('postalCode', e.target.value)}
                      placeholder={language === 'ro' ? 'Cod poștal' : 'Postal code'}
                    />
                  </div>

                  {/* Delivery Method Section */}
                  <div className="pt-4 border-t border-border space-y-4">
                    <h3 className="font-medium">
                      {language === 'ro' ? 'Metoda de livrare' : 'Delivery method'}
                    </h3>

                    <RadioGroup
                      value={form.deliveryMethod}
                      onValueChange={(value) => updateForm('deliveryMethod', value)}
                      className="space-y-3"
                    >
                      <label 
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          form.deliveryMethod === 'shipping' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="shipping" id="shipping" />
                        <Truck className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {language === 'ro' ? 'Livrare la adresă' : 'Home delivery'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ro' ? '1-3 zile lucrătoare' : '1-3 business days'}
                          </p>
                        </div>
                        <span className="font-medium">
                          {totalPrice >= 150 
                            ? (language === 'ro' ? 'Gratuit' : 'Free')
                            : '19.99 lei'}
                        </span>
                      </label>

                      <label 
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          form.deliveryMethod === 'pickup' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="pickup" id="pickup" />
                        <MapPin className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {language === 'ro' ? 'Ridicare personală - Brașov' : 'Pickup - Brașov'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ro' ? 'Disponibil în 24h' : 'Available in 24h'}
                          </p>
                        </div>
                        <span className="font-medium text-primary">
                          {language === 'ro' ? 'Gratuit' : 'Free'}
                        </span>
                      </label>

                      <label 
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all opacity-60 ${
                          form.deliveryMethod === 'locker' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value="locker" id="locker" disabled />
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {language === 'ro' ? 'Easybox / Locker' : 'Easybox / Locker'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ro' ? 'În curând - Ecolet' : 'Coming soon - Ecolet'}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {language === 'ro' ? 'În curând' : 'Soon'}
                        </span>
                      </label>
                    </RadioGroup>

                    {/* Pickup Info */}
                    {form.deliveryMethod === 'pickup' && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="font-medium mb-1">
                          {language === 'ro' ? 'Adresa de ridicare:' : 'Pickup address:'}
                        </p>
                        <p className="text-muted-foreground">
                          Brașov, România
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {language === 'ro' 
                            ? 'Vei primi un email cu detalii exacte după plasarea comenzii.'
                            : 'You will receive an email with exact details after placing the order.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="card-premium p-6 space-y-5">
                  <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {language === 'ro' ? 'Metoda de plată' : 'Payment method'}
                  </h2>

                  <RadioGroup
                    value={form.paymentMethod}
                    onValueChange={(value) => updateForm('paymentMethod', value)}
                    className="space-y-3"
                  >
                    <label 
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.paymentMethod === 'cash_on_delivery' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="cash_on_delivery" id="cod" />
                      <Banknote className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {language === 'ro' ? 'Ramburs' : 'Cash on delivery'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ro' ? 'Plătești la primirea coletului' : 'Pay when you receive the package'}
                        </p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.paymentMethod === 'stripe' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="stripe" id="stripe" />
                      <CreditCard className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {language === 'ro' ? 'Card bancar' : 'Credit/Debit card'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Visa, Mastercard, Apple Pay, Google Pay
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Notes */}
                <div className="card-premium p-6 space-y-4">
                  <h2 className="font-display text-xl tracking-wide">
                    {language === 'ro' ? 'Observații (opțional)' : 'Notes (optional)'}
                  </h2>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                    placeholder={language === 'ro' 
                      ? 'Instrucțiuni speciale pentru livrare...'
                      : 'Special delivery instructions...'}
                    rows={3}
                  />
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="opacity-0 animate-fade-up animation-delay-200">
                <div className="card-premium p-6 sticky top-24 space-y-6">
                  <h2 className="font-display text-xl tracking-wide">
                    {language === 'ro' ? 'Sumar comandă' : 'Order summary'}
                  </h2>

                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div 
                        key={`${item.id}-${item.isGift ? 'gift' : 'regular'}`} 
                        className={`flex gap-3 p-3 rounded-xl ${item.isGift ? 'bg-green-500/10 ring-1 ring-green-500/30' : 'bg-muted/30'}`}
                      >
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                          <img 
                            src={item.image} 
                            alt={language === 'ro' ? item.name : item.nameEn}
                            className="w-full h-full object-contain p-1"
                          />
                          {item.isGift && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Gift className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm truncate">
                              {language === 'ro' ? item.name : item.nameEn}
                            </p>
                            {item.isGift && (
                              <span className="shrink-0 px-1.5 py-0.5 bg-green-500/20 text-green-600 text-[10px] font-semibold rounded">
                                {language === 'ro' ? 'CADOU' : 'GIFT'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.isGift 
                              ? (language === 'ro' ? '1 x Gratuit' : '1 x Free')
                              : `${item.quantity} x ${formatPrice(item.price)}`
                            }
                          </p>
                        </div>
                        <p className={`font-medium text-sm shrink-0 ${item.isGift ? 'text-green-600' : ''}`}>
                          {item.isGift 
                            ? (language === 'ro' ? 'GRATUIT' : 'FREE')
                            : formatPrice(item.price * item.quantity)
                          }
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'ro' ? 'Cod cupon' : 'Coupon code'}
                    </Label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div>
                          <p className="font-medium text-green-600">{appliedCoupon.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {appliedCoupon.discount_type === 'percentage' 
                              ? `-${appliedCoupon.discount_value}%` 
                              : `-${formatPrice(appliedCoupon.discount_value)}`}
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={removeCoupon}
                          className="text-destructive hover:text-destructive"
                        >
                          {language === 'ro' ? 'Elimină' : 'Remove'}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder={language === 'ro' ? 'Introdu codul' : 'Enter code'}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={applyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            language === 'ro' ? 'Aplică' : 'Apply'
                          )}
                        </Button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-xs text-destructive">{couponError}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {language === 'ro' ? 'Reducere' : 'Discount'}
                        </span>
                        <span className="text-green-600">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'ro' ? 'Livrare' : 'Shipping'}
                      </span>
                      <span className={shippingCost === 0 ? 'text-primary' : ''}>
                        {shippingCost === 0 
                          ? (language === 'ro' ? 'Gratuit' : 'Free')
                          : formatPrice(shippingCost)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between text-lg">
                      <span className="font-display">Total</span>
                      <span className="font-bold text-primary text-xl">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {language === 'ro' ? 'Se procesează...' : 'Processing...'}
                      </>
                    ) : (
                      language === 'ro' ? 'Plasează comanda' : 'Place order'
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    {language === 'ro' 
                      ? 'Prin plasarea comenzii, ești de acord cu Termenii și Condițiile noastre.'
                      : 'By placing your order, you agree to our Terms and Conditions.'}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </MainLayout>
  );
};

export default Checkout;
