import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  description_ro: string | null;
  description_en: string | null;
  short_description_ro: string | null;
  short_description_en: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  status: string;
  featured: boolean;
  category_id: string | null;
  tags: string[];
  images: string[];
  created_at: string;
}

const emptyProduct = {
  slug: '',
  name_ro: '',
  name_en: '',
  description_ro: '',
  description_en: '',
  short_description_ro: '',
  short_description_en: '',
  price: 0,
  compare_at_price: null as number | null,
  stock: 0,
  sku: '',
  status: 'active',
  featured: false,
  category_id: null as string | null,
  tags: [] as string[],
  images: [] as string[],
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Eroare la încărcarea produselor');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({
      slug: product.slug,
      name_ro: product.name_ro,
      name_en: product.name_en,
      description_ro: product.description_ro || '',
      description_en: product.description_en || '',
      short_description_ro: product.short_description_ro || '',
      short_description_en: product.short_description_en || '',
      price: product.price,
      compare_at_price: product.compare_at_price,
      stock: product.stock,
      sku: product.sku || '',
      status: product.status,
      featured: product.featured,
      category_id: product.category_id,
      tags: product.tags || [],
      images: product.images || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ro || !form.slug || form.price <= 0) {
      toast.error('Completează câmpurile obligatorii');
      return;
    }

    setSaving(true);

    const productData = {
      ...form,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock),
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produs actualizat');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Produs creat');
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest produs?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Eroare la ștergere');
    } else {
      toast.success('Produs șters');
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name_ro.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    inactive: 'bg-gray-500/10 text-gray-600',
    coming_soon: 'bg-yellow-500/10 text-yellow-600',
  };

  const statusLabels: Record<string, string> = {
    active: 'Activ',
    inactive: 'Inactiv',
    coming_soon: 'În curând',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Produse</h1>
          <p className="text-muted-foreground mt-1">Gestionează catalogul de produse</p>
        </div>
        <Button variant="hero" onClick={openCreateDialog}>
          <Plus className="w-5 h-5 mr-2" />
          Adaugă produs
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Caută produse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produs</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Preț</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stoc</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nu există produse
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name_ro}</p>
                          <p className="text-sm text-muted-foreground">{product.sku || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{Number(product.price).toFixed(2)} lei</p>
                      {product.compare_at_price && (
                        <p className="text-sm text-muted-foreground line-through">
                          {Number(product.compare_at_price).toFixed(2)} lei
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={product.stock < 10 ? 'text-red-500 font-medium' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[product.status]}`}>
                        {statusLabels[product.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProduct ? 'Editează produs' : 'Adaugă produs nou'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nume (RO) *</Label>
                <Input
                  value={form.name_ro}
                  onChange={(e) => setForm({ ...form, name_ro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nume (EN)</Label>
                <Input
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug (URL) *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="pasta-dinti-fresh"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descriere scurtă (RO)</Label>
              <Textarea
                value={form.short_description_ro}
                onChange={(e) => setForm({ ...form, short_description_ro: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Descriere completă (RO)</Label>
              <Textarea
                value={form.description_ro}
                onChange={(e) => setForm({ ...form, description_ro: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Preț (lei) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preț vechi (lei)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.compare_at_price || ''}
                  onChange={(e) => setForm({ ...form, compare_at_price: parseFloat(e.target.value) || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stoc</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="inactive">Inactiv</SelectItem>
                    <SelectItem value="coming_soon">În curând</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Produs vedeta</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={form.featured}
                    onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.featured ? 'Da' : 'Nu'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se salvează...
                </>
              ) : (
                editingProduct ? 'Salvează' : 'Creează'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
