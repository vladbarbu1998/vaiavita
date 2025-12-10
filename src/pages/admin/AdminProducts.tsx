import { useState, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, Upload, X, Image as ImageIcon, Languages } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error(`Eroare la încărcare: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setForm(prev => ({
        ...prev,
        images: [url, ...prev.images.slice(1)]
      }));
      toast.success('Imagine cover încărcată');
    }
    setUploading(false);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) {
        newImages.push(url);
      }
    }

    if (newImages.length > 0) {
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
      toast.success(`${newImages.length} imagini încărcate`);
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeCoverImage = () => {
    setForm(prev => ({
      ...prev,
      images: prev.images.slice(1)
    }));
  };

  const removeGalleryImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index + 1)
    }));
  };

  const translateToEnglish = async (texts: { name?: string; short_description?: string; description?: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-product', {
        body: { texts }
      });

      if (error) throw error;
      return data.translations || {};
    } catch (error: any) {
      console.error('Translation error:', error);
      return {};
    }
  };

  const handleSave = async () => {
    if (!form.name_ro || !form.slug || form.price <= 0) {
      toast.error('Completează câmpurile obligatorii');
      return;
    }

    setSaving(true);

    try {
      // Auto-translate Romanian fields to English if English fields are empty
      let translations = {
        name_en: form.name_en,
        short_description_en: form.short_description_en,
        description_en: form.description_en,
      };

      const needsTranslation = 
        (!form.name_en && form.name_ro) ||
        (!form.short_description_en && form.short_description_ro) ||
        (!form.description_en && form.description_ro);

      if (needsTranslation) {
        toast.info('Se traduce automat în engleză...');
        
        const textsToTranslate: { name?: string; short_description?: string; description?: string } = {};
        if (!form.name_en && form.name_ro) textsToTranslate.name = form.name_ro;
        if (!form.short_description_en && form.short_description_ro) textsToTranslate.short_description = form.short_description_ro;
        if (!form.description_en && form.description_ro) textsToTranslate.description = form.description_ro;

        const translatedTexts = await translateToEnglish(textsToTranslate);
        
        translations = {
          name_en: translatedTexts.name || form.name_en || form.name_ro,
          short_description_en: translatedTexts.short_description || form.short_description_en || form.short_description_ro || '',
          description_en: translatedTexts.description || form.description_en || form.description_ro || '',
        };
      }

      const productData = {
        ...form,
        ...translations,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        stock: Number(form.stock),
      };

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

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Activ', color: 'bg-green-500/10 text-green-600' },
    out_of_stock: { label: 'Stoc epuizat', color: 'bg-red-500/10 text-red-600' },
    inactive: { label: 'Inactiv', color: 'bg-gray-500/10 text-gray-600' },
    coming_soon: { label: 'În curând', color: 'bg-yellow-500/10 text-yellow-600' },
  };

  const coverImage = form.images[0] || null;
  const galleryImages = form.images.slice(1);

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
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[product.status]?.color || 'bg-gray-500/10 text-gray-600'}`}>
                        {statusConfig[product.status]?.label || product.status}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProduct ? 'Editează produs' : 'Adaugă produs nou'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cover Image */}
            <div className="space-y-3">
              <Label>Imagine principală (Cover)</Label>
              <div className="flex items-start gap-4">
                {coverImage ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border">
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                {coverImage && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Schimbă'}
                  </Button>
                )}
              </div>
            </div>

            {/* Gallery Images */}
            <div className="space-y-3">
              <Label>Galerie imagini</Label>
              <div className="flex flex-wrap gap-3">
                {galleryImages.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                    <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div 
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Adaugă</span>
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Se încarcă...
                </div>
              )}
            </div>

            {/* Romanian Fields */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  🇷🇴 Conținut în Română
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  Traducere automată la salvare
                </span>
              </div>

              <div className="space-y-2">
                <Label>Nume produs *</Label>
                <Input
                  value={form.name_ro}
                  onChange={(e) => setForm({ ...form, name_ro: e.target.value })}
                  placeholder="Ex: Pasta de dinți Dent-Tastic Fresh Mint"
                />
              </div>

              <div className="space-y-2">
                <Label>Descriere scurtă</Label>
                <Textarea
                  value={form.short_description_ro}
                  onChange={(e) => setForm({ ...form, short_description_ro: e.target.value })}
                  rows={2}
                  placeholder="Descriere scurtă pentru listări..."
                />
              </div>

              <div className="space-y-2">
                <Label>Descriere completă</Label>
                <Textarea
                  value={form.description_ro}
                  onChange={(e) => setForm({ ...form, description_ro: e.target.value })}
                  rows={4}
                  placeholder="Descriere detaliată a produsului..."
                />
              </div>
            </div>

            {/* English Preview (read-only or editable) */}
            {(form.name_en || form.short_description_en || form.description_en) && (
              <div className="space-y-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  🇬🇧 Traducere în Engleză
                </h3>
                {form.name_en && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nume</Label>
                    <p className="text-sm">{form.name_en}</p>
                  </div>
                )}
                {form.short_description_en && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descriere scurtă</Label>
                    <p className="text-sm">{form.short_description_en}</p>
                  </div>
                )}
                {form.description_en && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descriere</Label>
                    <p className="text-sm whitespace-pre-wrap">{form.description_en}</p>
                  </div>
                )}
              </div>
            )}

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
                <Label>Preț redus (lei)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.compare_at_price || ''}
                  onChange={(e) => setForm({ ...form, compare_at_price: parseFloat(e.target.value) || null })}
                  placeholder="Opțional"
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">✅ Activ</SelectItem>
                  <SelectItem value="out_of_stock">🚫 Stoc epuizat</SelectItem>
                  <SelectItem value="inactive">⏸️ Inactiv</SelectItem>
                  <SelectItem value="coming_soon">🔜 În curând</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="hero" onClick={handleSave} disabled={saving || uploading}>
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
