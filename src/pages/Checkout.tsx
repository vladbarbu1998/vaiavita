import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Truck, 
  MapPin, 
  Package, 
  CreditCard, 
  Banknote, 
  Building2,
  ArrowLeft,
  ShoppingBag,
  Loader2,
  CheckCircle2
} from 'lucide-react';

type DeliveryMethod = 'shipping' | 'pickup' | 'locker';
type PaymentMethod = 'stripe' | 'netopia' | 'cash_on_delivery';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  notes: string;
}

const Checkout = () => {
  const { language } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    deliveryMethod: 'shipping',
    paymentMethod: 'cash_on_delivery',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    notes: '',
  });

  const shippingCost = form.deliveryMethod === 'shipping' && totalPrice < 150 ? 19.99 : 0;
  const finalTotal = totalPrice + shippingCost;

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
            address: form.address,
            city: form.city,
            county: form.county,
            postalCode: form.postalCode,
          } : null,
          pickup_location: form.deliveryMethod === 'pickup' ? 'Brașov, România' : null,
          subtotal: totalPrice,
          shipping_cost: shippingCost,
          total: finalTotal,
          customer_notes: form.notes || null,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: null, // Will link to actual products later
        product_name: language === 'ro' ? item.name : item.nameEn,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Handle payment based on method
      if (form.paymentMethod === 'cash_on_delivery') {
        // Order is complete for COD
        clearCart();
        navigate(`/comanda-confirmata?order=${order.order_number}`);
      } else if (form.paymentMethod === 'stripe') {
        // TODO: Integrate Stripe
        toast.info(language === 'ro' ? 'Plata cu card va fi disponibilă în curând' : 'Card payment coming soon');
        clearCart();
        navigate(`/comanda-confirmata?order=${order.order_number}`);
      } else if (form.paymentMethod === 'netopia') {
        // TODO: Integrate Netopia
        toast.info(language === 'ro' ? 'Netopia va fi disponibil în curând' : 'Netopia coming soon');
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
                {/* Contact Info */}
                <div className="card-premium p-6 space-y-5">
                  <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {language === 'ro' ? 'Date contact' : 'Contact info'}
                  </h2>
                  
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
                </div>

                {/* Delivery Method */}
                <div className="card-premium p-6 space-y-5">
                  <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    {language === 'ro' ? 'Metoda de livrare' : 'Delivery method'}
                  </h2>

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

                  {/* Shipping Address */}
                  {form.deliveryMethod === 'shipping' && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="space-y-2">
                        <Label htmlFor="address">
                          {language === 'ro' ? 'Adresă' : 'Address'} *
                        </Label>
                        <Input
                          id="address"
                          value={form.address}
                          onChange={(e) => updateForm('address', e.target.value)}
                          placeholder={language === 'ro' ? 'Strada, număr, bloc, scară, apartament' : 'Street, number, building, apartment'}
                          required
                        />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">
                            {language === 'ro' ? 'Oraș' : 'City'} *
                          </Label>
                          <Input
                            id="city"
                            value={form.city}
                            onChange={(e) => updateForm('city', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="county">
                            {language === 'ro' ? 'Județ' : 'County'} *
                          </Label>
                          <Input
                            id="county"
                            value={form.county}
                            onChange={(e) => updateForm('county', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">
                            {language === 'ro' ? 'Cod poștal' : 'Postal code'}
                          </Label>
                          <Input
                            id="postalCode"
                            value={form.postalCode}
                            onChange={(e) => updateForm('postalCode', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

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

                    <label 
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.paymentMethod === 'netopia' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="netopia" id="netopia" />
                      <Building2 className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Netopia</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ro' ? 'Plată online securizată' : 'Secure online payment'}
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
                      <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                          <img 
                            src={item.image} 
                            alt={language === 'ro' ? item.name : item.nameEn}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {language === 'ro' ? item.name : item.nameEn}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x {item.price.toFixed(2)} lei
                          </p>
                        </div>
                        <p className="font-medium text-sm shrink-0">
                          {(item.price * item.quantity).toFixed(2)} lei
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{totalPrice.toFixed(2)} lei</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'ro' ? 'Livrare' : 'Shipping'}
                      </span>
                      <span className={shippingCost === 0 ? 'text-primary' : ''}>
                        {shippingCost === 0 
                          ? (language === 'ro' ? 'Gratuit' : 'Free')
                          : `${shippingCost.toFixed(2)} lei`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between text-lg">
                      <span className="font-display">Total</span>
                      <span className="font-bold text-primary text-xl">
                        {finalTotal.toFixed(2)} lei
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
