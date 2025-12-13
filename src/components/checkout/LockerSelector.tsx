import React, { useState, useCallback, useEffect, lazy, Suspense, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Loader2, Package, CheckCircle2, Crosshair, Filter, X, Clock, ChevronsUpDown, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

// Courier types available (with logo paths)
export const COURIERS = [
  { id: 'dpd', name: 'DPD', color: '#DC2626', logo: '/couriers/dpd.png' },
  { id: 'cargus', name: 'Cargus', color: '#F59E0B', logo: '/couriers/cargus.png' },
  { id: 'fan', name: 'FAN Courier', color: '#3B82F6', logo: '/couriers/fan.png' },
  { id: 'gls', name: 'GLS', color: '#10B981', logo: '/couriers/gls.png' },
  { id: 'sameday', name: 'Sameday', color: '#EC4899', logo: '/couriers/sameday.png' },
] as const;

// Static list of Romanian counties for instant dropdown
const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Arges', 'Bacau', 'Bihor', 'Bistrita-Nasaud', 'Botosani', 'Braila',
  'Brasov', 'Bucuresti', 'Buzau', 'Calarasi', 'Caras-Severin', 'Cluj', 'Constanta',
  'Covasna', 'Dambovita', 'Dolj', 'Galati', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
  'Ialomita', 'Iasi', 'Ilfov', 'Maramures', 'Mehedinti', 'Mures', 'Neamt', 'Olt',
  'Prahova', 'Salaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timis', 'Tulcea',
  'Valcea', 'Vaslui', 'Vrancea'
];

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

// Preload cache for lockers
let cachedLockers: Locker[] | null = null;
let isPreloading = false;

export async function preloadLockers() {
  if (cachedLockers || isPreloading) return cachedLockers;
  
  isPreloading = true;
  try {
    const { data, error } = await supabase.functions.invoke('get-ecolet-lockers', {
      body: { countryCode: 'RO' }
    });
    if (!error && data?.lockers) {
      cachedLockers = data.lockers;
    }
  } catch (err) {
    console.error('Preload lockers error:', err);
  } finally {
    isPreloading = false;
  }
  return cachedLockers;
}

export function LockerSelector({ open, onOpenChange, onSelectLocker, selectedLockerId }: LockerSelectorProps) {
  const { language } = useLanguage();
  const [visibleLockers, setVisibleLockers] = useState<Locker[]>([]); // Lockers currently visible on map and list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.9432, 24.9668]); // Romania center
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [currentZoom, setCurrentZoom] = useState<number>(7); // Track actual map zoom for list visibility
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCouriers, setActiveCouriers] = useState<string[]>(COURIERS.map(c => c.id));
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showZoomMessage, setShowZoomMessage] = useState(true);
  const lockerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  // Minimum zoom level to load and show lockers
  const MIN_ZOOM_FOR_LOCKERS = 10;

  // Load lockers when user zooms in enough OR selects county/search
  useEffect(() => {
    const shouldLoad = currentZoom >= MIN_ZOOM_FOR_LOCKERS || selectedCounty || searchQuery.trim();
    
    if (open && shouldLoad) {
      setShowZoomMessage(false);
      loadLockers();
    } else if (open && !shouldLoad) {
      setShowZoomMessage(true);
      setVisibleLockers([]);
    }
  }, [open, currentZoom, selectedCounty, searchQuery, mapBounds]);

  const loadLockers = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      let lockersToFilter: Locker[] = [];
      
      // Use cached lockers if available
      if (cachedLockers) {
        lockersToFilter = cachedLockers;
      } else {
        const { data, error: lockersError } = await supabase.functions.invoke('get-ecolet-lockers', {
          body: { countryCode: 'RO' }
        });

        if (lockersError) throw lockersError;

        lockersToFilter = data?.lockers || [];
        cachedLockers = lockersToFilter;
      }

      // Filter by active couriers
      let filtered = lockersToFilter;
      if (activeCouriers.length < COURIERS.length) {
        filtered = filtered.filter(locker => {
          const courierLower = (locker.courier || '').toLowerCase();
          return activeCouriers.some(c => courierLower.includes(c));
        });
      }

      // When zoomed in enough, always filter by map bounds (takes priority)
      // This allows users to pan/zoom to see lockers in any area
      if (mapBounds && currentZoom >= MIN_ZOOM_FOR_LOCKERS) {
        const [[south, west], [north, east]] = mapBounds;
        filtered = filtered.filter(locker =>
          locker.lat >= south && locker.lat <= north &&
          locker.lng >= west && locker.lng <= east
        );
      } else {
        // Only apply county/search filters when NOT zoomed in enough
        // These act as initial navigation helpers
        if (selectedCounty) {
          filtered = filtered.filter(locker => 
            locker.county?.toLowerCase().includes(selectedCounty.toLowerCase())
          );
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(locker =>
            locker.name.toLowerCase().includes(query) ||
            locker.address.toLowerCase().includes(query) ||
            locker.city.toLowerCase().includes(query) ||
            locker.postal_code.includes(query)
          );
        }
      }

      // Limit for performance
      setVisibleLockers(filtered.slice(0, 200));

      if (filtered.length === 0) {
        setError(language === 'ro' 
          ? 'Nu am găsit niciun punct de livrare în această zonă' 
          : 'No delivery points found in this area');
      }
    } catch (err) {
      console.error('Error loading lockers:', err);
      setError(language === 'ro' ? 'Eroare la încărcarea punctelor de livrare' : 'Error loading delivery points');
    } finally {
      setLoading(false);
    }
  };

  // When county changes, center map on that county
  useEffect(() => {
    if (selectedCounty && cachedLockers) {
      const countyLocker = cachedLockers.find(l => 
        l.county?.toLowerCase().includes(selectedCounty.toLowerCase())
      );
      if (countyLocker) {
        setMapCenter([countyLocker.lat, countyLocker.lng]);
        setMapZoom(11);
      }
    }
  }, [selectedCounty]);

  const handleSelectLocker = useCallback((locker: Locker) => {
    setSelectedLocker(locker);
    setMapCenter([locker.lat, locker.lng]);
    setMapZoom(16); // Zoom in when selecting a locker
    
    // Scroll to the locker in the list
    setTimeout(() => {
      const ref = lockerRefs.current.get(locker.id);
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  const handleMapBoundsChange = useCallback((bounds: [[number, number], [number, number]], zoom: number) => {
    setMapBounds(bounds);
    setCurrentZoom(zoom);
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
        setMapZoom(14); // Zoom to user location
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
      setSelectedCounty('');
      setSelectedLocker(null);
      setMapBounds(null);
      setMapCenter([45.9432, 24.9668]);
      setMapZoom(7);
      setFilterOpen(false);
      setUserLocation(null);
    }
  }, [open]);

  // Use static list of counties for instant dropdown
  const availableCounties = ROMANIAN_COUNTIES;

  // Get courier info
  const getCourierInfo = (courierName: string) => {
    const courierLower = (courierName || '').toLowerCase();
    return COURIERS.find(c => courierLower.includes(c.id)) || { id: 'other', name: courierName, color: '#6B7280' };
  };

  // Format schedule for display
  const formatSchedule = (schedule?: Locker['schedule']) => {
    if (!schedule) return null;
    
    // Check if all weekdays are the same
    const weekdays = [schedule.monday, schedule.tuesday, schedule.wednesday, schedule.thursday, schedule.friday];
    const allWeekdaysSame = weekdays.every(d => d === weekdays[0]);
    
    const parts: string[] = [];
    
    if (allWeekdaysSame && weekdays[0]) {
      parts.push(`L-V ${weekdays[0]}`);
    } else {
      // Show individual days if different
      if (schedule.monday) parts.push(`L ${schedule.monday}`);
      if (schedule.tuesday && schedule.tuesday !== schedule.monday) parts.push(`Ma ${schedule.tuesday}`);
      if (schedule.wednesday && schedule.wednesday !== schedule.tuesday) parts.push(`Mi ${schedule.wednesday}`);
      if (schedule.thursday && schedule.thursday !== schedule.wednesday) parts.push(`J ${schedule.thursday}`);
      if (schedule.friday && schedule.friday !== schedule.thursday) parts.push(`V ${schedule.friday}`);
    }
    
    if (schedule.saturday) parts.push(`S ${schedule.saturday}`);
    if (schedule.sunday) parts.push(`D ${schedule.sunday}`);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:w-[900px] lg:w-[1000px] h-[90vh] md:h-[85vh] max-w-none flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-3 md:p-4 pb-2 border-b">
          <DialogTitle className="text-base md:text-lg">
            {language === 'ro' ? 'Selectează punctul de livrare' : 'Select delivery point'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Search and filter bar - Mobile optimized */}
        <div className="p-3 md:p-4 border-b space-y-2 md:space-y-3">
          {/* Row 1: County selector + Locate me */}
          <div className="flex gap-2">
            {/* County dropdown with search and clear button */}
            <div className="flex-1 flex gap-1">
              <Popover open={countyDropdownOpen} onOpenChange={setCountyDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={countyDropdownOpen}
                    className="flex-1 justify-between text-xs md:text-sm bg-background"
                  >
                    <span className="truncate">
                      {selectedCounty || (language === 'ro' ? 'Selectează județ...' : 'Select county...')}
                    </span>
                    <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-background z-[200]" align="start">
                  <Command>
                    <CommandInput placeholder={language === 'ro' ? 'Caută județ...' : 'Search county...'} />
                    <CommandList>
                      <CommandEmpty>{language === 'ro' ? 'Nu s-a găsit.' : 'Not found.'}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="toate-judetele"
                          onSelect={() => {
                            setSelectedCounty('');
                            setCountyDropdownOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !selectedCounty ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {language === 'ro' ? 'Toate județele' : 'All counties'}
                        </CommandItem>
                        {availableCounties.map((county) => (
                          <CommandItem
                            key={county}
                            value={county}
                            onSelect={() => {
                              setSelectedCounty(county);
                              setCountyDropdownOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCounty === county ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {county}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Clear county button */}
              {selectedCounty && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  onClick={() => setSelectedCounty('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Locate me button */}
            <Button 
              variant="outline" 
              onClick={handleLocateMe}
              disabled={locatingUser}
              className="gap-1 md:gap-2 shrink-0 text-xs md:text-sm"
            >
              {locatingUser ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              <span>{language === 'ro' ? 'Localizează-mă' : 'Locate me'}</span>
            </Button>
          </div>

          {/* Row 2: Search + Filter */}
          <div className="flex gap-2">
            {/* Search input with clear button */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ro' 
                  ? 'Caută după nume, adresă...' 
                  : 'Search by name, address...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter button */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={`shrink-0 ${activeCouriers.length < COURIERS.length ? 'border-primary text-primary' : ''}`}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] md:w-[280px] z-[100]" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">
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
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-colors cursor-pointer ${
                          activeCouriers.includes(courier.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: courier.color }}
                          />
                          <span className="font-medium text-sm">{courier.name}</span>
                        </div>
                        <div 
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            activeCouriers.includes(courier.id) ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <div 
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              activeCouriers.includes(courier.id) ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {error && <p className="text-xs text-destructive">{error}</p>}
          
          <p className="text-xs text-muted-foreground">
            {loading 
              ? (language === 'ro' ? 'Se încarcă...' : 'Loading...') 
              : showZoomMessage
                ? (language === 'ro' ? 'Mărește harta pentru a vedea punctele' : 'Zoom in to see delivery points')
                : `${visibleLockers.length} ${language === 'ro' ? 'puncte în zonă' : 'points in area'}`
            }
          </p>
        </div>

        {/* Main content - split view on desktop, stacked on mobile */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Map - shows first on mobile, right side on desktop */}
          <div className="h-[180px] mb-2 shrink-0 md:mb-0 md:h-auto md:w-3/5 md:order-2 flex flex-col md:border-l">
            {/* Map */}
            <div className="h-full relative bg-muted rounded-b-lg md:rounded-none overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
              <LockerMap 
                  lockers={visibleLockers}
                  selectedLocker={selectedLocker}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  userLocation={userLocation}
                  onSelectLocker={handleSelectLocker}
                  onBoundsChange={handleMapBoundsChange}
                />
              </Suspense>
              
              {/* Zoom message overlay */}
              {showZoomMessage && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
                  <div className="bg-background/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border text-center max-w-[280px]">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">
                      {language === 'ro' 
                        ? 'Mărește harta pentru a vedea punctele' 
                        : 'Zoom in to see delivery points'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ro' 
                        ? 'Sau selectează un județ / caută după nume' 
                        : 'Or select a county / search by name'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected locker details - only on desktop */}
            {selectedLocker && (
              <div className="hidden md:block border-t p-3 bg-background space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-sm">{selectedLocker.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedLocker.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
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

                {/* Schedule - show actual schedule from API */}
                {formatSchedule(selectedLocker.schedule) && (
                  <div className="flex items-start gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="text-muted-foreground">
                      <p><span className="font-medium">{language === 'ro' ? 'Program:' : 'Hours:'}</span> {formatSchedule(selectedLocker.schedule)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List - shows second on mobile, left side on desktop */}
          <div className="flex-1 min-h-0 md:w-2/5 md:order-1 overflow-y-auto border-t md:border-t-0">
            {loading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : showZoomMessage && !selectedLocker && !searchQuery.trim() && !selectedCounty ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <MapPin className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-center text-sm font-medium">
                  {language === 'ro' 
                    ? 'Mărește harta pentru a vedea lista' 
                    : 'Zoom in to see the list'}
                </p>
                <p className="text-center text-xs mt-1 opacity-70">
                  {language === 'ro' 
                    ? 'Sau selectează un județ / caută după nume' 
                    : 'Or select a county / search by name'}
                </p>
              </div>
            ) : visibleLockers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Package className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-center text-sm">
                  {language === 'ro' 
                    ? 'Nu am găsit puncte de livrare. Încearcă altă căutare sau mută harta.' 
                    : 'No delivery points found. Try another search or move the map.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {visibleLockers.map((locker) => {
                  const courierInfo = getCourierInfo(locker.courier);
                  const isSelected = selectedLocker?.id === locker.id;
                  return (
                    <button
                      key={locker.id}
                      ref={(el) => {
                        if (el) lockerRefs.current.set(locker.id, el);
                        else lockerRefs.current.delete(locker.id);
                      }}
                      onClick={() => handleSelectLocker(locker)}
                      className={`w-full p-2.5 md:p-3 text-left hover:bg-accent/50 transition-colors ${
                        isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0" 
                          style={{ backgroundColor: courierInfo.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-xs md:text-sm truncate">{locker.name}</p>
                            {isSelected && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                            {locker.address}{locker.postal_code ? `, ${locker.postal_code}` : ''}
                          </p>
                          {formatSchedule(locker.schedule) && (
                            <p className="text-[10px] text-muted-foreground/80 truncate">
                              {language === 'ro' ? 'Program:' : 'Hours:'} {formatSchedule(locker.schedule)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ 
                                backgroundColor: `${courierInfo.color}20`,
                                color: courierInfo.color 
                              }}
                            >
                              {courierInfo.name}
                            </span>
                            <span className="text-[10px] md:text-xs text-muted-foreground opacity-70">
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
        </div>

        {/* Footer - Mobile shows selected locker details inline */}
        <div className="p-3 md:p-4 border-t bg-background">
          {/* Mobile: Show selected locker details */}
          {selectedLocker && (
            <div className="md:hidden mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{selectedLocker.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedLocker.address}, {selectedLocker.city}</p>
                  {formatSchedule(selectedLocker.schedule) && (
                    <p className="text-[10px] text-muted-foreground/80 truncate">
                      {language === 'ro' ? 'Program:' : 'Hours:'} {formatSchedule(selectedLocker.schedule)}
                    </p>
                  )}
                </div>
                <div 
                  className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                  style={{ 
                    backgroundColor: `${getCourierInfo(selectedLocker.courier).color}20`,
                    color: getCourierInfo(selectedLocker.courier).color 
                  }}
                >
                  {getCourierInfo(selectedLocker.courier).name}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center gap-2">
            <div className="hidden md:block text-sm text-muted-foreground truncate">
              {selectedLocker && (
                <span>
                  <strong>{language === 'ro' ? 'Selectat:' : 'Selected:'}</strong> {selectedLocker.name}
                </span>
              )}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 md:flex-none text-sm">
                {language === 'ro' ? 'Anulează' : 'Cancel'}
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedLocker} className="flex-1 md:flex-none text-sm">
                {language === 'ro' ? 'Confirmă' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
