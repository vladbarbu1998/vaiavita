import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Search, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

interface Locker {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  postal_code: string;
  lat: number;
  lng: number;
  courier: string;
}

interface LockerSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLocker: (locker: { id: string; name: string; address: string }) => void;
  selectedLockerId?: string;
}

export const LockerSelector: React.FC<LockerSelectorProps> = ({
  open,
  onOpenChange,
  onSelectLocker,
  selectedLockerId,
}) => {
  const { language } = useLanguage();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);

  const t = {
    title: language === 'ro' ? 'Selectează punctul de livrare' : 'Select delivery point',
    search: language === 'ro' ? 'Caută după oraș, adresă sau nume...' : 'Search by city, address or name...',
    loading: language === 'ro' ? 'Se încarcă punctele de livrare...' : 'Loading delivery points...',
    error: language === 'ro' ? 'Eroare la încărcarea punctelor' : 'Error loading points',
    noResults: language === 'ro' ? 'Niciun rezultat găsit' : 'No results found',
    select: language === 'ro' ? 'Selectează' : 'Select',
    confirm: language === 'ro' ? 'Confirmă selecția' : 'Confirm selection',
    cancel: language === 'ro' ? 'Anulează' : 'Cancel',
    lockers: language === 'ro' ? 'puncte de livrare' : 'delivery points',
  };

  useEffect(() => {
    if (open && lockers.length === 0) {
      fetchLockers();
    }
  }, [open]);

  const fetchLockers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-ecolet-lockers', {
        body: { countryCode: 'RO' },
      });

      if (fnError) throw fnError;
      
      if (data?.success && data?.lockers) {
        setLockers(data.lockers);
      } else {
        throw new Error(data?.error || 'Failed to fetch lockers');
      }
    } catch (err) {
      console.error('Error fetching lockers:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLockers = useMemo(() => {
    if (!searchQuery.trim()) return lockers;
    
    const query = searchQuery.toLowerCase();
    return lockers.filter(locker => 
      locker.name.toLowerCase().includes(query) ||
      locker.address.toLowerCase().includes(query) ||
      locker.city.toLowerCase().includes(query) ||
      locker.county.toLowerCase().includes(query) ||
      locker.postal_code.includes(query)
    );
  }, [lockers, searchQuery]);

  const handleSelectLocker = (locker: Locker) => {
    setSelectedLocker(locker);
  };

  const handleConfirm = () => {
    if (selectedLocker) {
      onSelectLocker({
        id: selectedLocker.id,
        name: selectedLocker.name,
        address: `${selectedLocker.address}, ${selectedLocker.city}, ${selectedLocker.county}`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <X className="h-8 w-8 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchLockers}>
              {language === 'ro' ? 'Reîncearcă' : 'Retry'}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {filteredLockers.length} {t.lockers}
            </p>
            
            <ScrollArea className="flex-1 h-[400px] pr-4">
              <div className="space-y-2">
                {filteredLockers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">{t.noResults}</p>
                ) : (
                  filteredLockers.map((locker) => (
                    <div
                      key={locker.id}
                      onClick={() => handleSelectLocker(locker)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedLocker?.id === locker.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium truncate">{locker.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {locker.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {locker.city}, {locker.county} {locker.postal_code && `• ${locker.postal_code}`}
                          </p>
                        </div>
                        {selectedLocker?.id === locker.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {t.cancel}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedLocker}
            className="flex-1"
          >
            {t.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
