import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Search, 
  Eye, 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Filter, 
  CreditCard, 
  Download, 
  MapPin,
  Send,
  Mail,
  Phone,
  User,
  Calendar,
  Banknote,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Trash2,
  MoreVertical,
  Settings2,
  FileDown
} from 'lucide-react';

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
  pickup_location: string | null;
  locker_id: string | null;
  locker_name: string | null;
  locker_address: string | null;
  locker_locality_id: number | null;
  coupon_code: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  customer_notes: string | null;
  admin_notes: string | null;
  ecolet_synced: boolean | null;
  ecolet_sync_error: string | null;
  oblio_invoice_number: string | null;
  oblio_series_name: string | null;
  oblio_invoice_link: string | null;
  oblio_invoice_date: string | null;
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
  pregatita_ridicare: { label: 'Pregătită pentru ridicare', color: 'bg-purple-500/10 text-purple-600', icon: MapPin },
  shipped: { label: 'Expediată', color: 'bg-indigo-500/10 text-indigo-600', icon: Truck },
  delivered: { label: 'Finalizată', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  cancelled: { label: 'Anulată', color: 'bg-red-500/10 text-red-600', icon: XCircle },
};

const deliveryLabels: Record<string, { label: string; icon: any }> = {
  shipping: { label: 'Curier la adresă', icon: Truck },
  pickup: { label: 'Ridicare personală', icon: MapPin },
  locker: { label: 'Easybox / Locker', icon: Package },
  postal: { label: 'Poșta Română', icon: Package },
};

const paymentLabels: Record<string, { label: string; icon: any }> = {
  cash_on_delivery: { label: 'Ramburs', icon: Banknote },
  stripe: { label: 'Card online', icon: CreditCard },
  netopia: { label: 'Netopia', icon: CreditCard },
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
  const [sendingToEcolet, setSendingToEcolet] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  
  // Dialog states for status changes
  const [shippedDialogOpen, setShippedDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pendingStatusOrder, setPendingStatusOrder] = useState<Order | null>(null);
  const [awbNumber, setAwbNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchData();

    // Setup realtime subscription for orders
    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Realtime order update:', payload);
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
            toast.success(`Comandă nouă: ${(payload.new as Order).order_number}`);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('Realtime order_items update:', payload);
          const newItem = payload.new as OrderItem & { order_id: string };
          setOrderItemsMap(prev => ({
            ...prev,
            [newItem.order_id]: [...(prev[newItem.order_id] || []), newItem]
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
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

  const getEmailTypeForStatus = (status: string): string | null => {
    const statusEmailMap: Record<string, string> = {
      pending: 'confirmation',
      processing: 'processing',
      pregatita_ridicare: 'ready_pickup',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    return statusEmailMap[status] || null;
  };

  const sendOrderEmail = async (orderId: string, emailType: string, options?: { awbNumber?: string; courierName?: string; cancellationReason?: string }) => {
    setSendingEmail(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderId,
          emailType,
          language: 'ro',
          ...options,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Email trimis cu succes!');
      } else {
        throw new Error(data?.error || 'Eroare la trimitere email');
      }
    } catch (err: any) {
      console.error('Email send error:', err);
      toast.error(`Eroare: ${err.message}`);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    if (newStatus === 'shipped') {
      setPendingStatusOrder(order);
      setAwbNumber('');
      setCourierName('');
      setShippedDialogOpen(true);
    } else if (newStatus === 'cancelled') {
      setPendingStatusOrder(order);
      setCancellationReason('');
      setCancelDialogOpen(true);
    } else {
      updateOrderStatus(order.id, newStatus as any);
    }
  };

  const confirmShippedStatus = async () => {
    if (!pendingStatusOrder) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', pendingStatusOrder.id);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      toast.success('Status actualizat');
      fetchData();
      if (selectedOrder?.id === pendingStatusOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: 'shipped' });
      }
      
      // Send email with AWB and courier
      await sendOrderEmail(pendingStatusOrder.id, 'shipped', { 
        awbNumber: awbNumber || 'N/A', 
        courierName: courierName || 'Curier' 
      });
    }
    
    setShippedDialogOpen(false);
    setPendingStatusOrder(null);
  };

  const confirmCancelledStatus = async () => {
    if (!pendingStatusOrder) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', pendingStatusOrder.id);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      toast.success('Status actualizat');
      fetchData();
      if (selectedOrder?.id === pendingStatusOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
      }
      
      // Send email with cancellation reason
      await sendOrderEmail(pendingStatusOrder.id, 'cancelled', { 
        cancellationReason: cancellationReason || 'Comanda a fost anulată.' 
      });
    }
    
    setCancelDialogOpen(false);
    setPendingStatusOrder(null);
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'pregatita_ridicare') => {
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

      // Send email notification for status change (except shipped/cancelled which have their own flow)
      if (newStatus !== 'shipped' && newStatus !== 'cancelled') {
        const emailType = getEmailTypeForStatus(newStatus);
        if (emailType) {
          await sendOrderEmail(orderId, emailType);
        }
      }
    }
  };

  const sendToEcolet = async (order: Order) => {
    setSendingToEcolet(order.id);
    
    try {
      const items = orderItemsMap[order.id] || [];
      const ecoletPayload = {
        orderId: order.id,
        orderNumber: order.order_number,
        customerFirstName: order.customer_first_name,
        customerLastName: order.customer_last_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        deliveryMethod: order.delivery_method,
        shippingAddress: order.shipping_address,
        lockerId: order.locker_id,
        lockerName: order.locker_name,
        lockerAddress: order.locker_address,
        lockerLocalityId: order.locker_locality_id,
        total: order.total,
        paymentMethod: order.payment_method,
        items: items.map(item => ({
          productName: item.product_name,
          quantity: item.quantity,
        })),
      };

      const { data, error } = await supabase.functions.invoke('create-ecolet-parcel', {
        body: ecoletPayload,
      });

      if (error) throw error;

      if (data?.success) {
        // Update order with sync status
        await supabase
          .from('orders')
          .update({ ecolet_synced: true, ecolet_sync_error: null })
          .eq('id', order.id);
        
        toast.success('Comandă trimisă cu succes în Ecolet!');
        fetchData();
      } else {
        throw new Error(data?.error || 'Eroare necunoscută');
      }
    } catch (err: any) {
      console.error('Ecolet sync error:', err);
      
      // Update order with error
      await supabase
        .from('orders')
        .update({ ecolet_synced: false, ecolet_sync_error: err.message })
        .eq('id', order.id);
      
      toast.error(`Eroare: ${err.message}`);
      fetchData();
    } finally {
      setSendingToEcolet(null);
    }
  };

  const generateInvoice = async (order: Order) => {
    setGeneratingInvoice(order.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('oblio-invoice', {
        body: {
          action: 'create',
          orderId: order.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Factură generată: ${data.seriesName} ${data.invoiceNumber}`);
        fetchData();
        // Update selected order if it's the same
        if (selectedOrder?.id === order.id) {
          setSelectedOrder({
            ...selectedOrder,
            oblio_invoice_number: data.invoiceNumber,
            oblio_series_name: data.seriesName,
            oblio_invoice_link: data.link,
            oblio_invoice_date: new Date().toISOString(),
          });
        }
      } else {
        throw new Error(data?.error || 'Eroare necunoscută');
      }
    } catch (err: any) {
      console.error('Invoice generation error:', err);
      toast.error(`Eroare: ${err.message}`);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const cancelInvoice = async (order: Order) => {
    if (!confirm(`Sigur vrei să anulezi factura ${order.oblio_series_name} ${order.oblio_invoice_number}?`)) {
      return;
    }
    
    setCancellingInvoice(order.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('oblio-invoice', {
        body: {
          action: 'cancel',
          orderId: order.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Factură anulată cu succes');
        fetchData();
        // Update selected order if it's the same
        if (selectedOrder?.id === order.id) {
          setSelectedOrder({
            ...selectedOrder,
            oblio_invoice_number: null,
            oblio_series_name: null,
            oblio_invoice_link: null,
            oblio_invoice_date: null,
          });
        }
      } else {
        throw new Error(data?.error || 'Eroare necunoscută');
      }
    } catch (err: any) {
      console.error('Invoice cancel error:', err);
      toast.error(`Eroare: ${err.message}`);
    } finally {
      setCancellingInvoice(null);
    }
  };

  const viewInvoice = (order: Order) => {
    if (order.oblio_invoice_link) {
      window.open(order.oblio_invoice_link, '_blank');
    }
  };

  const downloadInvoice = (order: Order) => {
    if (order.oblio_invoice_link) {
      // Oblio invoice links typically support PDF download by adding /pdf or using the same link
      // The link itself usually opens a PDF that can be downloaded
      const downloadLink = document.createElement('a');
      downloadLink.href = order.oblio_invoice_link;
      downloadLink.target = '_blank';
      downloadLink.download = `Factura_${order.oblio_series_name}_${order.oblio_invoice_number}.pdf`;
      downloadLink.click();
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
    
    // Product/Category filter
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

  const exportOrders = () => {
    const headers = ['Nr. Comandă', 'Data', 'Client', 'Email', 'Telefon', 'Status', 'Livrare', 'Plată', 'Subtotal', 'Livrare', 'Reducere', 'Total'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      formatDate(o.created_at),
      `${o.customer_first_name} ${o.customer_last_name}`,
      o.customer_email,
      o.customer_phone,
      statusConfig[o.status]?.label || o.status,
      deliveryLabels[o.delivery_method]?.label || o.delivery_method,
      paymentLabels[o.payment_method]?.label || o.payment_method,
      Number(o.subtotal).toFixed(2),
      Number(o.shipping_cost || 0).toFixed(2),
      Number(o.discount || 0).toFixed(2),
      Number(o.total).toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comenzi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export realizat cu succes');
  };

  const activeFiltersCount = [statusFilter, productFilter, categoryFilter, deliveryFilter, paymentFilter].filter(f => f !== 'all').length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const canSendToEcolet = (order: Order) => {
    return ['shipping', 'postal', 'locker'].includes(order.delivery_method) && 
           order.status !== 'cancelled' && 
           order.status !== 'delivered';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Comenzi</h1>
          <p className="text-muted-foreground mt-1">Gestionează comenzile primite</p>
        </div>
        <Button variant="outline" onClick={exportOrders}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
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
                {products.filter(p => p.id).map(p => (
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
                {categories.filter(c => c.id).map(c => (
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
                <SelectItem value="shipping">Curier</SelectItem>
                <SelectItem value="postal">Poșta Română</SelectItem>
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
                  const DeliveryIcon = deliveryLabels[order.delivery_method]?.icon || Truck;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.order_number}</p>
                            {order.oblio_invoice_number && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600" title={`Factură: ${order.oblio_series_name} ${order.oblio_invoice_number}`}>
                                <FileText className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          {order.ecolet_synced && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Trimisă în Ecolet
                            </span>
                          )}
                          {order.ecolet_sync_error && !order.ecolet_synced && (
                            <span 
                              className="text-xs text-red-600 flex items-center gap-1 cursor-help max-w-[200px]" 
                              title={order.ecolet_sync_error}
                            >
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Eroare Ecolet: {order.ecolet_sync_error}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{Number(order.total).toFixed(2)} lei</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{paymentLabels[order.payment_method]?.label || order.payment_method}</span>
                          {order.payment_method === 'stripe' && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                              order.payment_status === 'paid' 
                                ? 'bg-green-500/10 text-green-600' 
                                : order.payment_status === 'failed'
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-yellow-500/10 text-yellow-600'
                            }`}>
                              {order.payment_status === 'paid' ? (
                                <><CheckCircle2 className="w-3 h-3" /> Plătit</>
                              ) : order.payment_status === 'failed' ? (
                                <><AlertCircle className="w-3 h-3" /> Eșuat</>
                              ) : (
                                <><Clock className="w-3 h-3" /> Așteptare</>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <DeliveryIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{deliveryLabels[order.delivery_method]?.label || order.delivery_method}</span>
                        </div>
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
                        <div className="flex items-center justify-end gap-1">
                          {/* View Order Button */}
                          <Button variant="ghost" size="icon" onClick={() => viewOrder(order)} title="Vezi comanda">
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" title="Acțiuni">
                                <Settings2 className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {/* Ecolet Actions */}
                              {canSendToEcolet(order) && (
                                <DropdownMenuItem
                                  onClick={() => sendToEcolet(order)}
                                  disabled={sendingToEcolet === order.id}
                                  className="gap-2"
                                >
                                  {sendingToEcolet === order.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                  {order.ecolet_synced ? 'Retrimite în Ecolet' : 'Trimite în Ecolet'}
                                </DropdownMenuItem>
                              )}
                              
                              {/* Email Actions */}
                              <DropdownMenuItem
                                onClick={() => {
                                  const emailType = getEmailTypeForStatus(order.status);
                                  if (emailType) {
                                    sendOrderEmail(order.id, emailType);
                                  }
                                }}
                                disabled={sendingEmail === order.id || !getEmailTypeForStatus(order.status)}
                                className="gap-2"
                              >
                                {sendingEmail === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                                Trimite email notificare
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Oblio Actions */}
                              {order.oblio_invoice_number ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => viewInvoice(order)}
                                    className="gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Vezi factura ({order.oblio_series_name} {order.oblio_invoice_number})
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => downloadInvoice(order)}
                                    className="gap-2"
                                  >
                                    <FileDown className="w-4 h-4" />
                                    Descarcă PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => cancelInvoice(order)}
                                    disabled={cancellingInvoice === order.id}
                                    className="gap-2 text-red-600 focus:text-red-600"
                                  >
                                    {cancellingInvoice === order.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                    Anulează factura
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => generateInvoice(order)}
                                  disabled={generatingInvoice === order.id || order.status === 'cancelled'}
                                  className="gap-2"
                                >
                                  {generatingInvoice === order.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FileText className="w-4 h-4" />
                                  )}
                                  Generează factură
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog - Enhanced */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-3">
              Comandă {selectedOrder?.order_number}
              {selectedOrder && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                  {statusConfig[selectedOrder.status]?.label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/50">
                <span className="text-sm font-medium">Schimbă status:</span>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => handleStatusChange(selectedOrder, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">În așteptare</SelectItem>
                    <SelectItem value="processing">În procesare</SelectItem>
                    {selectedOrder.delivery_method === 'pickup' && (
                      <SelectItem value="pregatita_ridicare">Pregătită ridicare</SelectItem>
                    )}
                    <SelectItem value="shipped">Expediată</SelectItem>
                    <SelectItem value="delivered">Finalizată</SelectItem>
                    <SelectItem value="cancelled">Anulată</SelectItem>
                  </SelectContent>
                </Select>

                {canSendToEcolet(selectedOrder) && (
                  <Button 
                    variant="outline" 
                    onClick={() => sendToEcolet(selectedOrder)}
                    disabled={sendingToEcolet === selectedOrder.id}
                    className="gap-2"
                  >
                    {sendingToEcolet === selectedOrder.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Trimite în Ecolet
                  </Button>
                )}

                {selectedOrder.ecolet_synced && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Sincronizat cu Ecolet
                  </span>
                )}

                {selectedOrder.ecolet_sync_error && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    Eroare sincronizare
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Date client
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedOrder.customer_email}`} className="text-primary hover:underline">
                        {selectedOrder.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedOrder.customer_phone}`} className="text-primary hover:underline">
                        {selectedOrder.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment Info */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Livrare și plată
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const DeliveryIcon = deliveryLabels[selectedOrder.delivery_method]?.icon || Truck;
                        return <DeliveryIcon className="w-4 h-4 text-muted-foreground mt-0.5" />;
                      })()}
                      <div>
                        <p className="font-medium">{deliveryLabels[selectedOrder.delivery_method]?.label}</p>
                        {selectedOrder.shipping_address && (
                          <p className="text-muted-foreground mt-1">
                            {selectedOrder.shipping_address.address}
                            {selectedOrder.shipping_address.addressLine2 && `, ${selectedOrder.shipping_address.addressLine2}`}
                            <br />
                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.county}
                            {selectedOrder.shipping_address.postalCode && ` - ${selectedOrder.shipping_address.postalCode}`}
                            <br />
                            {selectedOrder.shipping_address.country}
                          </p>
                        )}
                        {selectedOrder.pickup_location && (
                          <p className="text-muted-foreground mt-1">{selectedOrder.pickup_location}</p>
                        )}
                        {selectedOrder.locker_name && (
                          <div className="mt-1 p-2 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="font-medium text-primary">{selectedOrder.locker_name}</p>
                            <p className="text-muted-foreground text-xs">{selectedOrder.locker_address}</p>
                            {selectedOrder.locker_id && (
                              <p className="text-muted-foreground text-xs mt-1">ID: {selectedOrder.locker_id}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const PaymentIcon = paymentLabels[selectedOrder.payment_method]?.icon || CreditCard;
                        return <PaymentIcon className="w-4 h-4 text-muted-foreground" />;
                      })()}
                      <span className="font-medium">{paymentLabels[selectedOrder.payment_method]?.label}</span>
                    </div>
                    {selectedOrder.coupon_code && (
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 text-muted-foreground text-center">🎫</span>
                        <span>Cupon: <code className="bg-muted px-2 py-0.5 rounded">{selectedOrder.coupon_code}</code></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Produse comandate
                </h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  {orderItems.map((item, idx) => (
                    <div key={item.id} className={`flex items-center justify-between p-4 ${idx !== orderItems.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {Number(item.unit_price).toFixed(2)} lei
                        </p>
                      </div>
                      <p className="font-medium text-lg">{Number(item.total_price).toFixed(2)} lei</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 p-4 rounded-xl bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal produse</span>
                  <span>{Number(selectedOrder.subtotal).toFixed(2)} lei</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost livrare</span>
                  <span>{Number(selectedOrder.shipping_cost || 0).toFixed(2)} lei</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount aplicat</span>
                    <span>-{Number(selectedOrder.discount).toFixed(2)} lei</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-3 border-t border-border mt-3">
                  <span>TOTAL</span>
                  <span className="text-primary">{Number(selectedOrder.total).toFixed(2)} lei</span>
                </div>
              </div>

              {/* Notes */}
              {(selectedOrder.customer_notes || selectedOrder.admin_notes) && (
                <div className="space-y-3">
                  {selectedOrder.customer_notes && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Note client</h3>
                      <p className="text-sm p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">
                        {selectedOrder.customer_notes}
                      </p>
                    </div>
                  )}
                  {selectedOrder.admin_notes && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Note admin</h3>
                      <p className="text-sm p-3 bg-yellow-500/10 rounded-lg whitespace-pre-wrap">
                        {selectedOrder.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Invoice Section */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Facturare Oblio
                </h3>
                
                {selectedOrder.oblio_invoice_number ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-700">
                          Factură: {selectedOrder.oblio_series_name} {selectedOrder.oblio_invoice_number}
                        </p>
                        {selectedOrder.oblio_invoice_date && (
                          <p className="text-sm text-green-600">
                            Emisă la: {formatDate(selectedOrder.oblio_invoice_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewInvoice(selectedOrder)}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Vezi factura
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelInvoice(selectedOrder)}
                        disabled={cancellingInvoice === selectedOrder.id}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancellingInvoice === selectedOrder.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Anulează factura
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => generateInvoice(selectedOrder)}
                      disabled={generatingInvoice === selectedOrder.id || selectedOrder.status === 'cancelled'}
                      className="gap-2"
                    >
                      {generatingInvoice === selectedOrder.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      Generează factură
                    </Button>
                    {selectedOrder.status === 'cancelled' && (
                      <span className="text-sm text-muted-foreground">
                        Nu se poate genera factură pentru comenzi anulate
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipped Status Dialog - AWB & Courier */}
      <Dialog open={shippedDialogOpen} onOpenChange={setShippedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Detalii expediere
            </DialogTitle>
            <DialogDescription>
              Introdu datele de tracking pentru comanda {pendingStatusOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="awb">Număr AWB *</Label>
              <Input
                id="awb"
                placeholder="Ex: 1234567890"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courier">Nume curier *</Label>
              <Select value={courierName} onValueChange={setCourierName}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează curierul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DPD">DPD</SelectItem>
                  <SelectItem value="Fan Courier">Fan Courier</SelectItem>
                  <SelectItem value="Cargus">Cargus</SelectItem>
                  <SelectItem value="GLS">GLS</SelectItem>
                  <SelectItem value="Sameday">Sameday</SelectItem>
                  <SelectItem value="Poșta Română">Poșta Română</SelectItem>
                  <SelectItem value="Altul">Altul</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippedDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={confirmShippedStatus}
              disabled={!awbNumber.trim() || !courierName}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Confirmă expedierea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Status Dialog - Reason */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Anulare comandă
            </DialogTitle>
            <DialogDescription>
              Specifică motivul anulării comenzii {pendingStatusOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivul anulării</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Clientul a solicitat anularea comenzii..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Renunță
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmCancelledStatus}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Confirmă anularea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
