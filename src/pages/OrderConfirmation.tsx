import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Package, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

interface Order {
  order_number: string;
  customer_email: string;
  customer_first_name: string;
  delivery_method: string;
  payment_method: string;
  total: number;
}

const OrderConfirmation = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      try {
        // Use edge function to securely fetch order data
        const { data, error } = await supabase.functions.invoke('get-order-confirmation', {
          body: { orderNumber }
        });

        if (!error && data && !data.error) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <MainLayout>
        <section className="section-padding">
          <div className="container-custom flex justify-center items-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEOHead
        title="Confirmare Comandă | VAIAVITA"
        description="Comanda ta VAIAVITA a fost plasată cu succes."
        url="/confirmare-comanda"
        noindex
      />
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center space-y-8 opacity-0 animate-fade-up">
            {/* Success Icon */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="font-display text-3xl md:text-4xl tracking-wide">
                {language === 'ro' ? 'Comandă plasată cu succes!' : 'Order placed successfully!'}
              </h1>
              <p className="text-muted-foreground text-lg">
                {language === 'ro' 
                  ? `Mulțumim${order?.customer_first_name ? `, ${order.customer_first_name}` : ''}! Comanda ta a fost înregistrată.`
                  : `Thank you${order?.customer_first_name ? `, ${order.customer_first_name}` : ''}! Your order has been registered.`}
              </p>
            </div>

            {/* Order Details Card */}
            {order && (
              <div className="card-premium p-6 text-left space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ro' ? 'Număr comandă' : 'Order number'}
                    </p>
                    <p className="font-display text-xl tracking-wide">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-xl text-primary">{Number(order.total).toFixed(2)} lei</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ro' ? 'Livrare' : 'Delivery'}
                      </p>
                      <p className="font-medium">
                        {order.delivery_method === 'shipping' 
                          ? (language === 'ro' ? 'Livrare la adresă' : 'Home delivery')
                          : order.delivery_method === 'pickup'
                          ? (language === 'ro' ? 'Ridicare personală' : 'Pickup')
                          : 'Locker'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ro' ? 'Confirmare trimisă la' : 'Confirmation sent to'}
                      </p>
                      <p className="font-medium break-all">{order.customer_email}</p>
                    </div>
                  </div>
                </div>

                {order.payment_method === 'cash_on_delivery' && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm">
                      {language === 'ro' 
                        ? '💵 Plata se va face ramburs, la primirea coletului.'
                        : '💵 Payment will be made on delivery.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                {language === 'ro' 
                  ? 'Vei primi un email de confirmare cu toate detaliile comenzii.'
                  : 'You will receive a confirmation email with all order details.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild className="group">
                  <Link to="/produse">
                    {language === 'ro' ? 'Continuă cumpărăturile' : 'Continue shopping'}
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/">
                    {language === 'ro' ? 'Acasă' : 'Home'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default OrderConfirmation;
