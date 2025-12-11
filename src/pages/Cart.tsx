import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, Truck, Gift } from 'lucide-react';

const Cart = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items, updateQuantity, removeItem, totalPrice, hasPromoFreeShipping } = useCart();

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
                    ? 'Nu ai niciun produs în coș. Descoperă produsele noastre premium!'
                    : 'You have no products in your cart. Discover our premium products!'}
                </p>
              </div>
              <Button variant="hero" size="lg" asChild className="group">
                <Link to="/produse">
                  {t('nav.products')}
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
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
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-10 opacity-0 animate-fade-up">
            {language === 'ro' ? 'Coșul tău' : 'Your cart'}
          </h1>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 opacity-0 animate-fade-up animation-delay-100">
              {items.map((item, index) => (
                <div 
                  key={`${item.id}-${item.isGift ? 'gift' : 'regular'}`} 
                  className={`card-premium p-5 flex gap-5 group ${item.isGift ? 'ring-2 ring-green-500/30 bg-green-500/5' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link 
                    to={`/produse/${item.slug}`}
                    className="w-28 h-28 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden shrink-0 p-3 hover:ring-2 hover:ring-primary/30 transition-all relative"
                  >
                    <img 
                      src={item.image} 
                      alt={language === 'ro' ? item.name : item.nameEn}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    {item.isGift && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Gift className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/produse/${item.slug}`}
                          className="font-display text-lg tracking-wide truncate block hover:text-primary transition-colors"
                        >
                          {language === 'ro' ? item.name : item.nameEn}
                        </Link>
                        {item.isGift && (
                          <span className="shrink-0 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                            {language === 'ro' ? 'CADOU' : 'GIFT'}
                          </span>
                        )}
                      </div>
                      <p className={`font-bold text-xl mt-1 ${item.isGift ? 'text-green-600' : 'text-primary'}`}>
                        {item.isGift 
                          ? (language === 'ro' ? 'GRATUIT' : 'FREE')
                          : formatPrice(item.price)
                        }
                      </p>
                    </div>
                    {!item.isGift && (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="inline-flex items-center gap-1 bg-muted/80 rounded-xl p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-9 h-9 rounded-lg hover:bg-background hover:text-primary transition-all flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                updateQuantity(item.id, val);
                              }
                            }}
                            className="w-12 text-center text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-9 h-9 rounded-lg hover:bg-background hover:text-primary transition-all flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {item.isGift && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === 'ro' 
                          ? 'Cadou pentru achiziția a 2+ paste de dinți Dent-Tastic'
                          : 'Gift for purchasing 2+ Dent-Tastic toothpastes'
                        }
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-xl ${item.isGift ? 'text-green-600' : ''}`}>
                      {item.isGift 
                        ? (language === 'ro' ? 'GRATUIT' : 'FREE')
                        : formatPrice(item.price * item.quantity)
                      }
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
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{language === 'ro' ? 'Subtotal' : 'Subtotal'}</span>
                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {language === 'ro' ? 'Livrare' : 'Shipping'}
                    </span>
                    <span className="text-muted-foreground">{language === 'ro' ? 'La checkout' : 'At checkout'}</span>
                  </div>
                </div>

                {/* Free shipping notice */}
                {hasPromoFreeShipping ? (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
                    <p className="text-green-600 font-medium flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {language === 'ro' 
                        ? '🎉 Transport gratuit (România)! (promoție 4+ paste)'
                        : '🎉 Free shipping (Romania)! (4+ toothpaste promo)'}
                    </p>
                  </div>
                ) : totalPrice < 150 && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm">
                    <p className="text-muted-foreground">
                      {language === 'ro' 
                        ? `Mai adaugă ${(150 - totalPrice).toFixed(2)} lei pentru livrare gratuită!`
                        : `Add ${(150 - totalPrice).toFixed(2)} lei more for free shipping!`}
                    </p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalPrice / 150) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-display">{language === 'ro' ? 'Total' : 'Total'}</span>
                    <span className="font-bold text-primary text-xl">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button variant="hero" size="lg" className="w-full group" asChild>
                    <Link to="/checkout">
                      {language === 'ro' ? 'Finalizează comanda' : 'Proceed to checkout'}
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/produse">
                      {language === 'ro' ? 'Continuă cumpărăturile' : 'Continue shopping'}
                    </Link>
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>{language === 'ro' ? 'Livrare sigură' : 'Safe delivery'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>{language === 'ro' ? '1-3 zile' : '1-3 days'}</span>
                    </div>
                  </div>
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
