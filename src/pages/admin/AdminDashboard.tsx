import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Star, 
  Settings, 
  LogOut,
  Menu,
  X,
  Loader2,
  Tag
} from 'lucide-react';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/context/ThemeContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin/login');
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error || !roles || roles.length === 0) {
        toast.error('Nu ai acces la admin');
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setUserRole(roles[0].role);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Prezentare generală', exact: true },
    { path: '/admin/products', icon: Package, label: 'Produse' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Comenzi' },
    { path: '/admin/customers', icon: Users, label: 'Clienți' },
    { path: '/admin/reviews', icon: Star, label: 'Recenzii' },
    { path: '/admin/coupons', icon: Tag, label: 'Cupoane' },
    { path: '/admin/settings', icon: Settings, label: 'Setări' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const logo = theme === 'dark' ? logoDark : logoLight;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-4">
        <img src={logo} alt="VAIAVITA" className="h-8" />
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border z-50
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <img src={logo} alt="VAIAVITA" className="h-8" />
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Site
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive(item.path, item.exact) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-3 px-4">
              Rol: <span className="capitalize font-medium text-foreground">{userRole}</span>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Deconectare
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
