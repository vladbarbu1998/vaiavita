import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
  isGift?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  hasPromoFreeShipping: boolean;
}

// Gift promotion: product_number 1 with qty >= 2 gets product_number 2 as gift
// Free shipping: product_number 1 with qty >= 4 gets free shipping
const PROMO_TRIGGER_PRODUCT_NUMBER = 1;
const PROMO_GIFT_PRODUCT_NUMBER = 2;
const PROMO_MIN_QUANTITY_GIFT = 2;
const PROMO_MIN_QUANTITY_FREE_SHIPPING = 4;

// Export for use in other components
export const PROMO_CONFIG = {
  triggerProductNumber: PROMO_TRIGGER_PRODUCT_NUMBER,
  giftProductNumber: PROMO_GIFT_PRODUCT_NUMBER,
  minQuantityGift: PROMO_MIN_QUANTITY_GIFT,
  minQuantityFreeShipping: PROMO_MIN_QUANTITY_FREE_SHIPPING,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vaiavita-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [promoProductIds, setPromoProductIds] = useState<{ triggerId: string | null; giftId: string | null }>({
    triggerId: null,
    giftId: null,
  });

  // Fetch promo product IDs on mount
  useEffect(() => {
    const fetchPromoProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, product_number, name_ro, name_en, slug, images, price')
        .in('product_number', [PROMO_TRIGGER_PRODUCT_NUMBER, PROMO_GIFT_PRODUCT_NUMBER]);
      
      if (data) {
        const trigger = data.find(p => p.product_number === PROMO_TRIGGER_PRODUCT_NUMBER);
        const gift = data.find(p => p.product_number === PROMO_GIFT_PRODUCT_NUMBER);
        setPromoProductIds({
          triggerId: trigger?.id || null,
          giftId: gift?.id || null,
        });
      }
    };
    fetchPromoProducts();
  }, []);

  // Check and apply gift promotion
  const applyGiftPromotion = useCallback(async (currentItems: CartItem[]) => {
    if (!promoProductIds.triggerId || !promoProductIds.giftId) return currentItems;

    const triggerItem = currentItems.find(i => i.id === promoProductIds.triggerId && !i.isGift);
    const giftItem = currentItems.find(i => i.id === promoProductIds.giftId && i.isGift);
    const regularGiftItem = currentItems.find(i => i.id === promoProductIds.giftId && !i.isGift);

    // If trigger product has qty >= 2 and gift not already added as gift
    if (triggerItem && triggerItem.quantity >= PROMO_MIN_QUANTITY_GIFT && !giftItem) {
      // Fetch gift product data
      const { data: giftProduct } = await supabase
        .from('products')
        .select('id, name_ro, name_en, slug, images, price')
        .eq('product_number', PROMO_GIFT_PRODUCT_NUMBER)
        .maybeSingle();

      if (giftProduct) {
        toast.success('🎁 Cadou adăugat: Periuță de dinți VAIAVITA!');
        return [
          ...currentItems,
          {
            id: giftProduct.id,
            name: giftProduct.name_ro,
            nameEn: giftProduct.name_en,
            price: 0,
            quantity: 1,
            image: giftProduct.images?.[0] || '',
            slug: giftProduct.slug,
            isGift: true,
          },
        ];
      }
    }

    // If trigger product qty < 2 and gift was added, remove it
    if ((!triggerItem || triggerItem.quantity < PROMO_MIN_QUANTITY_GIFT) && giftItem) {
      toast.info('Cadoul a fost eliminat din coș');
      return currentItems.filter(i => !(i.id === promoProductIds.giftId && i.isGift));
    }

    return currentItems;
  }, [promoProductIds]);

  useEffect(() => {
    localStorage.setItem('vaiavita-cart', JSON.stringify(items));
  }, [items]);

  // Apply promotion when items or promo IDs change
  useEffect(() => {
    if (!promoProductIds.triggerId || !promoProductIds.giftId) return;
    
    const checkPromotion = async () => {
      const updatedItems = await applyGiftPromotion(items);
      if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
        setItems(updatedItems);
      }
    };
    checkPromotion();
  }, [items.find(i => i.id === promoProductIds.triggerId)?.quantity, promoProductIds, applyGiftPromotion]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id && !i.isGift);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && !i.isGift
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id || i.isGift));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => 
      i.id === id && !i.isGift ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Check if promo free shipping applies (4+ trigger products)
  const hasPromoFreeShipping = items.some(
    item => item.id === promoProductIds.triggerId && !item.isGift && item.quantity >= PROMO_MIN_QUANTITY_FREE_SHIPPING
  );

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      hasPromoFreeShipping,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
