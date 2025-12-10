import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  weekOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    todayOrders: 0,
    weekOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, created_at');

      // Fetch low stock products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .lt('stock', 10);

      if (orders) {
        const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
        const weekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
        
        setStats({
          totalOrders: orders.length,
          todayOrders: todayOrders.length,
          weekOrders: weekOrders.length,
          totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          processingOrders: orders.filter(o => o.status === 'processing').length,
          shippedOrders: orders.filter(o => o.status === 'shipped').length,
          deliveredOrders: orders.filter(o => o.status === 'delivered').length,
          lowStockProducts: products?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Vânzări totale', 
      value: `${stats.totalRevenue.toFixed(2)} lei`, 
      icon: DollarSign, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Comenzi totale', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'Comenzi azi', 
      value: stats.todayOrders, 
      icon: TrendingUp, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      label: 'Ultimele 7 zile', 
      value: stats.weekOrders, 
      icon: Users, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
  ];

  const orderStatCards = [
    { label: 'În așteptare', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-500' },
    { label: 'În procesare', value: stats.processingOrders, icon: Package, color: 'text-blue-500' },
    { label: 'Expediate', value: stats.shippedOrders, icon: ShoppingCart, color: 'text-indigo-500' },
    { label: 'Livrate', value: stats.deliveredOrders, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide">Prezentare generală</h1>
        <p className="text-muted-foreground mt-1">Bine ai venit în panoul de administrare VAIAVITA</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card-premium p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="font-display text-2xl tracking-wide">
              {loading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Order Status */}
      <div className="space-y-4">
        <h2 className="font-display text-xl tracking-wide">Status comenzi</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {orderStatCards.map((stat, index) => (
            <div key={index} className="card-premium p-4 flex items-center gap-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="font-display text-xl">{loading ? '...' : stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {stats.lowStockProducts > 0 && (
        <div className="card-premium p-5 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-medium">Alertă stoc</p>
              <p className="text-sm text-muted-foreground">
                {stats.lowStockProducts} produse au stocul sub 10 unități
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
