import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, Loader2, User, Mail, Phone, Package, Eye, Trash2, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Customer {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredCustomers.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredCustomers.map(c => c.email)));
    }
  };

  const toggleSelectOne = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setSelectedEmails(newSet);
  };

  const bulkDelete = async () => {
    if (!confirm(`Sigur vrei să ștergi ${selectedEmails.size} clienți și toate comenzile lor asociate?`)) return;
    
    setBulkDeleting(true);
    let successCount = 0;
    
    for (const email of selectedEmails) {
      try {
        await supabase.from('reviews').delete().eq('customer_email', email);
        await supabase.from('coupons').delete().eq('allowed_email', email);
        await supabase.from('orders').delete().eq('customer_email', email);
        successCount++;
      } catch (err) {
        console.error('Error deleting customer:', email, err);
      }
    }
    
    toast.success(`${successCount} clienți șterși`);
    setSelectedEmails(new Set());
    fetchCustomers();
    setBulkDeleting(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('customer_email, customer_first_name, customer_last_name, customer_phone, total, created_at');

    if (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
      return;
    }

    // Aggregate customer data
    const customerMap = new Map<string, Customer>();
    
    data?.forEach((order) => {
      const email = order.customer_email;
      const existing = customerMap.get(email);
      
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += Number(order.total);
        if (new Date(order.created_at) > new Date(existing.lastOrder)) {
          existing.lastOrder = order.created_at;
        }
      } else {
        customerMap.set(email, {
          email,
          firstName: order.customer_first_name,
          lastName: order.customer_last_name,
          phone: order.customer_phone,
          ordersCount: 1,
          totalSpent: Number(order.total),
          lastOrder: order.created_at,
        });
      }
    });

    setCustomers(Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime()
    ));
    setLoading(false);
  };

  const viewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('customer_email', customer.email)
      .order('created_at', { ascending: false });
    
    setCustomerOrders(data || []);
    setDialogOpen(true);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = search.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.phone.includes(search)
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const statusLabels: Record<string, string> = {
    pending: 'În așteptare',
    processing: 'În procesare',
    shipped: 'Expediată',
    delivered: 'Finalizată',
    cancelled: 'Anulată',
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Ești sigur că vrei să ștergi clientul ${customer.firstName} ${customer.lastName} și toate comenzile asociate?`)) {
      return;
    }

    try {
      // First delete reviews by this customer
      await supabase.from('reviews').delete().eq('customer_email', customer.email);
      
      // Delete coupons restricted to this email
      await supabase.from('coupons').delete().eq('allowed_email', customer.email);
      
      // Delete all orders for this customer (order_items will cascade)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('customer_email', customer.email);

      if (error) throw error;

      toast.success('Client șters cu succes');
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error('Eroare la ștergerea clientului');
    }
  };

  const exportCustomers = () => {
    const headers = ['Email', 'Prenume', 'Nume', 'Telefon', 'Nr. Comenzi', 'Total Cheltuit', 'Ultima Comandă'];
    const rows = customers.map(c => [
      c.email,
      c.firstName,
      c.lastName,
      c.phone,
      c.ordersCount.toString(),
      c.totalSpent.toFixed(2),
      formatDate(c.lastOrder)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clienti_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export realizat cu succes');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Clienți</h1>
          <p className="text-muted-foreground mt-1">Vezi și gestionează clienții</p>
        </div>
        <Button variant="outline" onClick={exportCustomers}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Caută clienți..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Total clienți</p>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Total comenzi</p>
          <p className="text-2xl font-bold">{customers.reduce((acc, c) => acc + c.ordersCount, 0)}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Venituri totale</p>
          <p className="text-2xl font-bold text-primary">
            {customers.reduce((acc, c) => acc + c.totalSpent, 0).toFixed(2)} lei
          </p>
        </div>
      </div>

      {/* Bulk Delete Button */}
      {selectedEmails.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <Checkbox
            checked={selectedEmails.size === filteredCustomers.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">{selectedEmails.size} clienți selectați</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={bulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Șterge ({selectedEmails.size})
          </Button>
        </div>
      )}

      {/* Customers Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground w-12">
                  <Checkbox
                    checked={filteredCustomers.length > 0 && selectedEmails.size === filteredCustomers.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comenzi</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total cheltuit</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ultima comandă</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nu există clienți
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.email} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedEmails.has(customer.email)}
                        onCheckedChange={() => toggleSelectOne(customer.email)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{customer.ordersCount}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-primary">{customer.totalSpent.toFixed(2)} lei</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-muted-foreground">{formatDate(customer.lastOrder)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewCustomer(customer)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCustomer(customer)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {selectedCustomer.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {selectedCustomer.phone}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total comenzi</p>
                  <p className="text-xl font-bold">{selectedCustomer.ordersCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total cheltuit</p>
                  <p className="text-xl font-bold text-primary">{selectedCustomer.totalSpent.toFixed(2)} lei</p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="font-medium mb-3">Istoric comenzi</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{Number(order.total).toFixed(2)} lei</p>
                        <p className="text-xs text-muted-foreground">{statusLabels[order.status]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
