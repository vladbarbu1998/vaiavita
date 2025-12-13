import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Gift,
  Search,
  Check,
  ChevronsUpDown,
  Edit
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { LockerSelector, preloadLockers } from '@/components/checkout/LockerSelector';

// Romanian counties
const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brăila',
  'Brașov', 'București', 'Buzău', 'Călărași', 'Caraș-Severin', 'Cluj', 'Constanța',
  'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
  'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt',
  'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea',
  'Vâlcea', 'Vaslui', 'Vrancea'
];

// EU countries + UK with postal code formats
const COUNTRIES = [
  { code: 'RO', name: 'România', nameEn: 'Romania', postalFormat: /^\d{6}$/, postalExample: '500001' },
  { code: 'AT', name: 'Austria', nameEn: 'Austria', postalFormat: /^\d{4}$/, postalExample: '1010' },
  { code: 'BE', name: 'Belgia', nameEn: 'Belgium', postalFormat: /^\d{4}$/, postalExample: '1000' },
  { code: 'BG', name: 'Bulgaria', nameEn: 'Bulgaria', postalFormat: /^\d{4}$/, postalExample: '1000' },
  { code: 'HR', name: 'Croația', nameEn: 'Croatia', postalFormat: /^\d{5}$/, postalExample: '10000' },
  { code: 'CY', name: 'Cipru', nameEn: 'Cyprus', postalFormat: /^\d{4}$/, postalExample: '1010' },
  { code: 'CZ', name: 'Cehia', nameEn: 'Czech Republic', postalFormat: /^\d{3}\s?\d{2}$/, postalExample: '110 00' },
  { code: 'DK', name: 'Danemarca', nameEn: 'Denmark', postalFormat: /^\d{4}$/, postalExample: '1000' },
  { code: 'EE', name: 'Estonia', nameEn: 'Estonia', postalFormat: /^\d{5}$/, postalExample: '10001' },
  { code: 'FI', name: 'Finlanda', nameEn: 'Finland', postalFormat: /^\d{5}$/, postalExample: '00100' },
  { code: 'FR', name: 'Franța', nameEn: 'France', postalFormat: /^\d{5}$/, postalExample: '75001' },
  { code: 'DE', name: 'Germania', nameEn: 'Germany', postalFormat: /^\d{5}$/, postalExample: '10115' },
  { code: 'GR', name: 'Grecia', nameEn: 'Greece', postalFormat: /^\d{3}\s?\d{2}$/, postalExample: '104 31' },
  { code: 'HU', name: 'Ungaria', nameEn: 'Hungary', postalFormat: /^\d{4}$/, postalExample: '1011' },
  { code: 'IE', name: 'Irlanda', nameEn: 'Ireland', postalFormat: /^[A-Za-z0-9]{3}\s?[A-Za-z0-9]{4}$/, postalExample: 'D01 F5P2' },
  { code: 'IT', name: 'Italia', nameEn: 'Italy', postalFormat: /^\d{5}$/, postalExample: '00100' },
  { code: 'LV', name: 'Letonia', nameEn: 'Latvia', postalFormat: /^LV-\d{4}$/i, postalExample: 'LV-1001' },
  { code: 'LT', name: 'Lituania', nameEn: 'Lithuania', postalFormat: /^LT-\d{5}$/i, postalExample: 'LT-01001' },
  { code: 'LU', name: 'Luxemburg', nameEn: 'Luxembourg', postalFormat: /^\d{4}$/, postalExample: '1111' },
  { code: 'MT', name: 'Malta', nameEn: 'Malta', postalFormat: /^[A-Za-z]{3}\s?\d{4}$/, postalExample: 'VLT 1000' },
  { code: 'NL', name: 'Țările de Jos', nameEn: 'Netherlands', postalFormat: /^\d{4}\s?[A-Za-z]{2}$/, postalExample: '1011 AB' },
  { code: 'PL', name: 'Polonia', nameEn: 'Poland', postalFormat: /^\d{2}-\d{3}$/, postalExample: '00-001' },
  { code: 'PT', name: 'Portugalia', nameEn: 'Portugal', postalFormat: /^\d{4}-\d{3}$/, postalExample: '1000-001' },
  { code: 'SK', name: 'Slovacia', nameEn: 'Slovakia', postalFormat: /^\d{3}\s?\d{2}$/, postalExample: '811 01' },
  { code: 'SI', name: 'Slovenia', nameEn: 'Slovenia', postalFormat: /^\d{4}$/, postalExample: '1000' },
  { code: 'ES', name: 'Spania', nameEn: 'Spain', postalFormat: /^\d{5}$/, postalExample: '28001' },
  { code: 'SE', name: 'Suedia', nameEn: 'Sweden', postalFormat: /^\d{3}\s?\d{2}$/, postalExample: '111 22' },
  { code: 'GB', name: 'Regatul Unit', nameEn: 'United Kingdom', postalFormat: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, postalExample: 'SW1A 1AA' },
];

type DeliveryMethod = 'shipping' | 'pickup' | 'locker' | 'postal';
type PaymentMethod = 'stripe' | 'cash_on_delivery' | 'card_at_locker';

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
  product_ids: string[] | null;
  category_id: string | null;
  min_order_value: number | null;
  max_uses: number | null;
  uses_count: number | null;
  is_active: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
  allowed_email: string | null;
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
  const [countryOpen, setCountryOpen] = useState(false);
  const [countyOpen, setCountyOpen] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState('');
  const [lockerSelectorOpen, setLockerSelectorOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<{ 
    id: string; 
    name: string; 
    address: string; 
    city: string; 
    postal_code: string; 
    lat: number; 
    lng: number;
    locality_id?: number | null;
  } | null>(null);
  
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    deliveryMethod: 'shipping',
    paymentMethod: 'cash_on_delivery',
    country: 'RO',
    address: '',
    addressLine2: '',
    city: '',
    county: '',
    postalCode: '',
    notes: '',
  });

  // Determine available delivery methods based on country and county
  const isRomania = form.country === 'RO';
  const isBrasov = isRomania && form.county === 'Brașov';
  
  const availableDeliveryMethods = useMemo(() => {
    if (!isRomania) {
      // International: only shipping
      return ['shipping'] as DeliveryMethod[];
    }
    if (isBrasov) {
      // Brașov: shipping, postal, pickup, locker
      return ['shipping', 'postal', 'pickup', 'locker'] as DeliveryMethod[];
    }
    // Rest of Romania: shipping, postal, locker
    return ['shipping', 'postal', 'locker'] as DeliveryMethod[];
  }, [isRomania, isBrasov]);

  // Reset delivery method and payment method when it becomes unavailable
  const handleCountryChange = (countryCode: string) => {
    setForm(prev => {
      const newIsRomania = countryCode === 'RO';
      let newDeliveryMethod = prev.deliveryMethod;
      let newPaymentMethod = prev.paymentMethod;
      
      // If switching away from Romania and method is not shipping, reset to shipping
      if (!newIsRomania && (prev.deliveryMethod === 'pickup' || prev.deliveryMethod === 'locker')) {
        newDeliveryMethod = 'shipping';
      }
      
      // If switching away from Romania and payment is cash_on_delivery, reset to stripe
      if (!newIsRomania && prev.paymentMethod === 'cash_on_delivery') {
        newPaymentMethod = 'stripe';
      }
      
      return { 
        ...prev, 
        country: countryCode,
        county: newIsRomania ? prev.county : '',
        postalCode: '', // Reset postal code when country changes
        deliveryMethod: newDeliveryMethod,
        paymentMethod: newPaymentMethod
      };
    });
    setPostalCodeError(''); // Clear postal code error
    setCountryOpen(false);
  };

  const handleCountyChange = (county: string) => {
    setForm(prev => {
      const newIsBrasov = county === 'Brașov';
      let newDeliveryMethod = prev.deliveryMethod;
      
      // If switching away from Brașov and method is pickup, reset to shipping
      if (!newIsBrasov && prev.deliveryMethod === 'pickup') {
        newDeliveryMethod = 'shipping';
      }
      
      return { 
        ...prev, 
        county,
        deliveryMethod: newDeliveryMethod
      };
    });
    setCountyOpen(false);
  };

  // Get selected country name and postal format
  const selectedCountry = COUNTRIES.find(c => c.code === form.country);
  const countryDisplayName = selectedCountry 
    ? (language === 'ro' ? selectedCountry.name : selectedCountry.nameEn)
    : '';

  // Validate postal code format
  const validatePostalCode = (postalCode: string, countryCode: string): boolean => {
    if (!postalCode.trim()) return true; // Empty is valid (optional field)
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (!country) return true;
    return country.postalFormat.test(postalCode.trim());
  };

  const handlePostalCodeChange = (value: string) => {
    updateForm('postalCode', value);
    if (value.trim() && !validatePostalCode(value, form.country)) {
      const country = COUNTRIES.find(c => c.code === form.country);
      setPostalCodeError(
        language === 'ro' 
          ? `Format invalid. Exemplu: ${country?.postalExample || ''}`
          : `Invalid format. Example: ${country?.postalExample || ''}`
      );
    } else {
      setPostalCodeError('');
    }
  };

  // Calculate discount based on coupon
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return totalPrice * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, totalPrice);
  };

  const discount = calculateDiscount();
  
  // Shipping cost calculation based on delivery method
  const getDeliveryCost = (method: DeliveryMethod): number => {
    // Free shipping promo only applies to courier shipping
    if (method === 'shipping' && hasPromoFreeShipping && isRomania) return 0;
    
    switch (method) {
      case 'shipping':
        return isRomania ? 19 : 25; // Curier la adresă
      case 'postal':
        return 15; // Poșta Română
      case 'locker':
        return 15; // Easybox / Locker
      case 'pickup':
        return 0; // Ridicare personală
      default:
        return 0;
    }
  };
  
  // Shipping cost calculation for display purposes (always calculates as if shipping is selected)
  const getShippingDisplayCost = () => {
    return getDeliveryCost('shipping');
  };
  
  // Actual shipping cost for the order (depends on selected delivery method)
  const getShippingCost = () => {
    return getDeliveryCost(form.deliveryMethod);
  };
  
  const shippingDisplayCost = getShippingDisplayCost();
  const shippingCost = getShippingCost();
  const finalTotal = totalPrice - discount + shippingCost;

  // Validate coupon against cart items and customer email
  const validateCouponScope = async (coupon: Coupon, customerEmail: string): Promise<{ valid: boolean; message: string }> => {
    // Check allowed_email restriction
    if (coupon.allowed_email) {
      const couponEmail = coupon.allowed_email.trim().toLowerCase();
      const checkEmail = customerEmail.trim().toLowerCase();
      if (couponEmail !== checkEmail) {
        return { 
          valid: false, 
          message: language === 'ro' 
            ? 'Acest cupon este personal și poate fi folosit doar cu adresa de email pentru care a fost generat.' 
            : 'This coupon is personal and can only be used with the email address it was generated for.' 
        };
      }
    }

    if (coupon.scope === 'all') {
      return { valid: true, message: '' };
    }

    // Handle both 'product' (single) and 'products' (multiple) scopes
    if ((coupon.scope === 'product' || coupon.scope === 'products')) {
      // Check product_ids array first
      if (coupon.product_ids && coupon.product_ids.length > 0) {
        const hasProduct = items.some(item => coupon.product_ids!.includes(item.id));
        if (!hasProduct) {
          return { 
            valid: false, 
            message: language === 'ro' 
              ? 'Cuponul este valabil doar pentru anumite produse care nu sunt în coș.' 
              : 'Coupon is only valid for specific products not in your cart.' 
          };
        }
        return { valid: true, message: '' };
      }
      // Fallback to single product_id
      if (coupon.product_id) {
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
    }

    if (coupon.scope === 'category' && coupon.category_id) {
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

      if (coupon.max_uses && coupon.uses_count && coupon.uses_count >= coupon.max_uses) {
        setCouponError(language === 'ro' ? 'Cuponul a atins limita de utilizări.' : 'Coupon has reached its usage limit.');
        setIsApplyingCoupon(false);
        return;
      }

      if (coupon.min_order_value && totalPrice < coupon.min_order_value) {
        setCouponError(
          language === 'ro' 
            ? `Comanda minimă pentru acest cupon este ${coupon.min_order_value} lei.` 
            : `Minimum order for this coupon is ${coupon.min_order_value} lei.`
        );
        setIsApplyingCoupon(false);
        return;
      }

      const scopeValidation = await validateCouponScope(coupon, form.email);
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
    setForm(prev => {
      // If changing delivery method, reset payment method if needed
      if (field === 'deliveryMethod') {
        let newPaymentMethod = prev.paymentMethod;
        
        // Preload lockers when switching to locker delivery
        if (value === 'locker') {
          preloadLockers();
        }
        
        // If switching to locker or pickup and payment is cash_on_delivery, reset to stripe
        if ((value === 'locker' || value === 'pickup') && prev.paymentMethod === 'cash_on_delivery') {
          newPaymentMethod = 'stripe';
        }
        
        // If switching away from locker and payment is card_at_locker, reset to stripe
        if (value !== 'locker' && prev.paymentMethod === 'card_at_locker') {
          newPaymentMethod = 'stripe';
        }
        
        return { ...prev, deliveryMethod: value as DeliveryMethod, paymentMethod: newPaymentMethod };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error(language === 'ro' ? 'Coșul este gol' : 'Cart is empty');
      return;
    }

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error(language === 'ro' ? 'Completează toate câmpurile obligatorii' : 'Fill in all required fields');
      return;
    }

    // Validate address fields for shipping and postal delivery
    if ((form.deliveryMethod === 'shipping' || form.deliveryMethod === 'postal') && (!form.address || !form.city)) {
      toast.error(language === 'ro' ? 'Completează adresa de livrare' : 'Fill in shipping address');
      return;
    }

    if (isRomania && (form.deliveryMethod === 'shipping' || form.deliveryMethod === 'postal') && !form.county) {
      toast.error(language === 'ro' ? 'Selectează județul' : 'Select county');
      return;
    }

    // Validate locker selection
    if (form.deliveryMethod === 'locker' && !selectedLocker) {
      toast.error(language === 'ro' ? 'Selectează un punct de livrare' : 'Select a delivery point');
      return;
    }

    // Validate postal code format
    if (form.postalCode.trim() && !validatePostalCode(form.postalCode, form.country)) {
      const country = COUNTRIES.find(c => c.code === form.country);
      toast.error(
        language === 'ro' 
          ? `Cod poștal invalid. Exemplu: ${country?.postalExample || ''}`
          : `Invalid postal code. Example: ${country?.postalExample || ''}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: `VV-${Date.now()}`,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_first_name: form.firstName,
          customer_last_name: form.lastName,
          delivery_method: form.deliveryMethod as 'shipping' | 'pickup' | 'locker',
          payment_method: (form.paymentMethod === 'card_at_locker' ? 'stripe' : form.paymentMethod) as 'stripe' | 'netopia' | 'cash_on_delivery',
          shipping_address: form.deliveryMethod === 'shipping' || form.deliveryMethod === 'postal' ? {
            country: countryDisplayName,
            countryCode: form.country,
            address: form.address,
            addressLine2: form.addressLine2,
            city: form.city,
            county: form.county,
            postalCode: form.postalCode,
          } : null,
          pickup_location: form.deliveryMethod === 'pickup' ? 'Brașov, România' : null,
          locker_id: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.id : null,
          locker_name: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.name : null,
          locker_address: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.address : null,
          locker_city: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.city : null,
          locker_postal_code: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.postal_code : null,
          locker_lat: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.lat : null,
          locker_lng: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.lng : null,
          locker_locality_id: form.deliveryMethod === 'locker' && selectedLocker ? selectedLocker.locality_id : null,
          subtotal: totalPrice,
          shipping_cost: shippingCost,
          discount: discount,
          coupon_code: appliedCoupon?.code || null,
          total: finalTotal,
          customer_notes: form.paymentMethod === 'card_at_locker' 
            ? `${form.notes ? form.notes + '\n' : ''}[Plată cu cardul la locker]`
            : (form.notes || null),
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ uses_count: (appliedCoupon.uses_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }

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

      // Send order to Ecolet for shipping/postal/locker deliveries (background task)
      // ONLY for cash on delivery - for Stripe payments, webhook will handle this after successful payment
      const shouldSyncToEcolet = 
        (form.deliveryMethod === 'shipping' || form.deliveryMethod === 'postal' || form.deliveryMethod === 'locker') &&
        form.paymentMethod === 'cash_on_delivery';
      
      if (shouldSyncToEcolet) {
        try {
          const ecoletPayload = {
            orderId: order.id,
            orderNumber: order.order_number,
            customerFirstName: form.firstName,
            customerLastName: form.lastName,
            customerEmail: form.email,
            customerPhone: form.phone,
            deliveryMethod: form.deliveryMethod,
            shippingAddress: form.deliveryMethod !== 'locker' ? {
              country: countryDisplayName,
              countryCode: form.country,
              address: form.address,
              addressLine2: form.addressLine2,
              city: form.city,
              county: form.county,
              postalCode: form.postalCode,
            } : null,
            lockerId: selectedLocker?.id || null,
            lockerName: selectedLocker?.name || null,
            lockerAddress: selectedLocker?.address || null,
            lockerLocalityId: selectedLocker?.locality_id || null,
            total: finalTotal,
            paymentMethod: form.paymentMethod,
            items: items.map(item => ({
              productName: language === 'ro' ? item.name : item.nameEn,
              quantity: item.quantity,
            })),
          };
          
          // Fire and forget - don't block checkout
          supabase.functions.invoke('create-ecolet-parcel', { body: ecoletPayload })
            .then(result => {
              if (result.error) {
                console.error('Ecolet sync error:', result.error);
              } else {
                console.log('Ecolet sync result:', result.data);
              }
            })
            .catch(err => console.error('Ecolet sync failed:', err));
        } catch (ecoletError) {
          console.error('Ecolet integration error:', ecoletError);
          // Don't block checkout if Ecolet fails
        }
      }

      if (form.paymentMethod === 'cash_on_delivery' || form.paymentMethod === 'card_at_locker') {
        clearCart();
        navigate(`/comanda-confirmata?order=${order.order_number}`);
      } else if (form.paymentMethod === 'stripe') {
        // Create Stripe checkout session
        const stripeItems = items
          .filter(item => !item.isGift) // Exclude gift items from payment
          .map(item => ({
            name: language === 'ro' ? item.name : (item.nameEn || item.name),
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          }));

        // Add shipping as a line item if there's a cost
        if (shippingCost > 0) {
          stripeItems.push({
            name: language === 'ro' ? 'Transport' : 'Shipping',
            price: shippingCost,
            quantity: 1,
            image: undefined,
          });
        }

        // Apply discount as negative line item or adjust prices
        // For simplicity, we'll include discount info in metadata and adjust total via Stripe
        
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-stripe-checkout', {
          body: {
            items: stripeItems,
            customerEmail: form.email,
            customerName: `${form.firstName} ${form.lastName}`,
            orderId: order.id,
            orderNumber: order.order_number,
            successUrl: `${window.location.origin}/comanda-confirmata?order=${order.order_number}&payment=success`,
            cancelUrl: `${window.location.origin}/checkout?payment=cancelled`,
          },
        });

        if (stripeError || !stripeData?.url) {
          console.error('Stripe checkout error:', stripeError);
          toast.error(language === 'ro' ? 'Eroare la inițializarea plății' : 'Error initializing payment');
          // Don't clear cart on error so user can retry
          setIsSubmitting(false);
          return;
        }

        // Clear cart before redirecting to Stripe
        clearCart();
        
        // Redirect to Stripe Checkout
        window.location.href = stripeData.url;
        return; // Stop execution here
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
      <section className="section-padding overflow-hidden">
        <div className="container-custom">
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/cos">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ro' ? 'Înapoi la coș' : 'Back to cart'}
              </Link>
            </Button>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide opacity-0 animate-fade-up">
              {language === 'ro' ? 'Finalizare comandă' : 'Checkout'}
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6 opacity-0 animate-fade-up animation-delay-100">
                
                {/* Billing / Shipping Info */}
                <div className="card-premium p-4 sm:p-6 space-y-5">
                  <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    {language === 'ro' ? 'Date facturare și livrare' : 'Billing & shipping info'}
                  </h2>
                  
                  {/* Country with search */}
                  <div className="space-y-2">
                    <Label>
                      {language === 'ro' ? 'Țară/regiune' : 'Country/Region'} *
                    </Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className="w-full justify-between bg-background"
                        >
                          {countryDisplayName || (language === 'ro' ? 'Selectează țara' : 'Select country')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                        <Command>
                          <CommandInput placeholder={language === 'ro' ? 'Caută țara...' : 'Search country...'} />
                          <CommandList>
                            <CommandEmpty>{language === 'ro' ? 'Nu s-a găsit.' : 'Not found.'}</CommandEmpty>
                            <CommandGroup>
                              {COUNTRIES.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={`${country.name} ${country.nameEn}`}
                                  onSelect={() => handleCountryChange(country.code)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.country === country.code ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {language === 'ro' ? country.name : country.nameEn}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                        autoComplete="given-name"
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
                        autoComplete="family-name"
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
                        autoComplete="email"
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
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>

                  {/* City & County/Region */}
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
                        autoComplete="address-level2"
                        required
                      />
                    </div>
                    
                    {isRomania ? (
                      <div className="space-y-2">
                        <Label>
                          {language === 'ro' ? 'Județ' : 'County'} *
                        </Label>
                        <Popover open={countyOpen} onOpenChange={setCountyOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={countyOpen}
                              className="w-full justify-between bg-background"
                            >
                              {form.county || (language === 'ro' ? 'Selectează județul' : 'Select county')}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                            <Command>
                              <CommandInput placeholder={language === 'ro' ? 'Caută județul...' : 'Search county...'} />
                              <CommandList>
                                <CommandEmpty>{language === 'ro' ? 'Nu s-a găsit.' : 'Not found.'}</CommandEmpty>
                                <CommandGroup>
                                  {ROMANIAN_COUNTIES.map((county) => (
                                    <CommandItem
                                      key={county}
                                      value={county}
                                      onSelect={() => handleCountyChange(county)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          form.county === county ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {county}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="county">
                          {language === 'ro' ? 'Regiune/Stat' : 'Region/State'}
                        </Label>
                        <Input
                          id="county"
                          value={form.county}
                          onChange={(e) => updateForm('county', e.target.value)}
                          placeholder={language === 'ro' ? 'Regiune/Stat' : 'Region/State'}
                          autoComplete="address-level1"
                        />
                      </div>
                    )}
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
                      autoComplete="street-address"
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
                      autoComplete="address-line2"
                    />
                  </div>

                  {/* Postal Code */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="postalCode">
                      {language === 'ro' ? 'Cod poștal' : 'Postal code'}
                      {selectedCountry && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({language === 'ro' ? 'ex:' : 'e.g.'} {selectedCountry.postalExample})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="postalCode"
                      value={form.postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                      placeholder={selectedCountry?.postalExample || (language === 'ro' ? 'Cod poștal' : 'Postal code')}
                      autoComplete="postal-code"
                      className={postalCodeError ? 'border-destructive' : ''}
                    />
                    {postalCodeError && (
                      <p className="text-xs text-destructive">{postalCodeError}</p>
                    )}
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
                      {/* Shipping - always available */}
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
                        </div>
                        <span className="font-medium">
                          {shippingDisplayCost === 0 
                            ? (language === 'ro' ? 'Gratuit' : 'Free')
                            : `${shippingDisplayCost} lei`}
                        </span>
                      </label>

                      {/* Pickup - only for Brașov */}
                      {availableDeliveryMethods.includes('pickup') && (
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
                          </div>
                          <span className="font-medium text-primary">
                            {language === 'ro' ? 'Gratuit' : 'Free'}
                          </span>
                        </label>
                      )}

                      {/* Postal - Poșta Română - only for Romania */}
                      {availableDeliveryMethods.includes('postal') && (
                        <label 
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            form.deliveryMethod === 'postal' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value="postal" id="postal" />
                          <Package className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">
                              {language === 'ro' ? 'Poșta Română' : 'Romanian Post'}
                            </p>
                          </div>
                          <span className="font-medium">
                            15 lei
                          </span>
                        </label>
                      )}

                      {/* Locker - only for Romania */}
                      {availableDeliveryMethods.includes('locker') && (
                        <div className="space-y-3">
                          <label 
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                              form.deliveryMethod === 'locker' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="locker" id="locker" />
                            <Package className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="font-medium">
                                {language === 'ro' ? 'Easybox / Locker' : 'Easybox / Locker'}
                              </p>
                            </div>
                            <span className="font-medium">
                              15 lei
                            </span>
                          </label>

                          {/* Locker selection UI - appears below when locker is selected */}
                          {form.deliveryMethod === 'locker' && (
                            <div className="ml-9 space-y-3">
                              {selectedLocker ? (
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        {language === 'ro' ? 'Punct selectat:' : 'Selected point:'}
                                      </p>
                                      <p className="text-sm font-medium mt-1">{selectedLocker.name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedLocker.address}</p>
                                    </div>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setLockerSelectorOpen(true)}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      {language === 'ro' ? 'Schimbă' : 'Change'}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  type="button"
                                  variant="outline"
                                  onClick={() => setLockerSelectorOpen(true)}
                                  className="w-full justify-start gap-2"
                                >
                                  <MapPin className="w-4 h-4 text-primary" />
                                  {language === 'ro' ? 'Selectează punctul de livrare' : 'Select delivery point'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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

                    {/* International shipping info */}
                    {!isRomania && (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {language === 'ro' 
                            ? 'Livrare internațională în Uniunea Europeană și Regatul Unit.'
                            : 'International shipping to European Union and United Kingdom.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="card-premium p-4 sm:p-6 space-y-5">
                  <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {language === 'ro' ? 'Metoda de plată' : 'Payment method'}
                  </h2>

                  <RadioGroup
                    value={form.paymentMethod}
                    onValueChange={(value) => updateForm('paymentMethod', value)}
                    className="space-y-3"
                  >
                    {/* Cash on delivery - only for Romania, not locker, not pickup */}
                    {isRomania && form.deliveryMethod !== 'locker' && form.deliveryMethod !== 'pickup' && (
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
                    )}

                    {/* Card payment online */}
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
                <div className="card-premium p-4 sm:p-6 space-y-4">
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
              <div className="opacity-0 animate-fade-up animation-delay-200 p-1">
                <div className="card-premium p-3 sm:p-4 md:p-6 sticky top-24 space-y-4 sm:space-y-6">
                  <h2 className="font-display text-lg sm:text-xl tracking-wide">
                    {language === 'ro' ? 'Sumar comandă' : 'Order summary'}
                  </h2>

                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto overflow-x-visible px-1 py-1 -mx-1">
                    {items.map((item) => (
                      <div 
                        key={`${item.id}-${item.isGift ? 'gift' : 'regular'}`} 
                        className={`flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl ${item.isGift ? 'bg-green-500/10 ring-1 ring-green-500/30' : 'bg-muted/30'}`}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted shrink-0 relative">
                          <img 
                            src={item.image} 
                            alt={language === 'ro' ? item.name : item.nameEn}
                            className="w-full h-full object-contain p-1"
                          />
                          {item.isGift && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center z-10">
                              <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1 flex-wrap">
                            <p className="font-medium text-xs sm:text-sm line-clamp-2 break-words">
                              {language === 'ro' ? item.name : item.nameEn}
                            </p>
                            {item.isGift && (
                              <span className="shrink-0 px-1 py-0.5 bg-green-500/20 text-green-600 text-[9px] sm:text-[10px] font-semibold rounded">
                                {language === 'ro' ? 'CADOU' : 'GIFT'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {item.isGift 
                              ? (language === 'ro' ? '1 x Gratuit' : '1 x Free')
                              : `${item.quantity} x ${formatPrice(item.price)}`
                            }
                          </p>
                        </div>
                        {!item.isGift && (
                          <p className="font-medium text-xs sm:text-sm shrink-0 text-right">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">
                      {language === 'ro' ? 'Cod cupon' : 'Coupon code'}
                    </Label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="min-w-0">
                          <p className="font-medium text-green-600 text-sm truncate">{appliedCoupon.code}</p>
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
                          className="text-destructive hover:text-destructive shrink-0 h-8 px-2"
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
                          className="flex-1 min-w-0 text-sm"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={applyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className="shrink-0"
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

                  <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-border">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          {language === 'ro' ? 'Reducere' : 'Discount'}
                        </span>
                        <span className="text-green-600">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs sm:text-sm">
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

                  <div className="pt-3 sm:pt-4 border-t border-border">
                    <div className="flex justify-between items-baseline">
                      <span className="font-display text-base sm:text-lg">TOTAL</span>
                      <span className="font-bold text-primary text-lg sm:text-xl">
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
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'ro' ? 'Se procesează...' : 'Processing...'}
                      </>
                    ) : (
                      language === 'ro' ? 'Plasează comanda' : 'Place order'
                    )}
                  </Button>

                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed">
                    {language === 'ro' 
                      ? 'Prin plasarea comenzii, ești de acord cu termenii și condițiile noastre.'
                      : 'By placing your order, you agree to our terms and conditions.'}
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Locker Selector Modal */}
          <LockerSelector
            open={lockerSelectorOpen}
            onOpenChange={setLockerSelectorOpen}
            onSelectLocker={(locker) => setSelectedLocker(locker)}
            selectedLockerId={selectedLocker?.id}
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default Checkout;
