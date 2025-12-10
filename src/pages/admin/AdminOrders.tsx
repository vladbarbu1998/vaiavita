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
import { Search, Eye, Loader2, Package, Truck, CheckCircle, Clock, XCircle, Filter, Calendar, CreditCard } from 'lucide-react';

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
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Product {
  id: string;
  name_ro: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name_ro: string;
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
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ordersRes, productsRes, categoriesRes, orderItemsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name_ro, category_id'),
      supabase.from('categories').select('id, name_ro').order('sort_order'),
      supabase.from('order_items').select('*'),
    ]);

    if (ordersRes.error) {
      toast.error('Eroare la încărcarea comenzilor');
    } else {
      setOrders(ordersRes.data || []);
    }
    
    setProducts(productsRes.data || []);
    setCategories(categoriesRes.data || []);
    
    // Group order items by order_id
    const itemsMap: Record<string, OrderItem[]> = {};
    (orderItemsRes.data || []).forEach((item: OrderItem) => {
      if (!itemsMap[item.product_id || '']) {
        itemsMap[item.product_id || ''] = [];
      }
    });
    // Actually group by order_id
    const orderItemsGrouped: Record<string, OrderItem[]> = {};
    (orderItemsRes.data || []).forEach((item: any) => {
      if (!orderItemsGrouped[item.order_id]) {
        orderItemsGrouped[item.order_id] = [];
      }
      orderItemsGrouped[item.order_id].push(item);
    });
    setOrderItemsMap(orderItemsGrouped);
    
    setLoading(false);
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setOrderItems(orderItemsMap[order.id] || []);
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
      fetchData();
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
    const matchesDelivery = deliveryFilter === 'all' || order.delivery_method === deliveryFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;
    
    // Date filters
    const orderDate = new Date(order.created_at);
    const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
    
    // Product/Category filter - check if order contains the product or products from category
    let matchesProduct = productFilter === 'all';
    let matchesCategory = categoryFilter === 'all';
    
    const items = orderItemsMap[order.id] || [];
    
    if (productFilter !== 'all') {
      matchesProduct = items.some(item => item.product_id === productFilter);
    }
    
    if (categoryFilter !== 'all') {
      const categoryProductIds = products.filter(p => p.category_id === categoryFilter).map(p => p.id);
      matchesCategory = items.some(item => item.product_id && categoryProductIds.includes(item.product_id));
    }
    
    return matchesSearch && matchesStatus && matchesDelivery && matchesPayment && matchesDateFrom && matchesDateTo && matchesProduct && matchesCategory;
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

  const clearFilters = () => {
    setStatusFilter('all');
    setProductFilter('all');
    setCategoryFilter('all');
    setDeliveryFilter('all');
    setPaymentFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const activeFiltersCount = [statusFilter, productFilter, categoryFilter, deliveryFilter, paymentFilter].filter(f => f !== 'all').length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide">Comenzi</h1>
        <p className="text-muted-foreground mt-1">Gestionează comenzile primite</p>
      </div>

      {/* Search and Filter Toggle */}
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
        <Button 
          variant={showFilters ? "default" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtre
          {activeFiltersCount > 0 && (
            <span className="bg-primary-foreground text-primary w-5 h-5 rounded-full text-xs flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
            Resetează
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card-premium p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
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
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Produs</label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate produsele</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name_ro}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Categorie</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate categoriile</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name_ro}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Livrare</label>
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="shipping">Livrare</SelectItem>
                <SelectItem value="pickup">Ridicare</SelectItem>
                <SelectItem value="locker">Locker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Plată</label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="stripe">Card</SelectItem>
                <SelectItem value="cash_on_delivery">Ramburs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Perioadă</label>
            <div className="flex gap-2">
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs"
                placeholder="De la"
              />
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs"
                placeholder="Până la"
              />
            </div>
          </div>
        </div>
      )}

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
