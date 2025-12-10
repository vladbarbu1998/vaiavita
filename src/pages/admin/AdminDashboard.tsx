import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Tag,
  Lock,
  FolderOpen,
  Sun,
  Moon,
  Globe,
  Coins,
  Home,
  Info,
  Phone
} from 'lucide-react';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency, currencies } from '@/context/CurrencyContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error || !roles || roles.length === 0) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setUserRole(roles[0].role);
      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserRole(null);
      } else if (event === 'SIGNED_IN' && session) {
        // Check admin role after sign in
        setTimeout(async () => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

          if (roles && roles.length > 0) {
            setUserRole(roles[0].role);
            setIsAuthenticated(true);
          } else {
            toast.error('Nu ai acces la admin');
            await supabase.auth.signOut();
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email sau parolă incorectă');
        } else {
          toast.error(error.message);
        }
      }
    } catch (error: any) {
      toast.error('Eroare la autentificare');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Prezentare generală', exact: true },
    { path: '/admin/products', icon: Package, label: 'Produse' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categorii' },
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

  const logo = theme === 'dark' ? logoDark : logoLight;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login form (not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <img src={logo} alt="VAIAVITA" className="h-12 mx-auto mb-6" />
            <h1 className="font-display text-2xl tracking-wide">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Autentifică-te pentru a continua</p>
          </div>

          {/* Login Form */}
          <div className="card-premium p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vaiavita.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parolă</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full" 
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Se autentifică...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Autentificare
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} VAIAVITA S.R.L. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    );
  }

  // Dashboard (authenticated)
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
      <main className="lg:ml-64 min-h-screen">
        {/* Site Header in Admin */}
        <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-background/90 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4 lg:px-6">
            {/* Site Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Home className="w-4 h-4" />
                {t('nav.home')}
              </Link>
              <Link to="/despre" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Info className="w-4 h-4" />
                {t('nav.about')}
              </Link>
              <Link to="/produse" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Package className="w-4 h-4" />
                {t('nav.products')}
              </Link>
              <Link to="/contact" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                {t('nav.contact')}
              </Link>
            </nav>
            
            <div className="md:hidden" />

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === 'ro' ? 'en' : 'ro')}
                className="relative rounded-full hover:bg-primary/10"
              >
                <Globe className="h-4 w-4" />
                <span className="absolute -bottom-0.5 right-0.5 text-[8px] font-bold uppercase text-primary">
                  {language}
                </span>
              </Button>

              {/* Currency Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full hover:bg-primary/10"
                  >
                    <Coins className="h-4 w-4" />
                    <span className="absolute -bottom-0.5 right-0.5 text-[8px] font-bold text-primary">
                      {currency === 'RON' ? 'lei' : currencies.find(c => c.code === currency)?.symbol}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currencies.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      onClick={() => setCurrency(c.code)}
                      className={currency === c.code ? 'bg-primary/10' : ''}
                    >
                      {c.symbol} {c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="rounded-full hover:bg-primary/10"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Admin Role & Logout */}
              <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-border">
                <span className="text-xs text-muted-foreground">
                  <span className="capitalize font-medium text-foreground">{userRole}</span>
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 px-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
