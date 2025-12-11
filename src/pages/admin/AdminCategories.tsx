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
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Package } from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  description_ro: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  product_count?: number;
}

const emptyCategory = {
  slug: '',
  name_ro: '',
  name_en: '',
  description_ro: '',
  description_en: '',
  sort_order: 0,
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    // Get categories with product count
    const { data: categoriesData, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Eroare la încărcarea categoriilor');
      setLoading(false);
      return;
    }

    // Get product counts per category
    const { data: productCounts } = await supabase
      .from('products')
      .select('category_id')
      .not('category_id', 'is', null);

    const countMap: Record<string, number> = {};
    (productCounts || []).forEach(p => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    const categoriesWithCount = (categoriesData || []).map(cat => ({
      ...cat,
      product_count: countMap[cat.id] || 0
    }));

    setCategories(categoriesWithCount);
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm(emptyCategory);
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setForm({
      slug: category.slug,
      name_ro: category.name_ro,
      name_en: category.name_en,
      description_ro: category.description_ro || '',
      description_en: category.description_en || '',
      sort_order: category.sort_order || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ro || !form.slug) {
      toast.error('Completează câmpurile obligatorii');
      return;
    }

    setSaving(true);

    try {
      let nameEn = form.name_en;
      let descriptionEn = form.description_en;

      // Auto-translate if English fields are empty
      if (!nameEn || (!descriptionEn && form.description_ro)) {
        const textsToTranslate: Record<string, string> = {};
        if (!nameEn && form.name_ro) textsToTranslate.name = form.name_ro;
        if (!descriptionEn && form.description_ro) textsToTranslate.description = form.description_ro;

        if (Object.keys(textsToTranslate).length > 0) {
          toast.info('Se traduce automat în engleză...');
          
          const { data: translationData, error: translationError } = await supabase.functions.invoke('translate-text', {
            body: { texts: textsToTranslate, sourceLanguage: 'ro', targetLanguage: 'en' }
          });

          if (!translationError && translationData?.translations) {
            if (translationData.translations.name && !nameEn) {
              nameEn = translationData.translations.name;
            }
            if (translationData.translations.description && !descriptionEn) {
              descriptionEn = translationData.translations.description;
            }
          }
        }
      }

      const categoryData = {
        slug: form.slug,
        name_ro: form.name_ro,
        name_en: nameEn || form.name_ro,
        description_ro: form.description_ro || null,
        description_en: descriptionEn || form.description_ro || null,
        sort_order: form.sort_order,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Categorie actualizată');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        toast.success('Categorie creată');
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      toast.error(`Nu poți șterge categoria - are ${productCount} produse asociate`);
      return;
    }

    if (!confirm('Ești sigur că vrei să ștergi această categorie?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Eroare la ștergere');
    } else {
      toast.success('Categorie ștearsă');
      fetchCategories();
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Categorii</h1>
          <p className="text-muted-foreground mt-1">Gestionează categoriile de produse</p>
        </div>
        <Button variant="hero" onClick={openCreateDialog}>
          <Plus className="w-5 h-5 mr-2" />
          Adaugă categorie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Total categorii</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Produse categorizate</p>
          <p className="text-2xl font-bold text-primary">
            {categories.reduce((acc, c) => acc + (c.product_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : categories.length === 0 ? (
          <div className="card-premium p-8 text-center text-muted-foreground">
            Nu există categorii. Creează prima categorie!
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="card-premium p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{category.name_ro}</h3>
                    <p className="text-sm text-muted-foreground">{category.name_en}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {category.product_count || 0} produse
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{category.slug}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category.id, category.product_count || 0)}
                  >
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCategory ? 'Editează categorie' : 'Adaugă categorie'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume (RO) *</Label>
              <Input
                value={form.name_ro}
                onChange={(e) => setForm({ ...form, name_ro: e.target.value })}
                placeholder="Ex: Îngrijire dentară"
              />
            </div>

            <div className="space-y-2">
              <Label>Nume (EN)</Label>
              <Input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                placeholder="Ex: Dental care"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (URL) *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="ingrijire-dentara"
              />
            </div>

            <div className="space-y-2">
              <Label>Descriere (RO)</Label>
              <Textarea
                value={form.description_ro}
                onChange={(e) => setForm({ ...form, description_ro: e.target.value })}
                rows={2}
                placeholder="Descriere pentru SEO"
              />
            </div>

            <div className="space-y-2">
              <Label>Descriere (EN)</Label>
              <Textarea
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                rows={2}
                placeholder="SEO description"
              />
            </div>

            <div className="space-y-2">
              <Label>Ordine afișare</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
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
                editingCategory ? 'Salvează' : 'Creează'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
