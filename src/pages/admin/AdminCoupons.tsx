import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Loader2, Tag, Percent, Trash2, Edit, Copy, Package, FolderOpen, Globe, Mail, Hash } from 'lucide-react';

interface Coupon {
  id: string;
  coupon_number: number;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  scope: string;
  product_id: string | null;
  product_ids: string[] | null;
  category_id: string | null;
  allowed_email: string | null;
  review_id: string | null;
  products?: { name_ro: string } | null;
  categories?: { name_ro: string } | null;
}

interface Product {
  id: string;
  name_ro: string;
}

interface Category {
  id: string;
  name_ro: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'review' | 'general'>('all');

  // Filter coupons based on selected filter
  const filteredCoupons = coupons.filter(coupon => {
    if (filter === 'review') return coupon.review_id !== null;
    if (filter === 'general') return coupon.review_id === null;
    return true;
  });

  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_value: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
    scope: 'all',
    product_ids: [] as string[],
    category_id: '',
    allowed_email: '',
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        products:product_id(name_ro),
        categories:category_id(name_ro)
      `)
      .order('coupon_number', { ascending: false });

    if (error) {
      toast.error('Eroare la încărcarea cupoanelor');
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name_ro')
      .eq('status', 'active')
      .order('name_ro');
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name_ro')
      .order('name_ro');
    setCategories(data || []);
  };

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
      scope: 'all',
      product_ids: [],
      category_id: '',
      allowed_email: '',
    });
    setEditingCoupon(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    
    // Handle product_ids - merge old product_id with new product_ids array
    let productIds: string[] = [];
    if (coupon.product_ids && coupon.product_ids.length > 0) {
      productIds = coupon.product_ids;
    } else if (coupon.product_id) {
      productIds = [coupon.product_id];
    }
    
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active ?? true,
      scope: coupon.scope || 'all',
      product_ids: productIds,
      category_id: coupon.category_id || '',
      allowed_email: coupon.allowed_email || '',
    });
    setDialogOpen(true);
  };

  const saveCoupon = async () => {
    if (!form.code || form.discount_value <= 0) {
      toast.error('Completează codul și valoarea reducerii');
      return;
    }

    if (form.scope === 'products' && form.product_ids.length === 0) {
      toast.error('Selectează cel puțin un produs');
      return;
    }

    if (form.scope === 'category' && !form.category_id) {
      toast.error('Selectează o categorie');
      return;
    }

    setSaving(true);

    const couponData = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
      scope: form.scope,
      product_id: form.scope === 'products' && form.product_ids.length === 1 ? form.product_ids[0] : null,
      product_ids: form.scope === 'products' ? form.product_ids : [],
      category_id: form.scope === 'category' ? form.category_id : null,
      allowed_email: form.allowed_email.trim().toLowerCase() || null,
    };

    let error;
    if (editingCoupon) {
      ({ error } = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', editingCoupon.id));
    } else {
      ({ error } = await supabase
        .from('coupons')
        .insert([couponData]));
    }

    if (error) {
      toast.error('Eroare la salvare');
    } else {
      toast.success(editingCoupon ? 'Cupon actualizat' : 'Cupon creat');
      fetchCoupons();
      setDialogOpen(false);
      resetForm();
    }

    setSaving(false);
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest cupon?')) return;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Eroare la ștergere');
    } else {
      toast.success('Cupon șters');
      fetchCoupons();
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);

    if (error) {
      toast.error('Eroare la actualizare');
    } else {
      fetchCoupons();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Cod copiat');
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ro-RO');
  };

  const getScopeLabel = (coupon: Coupon) => {
    if (coupon.scope === 'products' || coupon.scope === 'product') {
      // Multiple products
      if (coupon.product_ids && coupon.product_ids.length > 1) {
        return `${coupon.product_ids.length} produse`;
      }
      // Single product
      if (coupon.products) {
        return coupon.products.name_ro;
      }
      // Fallback to product_ids
      if (coupon.product_ids && coupon.product_ids.length === 1) {
        const prod = products.find(p => p.id === coupon.product_ids![0]);
        return prod?.name_ro || 'Produs selectat';
      }
      return 'Produse selectate';
    }
    if (coupon.scope === 'category' && coupon.categories) {
      return coupon.categories.name_ro;
    }
    return 'Toate produsele';
  };

  const getScopeIcon = (scope: string) => {
    if (scope === 'product' || scope === 'products') return <Package className="w-3 h-3" />;
    if (scope === 'category') return <FolderOpen className="w-3 h-3" />;
    return <Globe className="w-3 h-3" />;
  };

  const toggleProductSelection = (productId: string) => {
    setForm(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Cupoane</h1>
          <p className="text-muted-foreground mt-1">Gestionează cupoanele de reducere</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Adaugă cupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Total cupoane</p>
          <p className="text-2xl font-bold">{coupons.length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Cupoane active</p>
          <p className="text-2xl font-bold text-green-600">{coupons.filter(c => c.is_active).length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Cupoane review</p>
          <p className="text-2xl font-bold text-purple-600">{coupons.filter(c => c.review_id !== null).length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Utilizări totale</p>
          <p className="text-2xl font-bold">{coupons.reduce((acc, c) => acc + (c.uses_count || 0), 0)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toate ({coupons.length})
        </Button>
        <Button 
          variant={filter === 'review' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('review')}
          className={filter === 'review' ? '' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}
        >
          Cupoane review ({coupons.filter(c => c.review_id !== null).length})
        </Button>
        <Button 
          variant={filter === 'general' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('general')}
        >
          Cupoane generale ({coupons.filter(c => c.review_id === null).length})
        </Button>
      </div>

      {/* Info Box */}
      <div className="card-premium p-4 bg-primary/5 border-primary/20">
        <h3 className="font-medium mb-2">Cum funcționează cupoanele:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Toate produsele</strong> - Cuponul se aplică la orice produs din coș</li>
          <li>• <strong>Produse specifice</strong> - Selectezi unul sau mai multe produse pentru care se aplică reducerea</li>
          <li>• <strong>Categorie</strong> - Cuponul se aplică doar produselor din categoria selectată</li>
          <li>• <strong>Email restricționat</strong> - Cuponul funcționează doar pentru un anumit email (pentru cupoane de review)</li>
          <li>• <strong>Nr. max utilizări</strong> - Câte ori poate fi folosit cuponul în total (nelimitat dacă e gol)</li>
        </ul>
      </div>

      {/* Coupons List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="card-premium p-8 text-center text-muted-foreground">
            {filter === 'all' ? 'Nu există cupoane' : filter === 'review' ? 'Nu există cupoane de review' : 'Nu există cupoane generale'}
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div key={coupon.id} className={`card-premium p-5 ${!coupon.is_active ? 'opacity-60' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${coupon.discount_type === 'percentage' ? 'bg-primary/10' : 'bg-green-500/10'}`}>
                    {coupon.discount_type === 'percentage' ? (
                      <Percent className="w-6 h-6 text-primary" />
                    ) : (
                      <Tag className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        <Hash className="w-3 h-3 inline" />{coupon.coupon_number}
                      </span>
                      <code className="font-mono font-bold text-lg">{coupon.code}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(coupon.code)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{coupon.description || 'Fără descriere'}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} lei`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 flex items-center gap-1">
                        {getScopeIcon(coupon.scope)}
                        {getScopeLabel(coupon)}
                      </span>
                      {coupon.allowed_email && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {coupon.allowed_email}
                        </span>
                      )}
                      {coupon.min_order_value && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Min. {coupon.min_order_value} lei
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {coupon.uses_count || 0}{coupon.max_uses ? `/${coupon.max_uses}` : ''} utilizări
                      </span>
                      {coupon.valid_until && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Până la {formatDate(coupon.valid_until)}
                        </span>
                      )}
                      {coupon.review_id && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                          Review
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch 
                    checked={coupon.is_active ?? false} 
                    onCheckedChange={() => toggleActive(coupon)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteCoupon(coupon.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCoupon ? 'Editează cupon' : 'Adaugă cupon'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cod cupon *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="ex: VARA2024"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Descriere</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="ex: Reducere de vară"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tip reducere</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Procent (%)</SelectItem>
                    <SelectItem value="fixed">Sumă fixă (lei)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valoare *</Label>
                <Input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                  placeholder={form.discount_type === 'percentage' ? '10' : '20'}
                />
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <Label>Se aplică pentru</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v, product_ids: [], category_id: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Toate produsele
                    </div>
                  </SelectItem>
                  <SelectItem value="products">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Produse specifice
                    </div>
                  </SelectItem>
                  <SelectItem value="category">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Categorie
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multiple Products Selection */}
            {form.scope === 'products' && (
              <div className="space-y-2">
                <Label>Selectează produsele * ({form.product_ids.length} selectate)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                        form.product_ids.includes(product.id) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <Checkbox 
                        checked={form.product_ids.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <span className="text-sm">{product.name_ro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Selection */}
            {form.scope === 'category' && (
              <div className="space-y-2">
                <Label>Selectează categoria *</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alege o categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(category => category.id).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name_ro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Allowed Email */}
            <div className="space-y-2">
              <Label>Email restricționat (opțional)</Label>
              <Input
                type="email"
                value={form.allowed_email}
                onChange={(e) => setForm({ ...form, allowed_email: e.target.value })}
                placeholder="email@exemplu.com"
              />
              <p className="text-xs text-muted-foreground">
                Dacă completezi, cuponul va funcționa doar pentru acest email
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comandă minimă (lei)</Label>
                <Input
                  type="number"
                  value={form.min_order_value}
                  onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Nr. max utilizări</Label>
                <Input
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Nelimitat"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid de la</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid până la</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={form.is_active} 
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Cupon activ</Label>
            </div>

            <Button onClick={saveCoupon} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCoupon ? 'Salvează' : 'Creează cupon'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
