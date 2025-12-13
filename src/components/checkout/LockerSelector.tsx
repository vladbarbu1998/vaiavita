import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Loader2, Package, CheckCircle2, ChevronDown, Crosshair, Filter, X, Clock } from 'lucide-react';
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
  schedule?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  };
}

// Courier types available
export const COURIERS = [
  { id: 'easybox', name: 'EasyBox', color: '#8B5CF6' },
  { id: 'dpd', name: 'DPD', color: '#DC2626' },
  { id: 'cargus', name: 'Cargus', color: '#F59E0B' },
  { id: 'fan', name: 'FAN Courier', color: '#3B82F6' },
  { id: 'gls', name: 'GLS', color: '#10B981' },
  { id: 'sameday', name: 'Sameday', color: '#EC4899' },
] as const;

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCouriers, setActiveCouriers] = useState<string[]>(COURIERS.map(c => c.id));
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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

  // Filter lockers based on search query, city, couriers, and map bounds
  useEffect(() => {
    let filtered = allLockers;

    // Filter by active couriers
    if (activeCouriers.length < COURIERS.length) {
      filtered = filtered.filter(locker => {
        const courierLower = (locker.courier || '').toLowerCase();
        return activeCouriers.some(c => courierLower.includes(c));
      });
    }

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

    // Limit to 500 for performance
    setFilteredLockers(filtered.slice(0, 500));
  }, [allLockers, selectedCity, searchQuery, mapBounds, activeCouriers]);

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

  // Geolocation - Locate user
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError(language === 'ro' ? 'Geolocația nu este disponibilă' : 'Geolocation not available');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setLocatingUser(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(language === 'ro' 
          ? 'Nu am putut obține locația. Verifică permisiunile.' 
          : 'Could not get location. Check permissions.');
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Toggle courier filter
  const toggleCourier = (courierId: string) => {
    setActiveCouriers(prev => {
      if (prev.includes(courierId)) {
        // Don't allow deselecting all
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== courierId);
      }
      return [...prev, courierId];
    });
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedCity('');
      setSelectedLocker(null);
      setMapBounds(null);
      setMapCenter([45.9432, 24.9668]);
      setFilterOpen(false);
      setUserLocation(null);
    }
  }, [open]);

  // Get unique cities from lockers for dropdown
  const availableCities = React.useMemo(() => {
    const cities = new Set(allLockers.map(l => l.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [allLockers]);

  // Get courier info
  const getCourierInfo = (courierName: string) => {
    const courierLower = (courierName || '').toLowerCase();
    return COURIERS.find(c => courierLower.includes(c.id)) || { id: 'other', name: courierName, color: '#6B7280' };
  };

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
                  className="w-[180px] justify-between"
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
                  ? 'Caută după nume, adresă, cod poștal...' 
                  : 'Search by name, address, postal code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter button */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={activeCouriers.length < COURIERS.length ? 'border-primary text-primary' : ''}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] z-[100]" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {language === 'ro' ? 'Filtrează punctele' : 'Filter points'}
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setFilterOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {COURIERS.map((courier) => (
                      <button
                        key={courier.id}
                        onClick={() => toggleCourier(courier.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                          activeCouriers.includes(courier.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: courier.color }}
                          />
                          <span className="font-medium">{courier.name}</span>
                        </div>
                        <div 
                          className={`w-10 h-6 rounded-full transition-colors relative ${
                            activeCouriers.includes(courier.id) ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              activeCouriers.includes(courier.id) ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Locate me button - text version */}
            <Button 
              variant="outline" 
              onClick={handleLocateMe}
              disabled={locatingUser}
              className="gap-2"
            >
              {locatingUser ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {language === 'ro' ? 'Localizează-mă' : 'Locate me'}
              </span>
            </Button>
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
                {filteredLockers.map((locker) => {
                  const courierInfo = getCourierInfo(locker.courier);
                  return (
                    <button
                      key={locker.id}
                      onClick={() => handleSelectLocker(locker)}
                      className={`w-full p-3 text-left hover:bg-accent/50 transition-colors ${
                        selectedLocker?.id === locker.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-2 h-2 rounded-full mt-2 shrink-0" 
                          style={{ backgroundColor: courierInfo.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{locker.name}</p>
                            {selectedLocker?.id === locker.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {locker.address}{locker.postal_code ? `, ${locker.postal_code}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ 
                                backgroundColor: `${courierInfo.color}20`,
                                color: courierInfo.color 
                              }}
                            >
                              {courierInfo.name}
                            </span>
                            <span className="text-xs text-muted-foreground opacity-70">
                              {locker.city}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right - Map and selected locker details */}
          <div className="w-3/5 flex flex-col">
            {/* Map */}
            <div className="flex-1 relative bg-muted">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <LockerMap 
                  lockers={filteredLockers}
                  selectedLocker={selectedLocker}
                  mapCenter={mapCenter}
                  userLocation={userLocation}
                  onSelectLocker={handleSelectLocker}
                  onBoundsChange={handleMapBoundsChange}
                />
              </Suspense>
            </div>

            {/* Selected locker details */}
            {selectedLocker && (
              <div className="border-t p-4 bg-background space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">{selectedLocker.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocker.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocker.postal_code} {selectedLocker.city}
                    </p>
                  </div>
                  <div 
                    className="px-2 py-1 rounded text-xs font-medium shrink-0"
                    style={{ 
                      backgroundColor: `${getCourierInfo(selectedLocker.courier).color}20`,
                      color: getCourierInfo(selectedLocker.courier).color 
                    }}
                  >
                    {getCourierInfo(selectedLocker.courier).name}
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-muted-foreground">
                    <p>{language === 'ro' ? 'Luni-Vineri' : 'Mon-Fri'}: 08:00 - 21:00</p>
                    <p>{language === 'ro' ? 'Sâmbătă' : 'Sat'}: 09:00 - 18:00</p>
                    <p>{language === 'ro' ? 'Duminică' : 'Sun'}: 10:00 - 16:00</p>
                  </div>
                </div>
              </div>
            )}
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
