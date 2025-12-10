import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Eye, Loader2, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  customer_email: string;
  customer_phone: string;
  customer_first_name: string;
  customer_last_name: string;
  delivery_method: string;
  payment_method: string;
  payment_status: string | null;
  shipping_address: any;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'În așteptare', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  processing: { label: 'În procesare', color: 'bg-blue-500/10 text-blue-600', icon: Package },
  shipped: { label: 'Expediată', color: 'bg-indigo-500/10 text-indigo-600', icon: Truck },
  delivered: { label: 'Finalizată', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  cancelled: { label: 'Anulată', color: 'bg-red-500/10 text-red-600', icon: XCircle },
};

const deliveryLabels: Record<string, string> = {
  shipping: 'Livrare',
  pickup: 'Ridicare',
  locker: 'Locker',
};

const paymentLabels: Record<string, string> = {
  cash_on_delivery: 'Ramburs',
  stripe: 'Card',
  netopia: 'Netopia',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Eroare la încărcarea comenzilor');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    
    setOrderItems(data || []);
    setDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      toast.success('Status actualizat');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_first_name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_last_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide">Comenzi</h1>
        <p className="text-muted-foreground mt-1">Gestionează comenzile primite</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Caută comenzi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Toate statusurile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
            <SelectItem value="processing">În procesare</SelectItem>
            <SelectItem value="shipped">Expediată</SelectItem>
            <SelectItem value="delivered">Finalizată</SelectItem>
            <SelectItem value="cancelled">Anulată</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comandă</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Livrare</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nu există comenzi
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium">{order.order_number}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{Number(order.total).toFixed(2)} lei</p>
                        <p className="text-sm text-muted-foreground">{paymentLabels[order.payment_method]}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{deliveryLabels[order.delivery_method]}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[order.status]?.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => viewOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Comandă {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Status Update */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">În așteptare</SelectItem>
                    <SelectItem value="processing">În procesare</SelectItem>
                    <SelectItem value="shipped">Expediată</SelectItem>
                    <SelectItem value="delivered">Finalizată</SelectItem>
                    <SelectItem value="cancelled">Anulată</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="font-medium">Date client</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Nume:</span> {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</p>
                  <p><span className="text-muted-foreground">Telefon:</span> {selectedOrder.customer_phone}</p>
                  <p><span className="text-muted-foreground">Data:</span> {formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="space-y-2">
                <h3 className="font-medium">Livrare</h3>
                <div className="text-sm">
                  <p><span className="text-muted-foreground">Metodă:</span> {deliveryLabels[selectedOrder.delivery_method]}</p>
                  {selectedOrder.shipping_address && (
                    <p className="mt-1">
                      <span className="text-muted-foreground">Adresă:</span>{' '}
                      {selectedOrder.shipping_address.address}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.county}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h3 className="font-medium">Produse</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {Number(item.unit_price).toFixed(2)} lei
                        </p>
                      </div>
                      <p className="font-medium">{Number(item.total_price).toFixed(2)} lei</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{Number(selectedOrder.subtotal).toFixed(2)} lei</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livrare</span>
                  <span>{Number(selectedOrder.shipping_cost).toFixed(2)} lei</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{Number(selectedOrder.discount).toFixed(2)} lei</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{Number(selectedOrder.total).toFixed(2)} lei</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.customer_notes && (
                <div className="space-y-2">
                  <h3 className="font-medium">Note client</h3>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    {selectedOrder.customer_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
