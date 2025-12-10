import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { language, t } = useLanguage();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <MainLayout>
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-3xl tracking-wide">
                {language === 'ro' ? 'Coșul tău este gol' : 'Your cart is empty'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ro' 
                  ? 'Nu ai niciun produs în coș. Descoperă produsele noastre premium!'
                  : 'You have no products in your cart. Discover our premium products!'}
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/produse">{t('nav.products')}</Link>
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
          <h1 className="font-display text-4xl tracking-wide mb-8 opacity-0 animate-fade-up">
            {language === 'ro' ? 'Coșul tău' : 'Your cart'}
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 opacity-0 animate-fade-up animation-delay-100">
              {items.map((item) => (
                <div key={item.id} className="card-premium p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                    <img 
                      src={item.image} 
                      alt={language === 'ro' ? item.name : item.nameEn}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {language === 'ro' ? item.name : item.nameEn}
                    </h3>
                    <p className="text-primary font-bold text-lg mt-1">
                      {item.price.toFixed(2)} lei
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 bg-muted rounded-lg">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:text-primary transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:text-primary transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {(item.price * item.quantity).toFixed(2)} lei
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="opacity-0 animate-fade-up animation-delay-200">
              <div className="card-premium p-6 sticky top-24 space-y-6">
                <h2 className="font-display text-xl tracking-wide">
                  {language === 'ro' ? 'Sumar comandă' : 'Order summary'}
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ro' ? 'Subtotal' : 'Subtotal'}</span>
                    <span>{totalPrice.toFixed(2)} lei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ro' ? 'Livrare' : 'Shipping'}</span>
                    <span>{language === 'ro' ? 'Calculat la checkout' : 'Calculated at checkout'}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{language === 'ro' ? 'Total' : 'Total'}</span>
                    <span className="text-primary">{totalPrice.toFixed(2)} lei</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="hero" size="lg" className="w-full" asChild>
                    <Link to="/checkout">
                      {language === 'ro' ? 'Finalizează comanda' : 'Proceed to checkout'}
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/produse">
                      {language === 'ro' ? 'Continuă cumpărăturile' : 'Continue shopping'}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Cart;
