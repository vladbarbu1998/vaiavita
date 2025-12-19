import { useState, useEffect, useRef, useCallback } from 'react';
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
  FileDown,
  Volume2,
  VolumeX,
  Bell,
  Copy,
  Globe,
  Monitor
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useGlobalOrdersSubscription } from '@/hooks/useGlobalOrderNotifications';

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
  ecolet_order_id: string | null;
  oblio_invoice_number: string | null;
  oblio_series_name: string | null;
  oblio_invoice_link: string | null;
  oblio_invoice_date: string | null;
  awb_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  cancel_reason: string | null;
  cancel_source: string | null;
  ip_address: string | null;
  user_agent: string | null;
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
  card_paid: { label: 'Plătită cu cardul', color: 'bg-emerald-500/10 text-emerald-600', icon: CreditCard },
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
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [pendingStatusOrder, setPendingStatusOrder] = useState<Order | null>(null);
  const [awbNumber, setAwbNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [fetchingAwb, setFetchingAwb] = useState(false);
  const [awbFetchError, setAwbFetchError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [sendCancelEmail, setSendCancelEmail] = useState(true);
  const [pickupLocation, setPickupLocation] = useState('VAIAVITA');
  const [pickupAddress, setPickupAddress] = useState('Strada Iuliu Maniu 60, Brașov, 500091');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Callbacks for realtime updates
  const handleNewOrder = useCallback((newOrder: Order) => {
    console.log('[AdminOrders] New order received via global subscription:', newOrder.order_number);
    setOrders(prev => {
      // Avoid duplicates
      if (prev.some(o => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
  }, []);

  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    console.log('[AdminOrders] Order updated via global subscription:', updatedOrder.order_number);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  }, []);

  const handleOrderDelete = useCallback((orderId: string) => {
    console.log('[AdminOrders] Order deleted via global subscription:', orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  // Use global realtime subscription with callbacks
  const { isConnected: isRealtimeConnected, soundEnabled, setSoundEnabled, testSound } = useGlobalOrdersSubscription(
    handleNewOrder,
    handleOrderUpdate,
    handleOrderDelete
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const bulkDelete = async () => {
    if (!confirm(`Sigur vrei să ștergi ${selectedIds.size} comenzi? Această acțiune este ireversibilă.`)) return;
    
    setBulkDeleting(true);
    let successCount = 0;
    
    for (const id of selectedIds) {
      try {
        // Delete order items first
        await supabase.from('order_items').delete().eq('order_id', id);
        // Delete order
        await supabase.from('orders').delete().eq('id', id);
        successCount++;
      } catch (err) {
        console.error('Error deleting order:', id, err);
      }
    }
    
    toast.success(`${successCount} comenzi șterse`);
    setSelectedIds(new Set());
    fetchData();
    setBulkDeleting(false);
  };

  // Fetch initial data
  useEffect(() => {
    console.log('[AdminOrders] Fetching initial data...');
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
      card_paid: 'confirmation', // Card payments use same confirmation email
      processing: 'processing',
      pregatita_ridicare: 'ready_pickup',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    return statusEmailMap[status] || null;
  };

  const getOrderEmailLanguage = (order: Order): 'ro' | 'en' => {
    const shippingAddress = order.shipping_address as any;
    const countryCode = shippingAddress?.countryCode || 'RO';
    // Send emails in English for all countries except Romania
    return countryCode === 'RO' ? 'ro' : 'en';
  };

  const sendOrderEmail = async (orderId: string, emailType: string, options?: { awbNumber?: string; courierName?: string; cancellationReason?: string; pickupLocation?: string; pickupAddress?: string }) => {
    setSendingEmail(orderId);
    try {
      // Find the order to determine language
      const order = orders.find(o => o.id === orderId);
      const language = order ? getOrderEmailLanguage(order) : 'ro';

      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderId,
          emailType,
          language,
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

  const handleStatusChange = async (order: Order, newStatus: string) => {
    if (newStatus === 'shipped') {
      setPendingStatusOrder(order);
      setAwbNumber(order.awb_number || '');
      setCourierName(order.courier_name || '');
      setTrackingUrl(order.tracking_url || '');
      setAwbFetchError(null);
      setShippedDialogOpen(true);
      
      // Auto-fetch AWB from Ecolet if synced
      if (order.ecolet_synced) {
        fetchAwbFromEcolet(order.id);
      }
    } else if (newStatus === 'cancelled') {
      setPendingStatusOrder(order);
      setCancellationReason(order.cancel_reason || '');
      setSendCancelEmail(true);
      setCancelDialogOpen(true);
    } else if (newStatus === 'pregatita_ridicare') {
      setPendingStatusOrder(order);
      setPickupLocation('VAIAVITA');
      setPickupAddress('Strada Iuliu Maniu 60, Brașov, 500091');
      setPickupDialogOpen(true);
    } else {
      updateOrderStatus(order.id, newStatus as any);
    }
  };

  const fetchAwbFromEcolet = async (orderId: string) => {
    setFetchingAwb(true);
    setAwbFetchError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-ecolet-awb', {
        body: { orderId },
      });

      if (error) throw error;

      if (data?.success) {
        setAwbNumber(data.awb_number || '');
        setCourierName(data.courier_name || '');
        setTrackingUrl(data.tracking_url || '');
        toast.success('AWB preluat din Ecolet!');
      } else if (data?.awbNotGenerated) {
        setAwbFetchError('AWB-ul nu a fost încă generat în Ecolet. Generează-l din panoul Ecolet și apoi apasă "Reîncearcă".');
      } else if (data?.needsSync) {
        setAwbFetchError('Comanda nu a fost sincronizată în Ecolet. Sincronizeaz-o mai întâi.');
      } else if (data?.notFound) {
        setAwbFetchError('Comanda nu a fost găsită în Ecolet.');
      } else {
        setAwbFetchError(data?.error || 'Eroare la preluarea AWB');
      }
    } catch (err: any) {
      console.error('Error fetching AWB:', err);
      setAwbFetchError(err.message || 'Eroare la conectarea cu Ecolet');
    } finally {
      setFetchingAwb(false);
    }
  };

  const confirmShippedStatus = async () => {
    if (!pendingStatusOrder) return;
    
    // Save AWB, courier and tracking URL to database along with status
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'shipped',
        awb_number: awbNumber || null,
        courier_name: courierName || null,
        tracking_url: trackingUrl || null,
        shipped_email_sent_at: new Date().toISOString()
      })
      .eq('id', pendingStatusOrder.id);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      toast.success('Status actualizat');
      fetchData();
      if (selectedOrder?.id === pendingStatusOrder.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: 'shipped',
          awb_number: awbNumber || null,
          courier_name: courierName || null,
          tracking_url: trackingUrl || null
        });
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
    
    // Save cancellation reason and update status
    const updateData: any = { 
      status: 'cancelled',
      cancel_reason: cancellationReason || null,
      cancel_source: 'admin_manual'
    };
    
    if (sendCancelEmail) {
      updateData.cancelled_email_sent_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', pendingStatusOrder.id);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      toast.success('Comandă anulată');
      fetchData();
      if (selectedOrder?.id === pendingStatusOrder.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: 'cancelled',
          cancel_reason: cancellationReason || null,
          cancel_source: 'admin_manual'
        });
      }
      
      // Send email only if checkbox is checked
      if (sendCancelEmail) {
        await sendOrderEmail(pendingStatusOrder.id, 'cancelled', { 
          cancellationReason: cancellationReason || 'Comanda a fost anulată.' 
        });
      }
    }
    
    setCancelDialogOpen(false);
    setPendingStatusOrder(null);
  };

  const confirmPickupStatus = async () => {
    if (!pendingStatusOrder) return;
    
    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'pregatita_ridicare',
        pickup_location: pickupLocation
      })
      .eq('id', pendingStatusOrder.id);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      toast.success('Status actualizat');
      fetchData();
      if (selectedOrder?.id === pendingStatusOrder.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: 'pregatita_ridicare',
          pickup_location: pickupLocation
        });
      }
      
      // Send email with pickup details
      await sendOrderEmail(pendingStatusOrder.id, 'ready_pickup', { 
        pickupLocation,
        pickupAddress
      });
    }
    
    setPickupDialogOpen(false);
    setPendingStatusOrder(null);
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'pregatita_ridicare' | 'card_paid') => {
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
      // Also skip card_paid since confirmation email was already sent by webhook
      if (newStatus !== 'shipped' && newStatus !== 'cancelled' && newStatus !== 'card_paid') {
        const emailType = getEmailTypeForStatus(newStatus);
        if (emailType) {
          await sendOrderEmail(orderId, emailType);
        }
      }
    }
  };

  const sendToEcolet = async (order: Order) => {
    // Block sync for Stripe orders that haven't been paid
    if (order.payment_method === 'stripe' && order.payment_status !== 'paid') {
      toast.error('Nu poți sincroniza în Ecolet o comandă cu plată card nefinalizată. Așteaptă confirmarea plății.');
      return;
    }
    
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
    // Don't show button for pickup orders
    if (!['shipping', 'postal', 'locker'].includes(order.delivery_method)) return false;
    // Don't show for cancelled or delivered
    if (order.status === 'cancelled' || order.status === 'delivered') return false;
    // Don't show for Stripe orders that haven't been paid (webhook handles auto-sync)
    if (order.payment_method === 'stripe' && order.payment_status !== 'paid') return false;
    return true;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Comenzi</h1>
          <p className="text-muted-foreground mt-1">Gestionează comenzile primite</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border">
            <span 
              className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {isRealtimeConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Sound Toggle & Test */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Sunet
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSoundEnabled(!soundEnabled)}>
                {soundEnabled ? (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Dezactivează sunet
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Activează sunet
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => testSound('new_order')}>
                <Bell className="w-4 h-4 mr-2" />
                Test: Comandă nouă
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => testSound('payment_confirmed')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Test: Plată confirmată
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" onClick={exportOrders}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
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
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={bulkDelete}
            disabled={bulkDeleting}
            className="gap-2"
          >
            {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Șterge ({selectedIds.size})
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
                <SelectItem value="card_paid">Plătită cu cardul</SelectItem>
                <SelectItem value="processing">În procesare</SelectItem>
                <SelectItem value="pregatita_ridicare">Pregătită ridicare</SelectItem>
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
                <th className="text-left p-4 text-sm font-medium text-muted-foreground w-12">
                  <Checkbox
                    checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comandă</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Livrare</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">AWB</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
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
                        <Checkbox
                          checked={selectedIds.has(order.id)}
                          onCheckedChange={() => toggleSelectOne(order.id)}
                        />
                      </td>
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
                                <><Clock className="w-3 h-3" /> Așteaptă plata</>
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
                        {order.awb_number ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <p className="font-mono text-sm font-medium truncate max-w-[120px]" title={order.awb_number}>
                                {order.awb_number}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(order.awb_number || '');
                                  toast.success('AWB copiat!');
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            {order.courier_name && (
                              <p className="text-xs text-muted-foreground">{order.courier_name}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
                    {/* card_paid is set automatically by Stripe webhook, not manually selectable for COD orders */}
                    {selectedOrder.payment_method === 'stripe' && (
                      <SelectItem value="card_paid">Plătită cu cardul</SelectItem>
                    )}
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
                    {selectedOrder.shipping_address ? (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p>{selectedOrder.shipping_address.address}</p>
                          {selectedOrder.shipping_address.addressLine2 && (
                            <p>{selectedOrder.shipping_address.addressLine2}</p>
                          )}
                          <p>
                            {selectedOrder.shipping_address.city}
                            {selectedOrder.shipping_address.county && `, ${selectedOrder.shipping_address.county}`}
                            {selectedOrder.shipping_address.postalCode && ` - ${selectedOrder.shipping_address.postalCode}`}
                          </p>
                          <p>{selectedOrder.shipping_address.country}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground italic">Adresă necompletată (comandă veche)</span>
                      </div>
                    )}
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
                        {/* Show delivery address only for shipping/postal - pickup/locker address is already shown in Date Client */}
                        {(selectedOrder.delivery_method === 'shipping' || selectedOrder.delivery_method === 'postal') && selectedOrder.shipping_address && (
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

              {/* IP & Device Info */}
              {(selectedOrder.ip_address || selectedOrder.user_agent) && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Informații dispozitiv
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {selectedOrder.ip_address && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-[80px]">IP:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{selectedOrder.ip_address}</span>
                      </div>
                    )}
                    {selectedOrder.user_agent && (
                      <div className="flex items-start gap-2">
                        <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground break-all">{selectedOrder.user_agent}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

      {/* Shipped Status Dialog - AWB & Courier with Ecolet auto-fetch */}
      <Dialog open={shippedDialogOpen} onOpenChange={setShippedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Detalii expediere
            </DialogTitle>
            <DialogDescription>
              Datele de tracking pentru comanda {pendingStatusOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Introdu detaliile AWB pentru a notifica clientul despre expediere.
            </p>

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
            <div className="space-y-2">
              <Label htmlFor="tracking">Link tracking (opțional)</Label>
              <Input
                id="tracking"
                placeholder="https://..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Link-ul va fi inclus în email-ul de expediere
              </p>
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
              <Mail className="w-4 h-4" />
              Trimite email + Confirmă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Status Dialog - Reason + Email checkbox */}
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
              <Label htmlFor="reason">Motivul anulării *</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Clientul a solicitat anularea comenzii..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
              <input
                type="checkbox"
                id="sendCancelEmail"
                checked={sendCancelEmail}
                onChange={(e) => setSendCancelEmail(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="sendCancelEmail" className="text-sm cursor-pointer">
                Trimite email de notificare către client
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Renunță
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmCancelledStatus}
              disabled={!cancellationReason.trim()}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              {sendCancelEmail ? 'Anulează + Trimite email' : 'Anulează comandă'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Ready Dialog - Location & Address */}
      <Dialog open={pickupDialogOpen} onOpenChange={setPickupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Detalii ridicare
            </DialogTitle>
            <DialogDescription>
              Specifică locația pentru ridicarea comenzii {pendingStatusOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Aceste detalii vor fi trimise clientului în emailul de notificare.
            </p>

            {/* Quick fill buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setPickupLocation('VAIAVITA');
                  setPickupAddress('Strada Iuliu Maniu 60, Brașov, 500091');
                }}
              >
                VAIAVITA
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setPickupLocation('DentalMed Brașov');
                  setPickupAddress('Strada Lungă 14, Brașov, 500058');
                }}
              >
                DentalMed
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Nume locație *</Label>
              <Input
                id="pickupLocation"
                placeholder="Ex: VAIAVITA"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Adresa completă *</Label>
              <Textarea
                id="pickupAddress"
                placeholder="Ex: Strada Iuliu Maniu 60, Brașov, 500091"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickupDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={confirmPickupStatus}
              disabled={!pickupLocation.trim() || !pickupAddress.trim()}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Trimite email + Confirmă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
