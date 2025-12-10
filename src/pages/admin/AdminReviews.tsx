import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Loader2, Star, Check, X, Trash2, Eye, ShieldCheck, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name_ro: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name_ro')
      .order('name_ro');
    setProducts(data || []);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Eroare la încărcarea recenziilor');
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const approveReview = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      toast.error('Eroare la aprobare');
    } else {
      toast.success('Recenzie aprobată');
      fetchReviews();
    }
  };

  const rejectReview = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: false })
      .eq('id', id);

    if (error) {
      toast.error('Eroare');
    } else {
      toast.success('Recenzie respinsă');
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această recenzie?')) return;
    
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Eroare la ștergere');
    } else {
      toast.success('Recenzie ștearsă');
      fetchReviews();
      setDialogOpen(false);
    }
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name_ro || 'Produs necunoscut';
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      review.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      (review.content?.toLowerCase().includes(search.toLowerCase()) || false) ||
      getProductName(review.product_id).toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && !review.is_approved) ||
      (filter === 'approved' && review.is_approved);
    
    const matchesProduct = productFilter === 'all' || review.product_id === productFilter;
    
    return matchesSearch && matchesFilter && matchesProduct;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const exportReviews = () => {
    const headers = ['Data', 'Produs', 'Client', 'Email', 'Rating', 'Titlu', 'Conținut', 'Verificat', 'Aprobat'];
    const rows = filteredReviews.map(r => [
      formatDate(r.created_at),
      getProductName(r.product_id),
      r.customer_name,
      r.customer_email,
      r.rating.toString(),
      r.title || '',
      r.content || '',
      r.is_verified_purchase ? 'Da' : 'Nu',
      r.is_approved ? 'Da' : 'Nu'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recenzii_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export realizat cu succes');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Recenzii</h1>
          <p className="text-muted-foreground mt-1">Gestionează recenziile produselor</p>
        </div>
        <Button variant="outline" onClick={exportReviews}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Total recenzii</p>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Rating mediu</p>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <p className="text-2xl font-bold">{avgRating}</p>
          </div>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">Aprobate</p>
          <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.is_approved).length}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-sm text-muted-foreground">În așteptare</p>
          <p className="text-2xl font-bold text-yellow-600">{reviews.filter(r => !r.is_approved).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Caută recenzii sau produse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-full lg:w-[250px]">
            <SelectValue placeholder="Filtrează după produs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate produsele</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name_ro}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toate
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('pending')}
          >
            În așteptare
          </Button>
          <Button 
            variant={filter === 'approved' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('approved')}
          >
            Aprobate
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="card-premium p-8 text-center text-muted-foreground">
            Nu există recenzii
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="card-premium p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} 
                        />
                      ))}
                    </div>
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Cumpărător verificat
                      </span>
                    )}
                    {!review.is_approved && (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        În așteptare
                      </span>
                    )}
                  </div>
                  
                  {review.title && (
                    <h3 className="font-medium">{review.title}</h3>
                  )}
                  
                  {review.content && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{review.content}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{review.customer_name}</span>
                    <span>•</span>
                    <span>{formatDate(review.created_at)}</span>
                    <span>•</span>
                    <span className="text-primary">{getProductName(review.product_id)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!review.is_approved && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 border-green-600/20 hover:bg-green-500/10"
                      onClick={() => approveReview(review.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprobă
                    </Button>
                  )}
                  {review.is_approved && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => rejectReview(review.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Respinge
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setSelectedReview(review);
                      setDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Detalii recenzie</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < selectedReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} 
                  />
                ))}
              </div>

              <div className="space-y-1">
                <p className="font-medium">{selectedReview.customer_name}</p>
                <p className="text-sm text-muted-foreground">{selectedReview.customer_email}</p>
                <p className="text-sm text-muted-foreground">{formatDate(selectedReview.created_at)}</p>
              </div>

              {selectedReview.title && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Titlu</h4>
                  <p>{selectedReview.title}</p>
                </div>
              )}

              {selectedReview.content && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Conținut</h4>
                  <p className="text-sm">{selectedReview.content}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-border">
                {!selectedReview.is_approved ? (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      approveReview(selectedReview.id);
                      setDialogOpen(false);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprobă
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      rejectReview(selectedReview.id);
                      setDialogOpen(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Respinge
                  </Button>
                )}
                <Button 
                  variant="destructive"
                  onClick={() => deleteReview(selectedReview.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Șterge
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
