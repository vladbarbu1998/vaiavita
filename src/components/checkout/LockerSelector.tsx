import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Loader2, Package, CheckCircle2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Locker {
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
  onSelectLocker: (locker: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
    lat: number;
    lng: number;
  }) => void;
  selectedLockerId?: string;
}

// Romanian major cities for quick filter
const ROMANIAN_CITIES = [
  'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 
  'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești',
  'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare',
  'Râmnicu Vâlcea', 'Drobeta-Turnu Severin', 'Suceava', 'Piatra Neamț', 'Târgu Jiu',
  'Târgoviște', 'Focșani', 'Bistrița', 'Reșița', 'Tulcea', 'Călărași', 'Giurgiu',
  'Alba Iulia', 'Deva', 'Hunedoara', 'Zalău', 'Sfântu Gheorghe', 'Slobozia',
  'Vaslui', 'Roman', 'Turda', 'Mediaș', 'Lugoj', 'Onești', 'Sighișoara'
];

// Lazy load the map component
const LockerMap = lazy(() => import('./LockerMap'));

export function LockerSelector({ open, onOpenChange, onSelectLocker, selectedLockerId }: LockerSelectorProps) {
  const { language } = useLanguage();
  const [allLockers, setAllLockers] = useState<Locker[]>([]);
  const [filteredLockers, setFilteredLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.9432, 24.9668]); // Romania center
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);

  // Load all lockers when dialog opens
  useEffect(() => {
    if (open && allLockers.length === 0) {
      loadAllLockers();
    }
  }, [open]);

  const loadAllLockers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: lockersError } = await supabase.functions.invoke('get-ecolet-lockers', {
        body: { countryCode: 'RO' }
      });

      if (lockersError) throw lockersError;

      const fetchedLockers = data?.lockers || [];
      setAllLockers(fetchedLockers);
      setFilteredLockers(fetchedLockers);

      if (fetchedLockers.length === 0) {
        setError(language === 'ro' 
          ? 'Nu am găsit niciun punct de livrare' 
          : 'No delivery points found');
      }
    } catch (err) {
      console.error('Error loading lockers:', err);
      setError(language === 'ro' ? 'Eroare la încărcarea punctelor de livrare' : 'Error loading delivery points');
    } finally {
      setLoading(false);
    }
  };

  // Filter lockers based on search query, city, and map bounds
  useEffect(() => {
    let filtered = allLockers;

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(locker => 
        locker.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(locker =>
        locker.name.toLowerCase().includes(query) ||
        locker.address.toLowerCase().includes(query) ||
        locker.city.toLowerCase().includes(query) ||
        locker.postal_code.includes(query)
      );
    }

    // Filter by map bounds if available and no city/search filter
    if (mapBounds && !selectedCity && !searchQuery.trim()) {
      const [[south, west], [north, east]] = mapBounds;
      filtered = filtered.filter(locker =>
        locker.lat >= south && locker.lat <= north &&
        locker.lng >= west && locker.lng <= east
      );
    }

    // Limit to 300 for performance
    setFilteredLockers(filtered.slice(0, 300));
  }, [allLockers, selectedCity, searchQuery, mapBounds]);

  // When city changes, center map on that city
  useEffect(() => {
    if (selectedCity && allLockers.length > 0) {
      const cityLocker = allLockers.find(l => 
        l.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
      if (cityLocker) {
        setMapCenter([cityLocker.lat, cityLocker.lng]);
      }
    }
  }, [selectedCity, allLockers]);

  const handleSelectLocker = useCallback((locker: Locker) => {
    setSelectedLocker(locker);
    setMapCenter([locker.lat, locker.lng]);
  }, []);

  const handleMapBoundsChange = useCallback((bounds: [[number, number], [number, number]]) => {
    setMapBounds(bounds);
  }, []);

  const handleConfirm = () => {
    if (selectedLocker) {
      onSelectLocker({
        id: selectedLocker.id,
        name: selectedLocker.name,
        address: selectedLocker.address,
        city: selectedLocker.city,
        postal_code: selectedLocker.postal_code,
        lat: selectedLocker.lat,
        lng: selectedLocker.lng,
      });
      onOpenChange(false);
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedCity('');
      setSelectedLocker(null);
      setMapBounds(null);
      setMapCenter([45.9432, 24.9668]);
    }
  }, [open]);

  // Get unique cities from lockers for dropdown
  const availableCities = React.useMemo(() => {
    const cities = new Set(allLockers.map(l => l.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [allLockers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>
            {language === 'ro' ? 'Selectează punctul de livrare' : 'Select delivery point'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Search and filter bar */}
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-2 flex-wrap">
            {/* City dropdown */}
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={cityOpen}
                  className="w-[200px] justify-between"
                >
                  {selectedCity || (language === 'ro' ? 'Selectează oraș...' : 'Select city...')}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 z-[100]" align="start">
                <Command>
                  <CommandInput placeholder={language === 'ro' ? 'Caută oraș...' : 'Search city...'} />
                  <CommandList>
                    <CommandEmpty>{language === 'ro' ? 'Niciun oraș găsit' : 'No city found'}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          setSelectedCity('');
                          setCityOpen(false);
                        }}
                      >
                        {language === 'ro' ? 'Toate orașele' : 'All cities'}
                      </CommandItem>
                      {availableCities.map((city) => (
                        <CommandItem
                          key={city}
                          value={city}
                          onSelect={(value) => {
                            setSelectedCity(value);
                            setCityOpen(false);
                          }}
                        >
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ro' 
                  ? 'Caută după nume locker, adresă, cod poștal...' 
                  : 'Search by locker name, address, postal code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <p className="text-xs text-muted-foreground">
            {loading 
              ? (language === 'ro' ? 'Se încarcă...' : 'Loading...') 
              : `${filteredLockers.length} ${language === 'ro' ? 'puncte de livrare' : 'delivery points'}`
            }
          </p>
        </div>

        {/* Main content - split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - List */}
          <div className="w-2/5 border-r overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLockers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  {language === 'ro' 
                    ? 'Nu am găsit puncte de livrare. Încearcă altă căutare sau mută harta.' 
                    : 'No delivery points found. Try another search or move the map.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredLockers.map((locker) => (
                  <button
                    key={locker.id}
                    onClick={() => handleSelectLocker(locker)}
                    className={`w-full p-3 text-left hover:bg-accent/50 transition-colors ${
                      selectedLocker?.id === locker.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {selectedLocker?.id === locker.id ? (
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{locker.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {locker.address}{locker.postal_code ? `, ${locker.postal_code}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground opacity-70">
                          {locker.city}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right - Map */}
          <div className="w-3/5 relative bg-muted">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <LockerMap 
                lockers={filteredLockers}
                selectedLocker={selectedLocker}
                mapCenter={mapCenter}
                onSelectLocker={handleSelectLocker}
                onBoundsChange={handleMapBoundsChange}
              />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-background">
          <div className="text-sm text-muted-foreground">
            {selectedLocker && (
              <span>
                <strong>{language === 'ro' ? 'Selectat:' : 'Selected:'}</strong> {selectedLocker.name}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {language === 'ro' ? 'Anulează' : 'Cancel'}
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedLocker}>
              {language === 'ro' ? 'Confirmă selecția' : 'Confirm selection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
