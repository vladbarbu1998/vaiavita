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
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
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
  const [allLockers, setAllLockers] = useState<Locker[]>([]);
  const [mapLockers, setMapLockers] = useState<Locker[]>([]); // All lockers for map (filtered by courier only)
  const [listLockers, setListLockers] = useState<Locker[]>([]); // Lockers for list (filtered by bounds/search)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [countyOpen, setCountyOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.9432, 24.9668]); // Romania center
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [currentZoom, setCurrentZoom] = useState<number>(7); // Track actual map zoom for list visibility
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCouriers, setActiveCouriers] = useState<string[]>(COURIERS.map(c => c.id));
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Minimum zoom level to show the list (12 = city level)
  const MIN_ZOOM_FOR_LIST = 11;

  // Load all lockers when dialog opens - use cache if available
  useEffect(() => {
    if (open && allLockers.length === 0) {
      if (cachedLockers) {
        setAllLockers(cachedLockers);
        setMapLockers(cachedLockers);
      } else {
        loadAllLockers();
      }
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
      setMapLockers(fetchedLockers);
      
      // Cache for instant popup next time
      cachedLockers = fetchedLockers;
      
      // Log sample lockers from Brașov and București for verification
      const brasovLocker = fetchedLockers.find((l: Locker) => l.city?.toLowerCase().includes('brașov') || l.city?.toLowerCase().includes('brasov'));
      const bucuresti = fetchedLockers.find((l: Locker) => l.city?.toLowerCase().includes('bucurești') || l.city?.toLowerCase().includes('bucuresti'));
      if (brasovLocker) console.log('Sample Brașov locker:', { name: brasovLocker.name, schedule: brasovLocker.schedule });
      if (bucuresti) console.log('Sample București locker:', { name: bucuresti.name, schedule: bucuresti.schedule });

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

  // Filter lockers for MAP (only by courier type - shows all on map)
  useEffect(() => {
    let mapFiltered = allLockers;

    // Filter by active couriers only
    if (activeCouriers.length < COURIERS.length) {
      mapFiltered = mapFiltered.filter(locker => {
        const courierLower = (locker.courier || '').toLowerCase();
        return activeCouriers.some(c => courierLower.includes(c));
      });
    }

    setMapLockers(mapFiltered);
  }, [allLockers, activeCouriers]);

  // Filter lockers for LIST (filtered by bounds, search, county)
  useEffect(() => {
    let listFiltered = allLockers;

    // Filter by active couriers
    if (activeCouriers.length < COURIERS.length) {
      listFiltered = listFiltered.filter(locker => {
        const courierLower = (locker.courier || '').toLowerCase();
        return activeCouriers.some(c => courierLower.includes(c));
      });
    }

    // Filter by county
    if (selectedCounty) {
      listFiltered = listFiltered.filter(locker => 
        locker.county?.toLowerCase().includes(selectedCounty.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      listFiltered = listFiltered.filter(locker =>
        locker.name.toLowerCase().includes(query) ||
        locker.address.toLowerCase().includes(query) ||
        locker.city.toLowerCase().includes(query) ||
        locker.postal_code.includes(query)
      );
    }

    // Filter by map bounds when zoomed in enough
    if (mapBounds && currentZoom >= MIN_ZOOM_FOR_LIST && !selectedCounty && !searchQuery.trim()) {
      const [[south, west], [north, east]] = mapBounds;
      listFiltered = listFiltered.filter(locker =>
        locker.lat >= south && locker.lat <= north &&
        locker.lng >= west && locker.lng <= east
      );
    }

    // Limit list items for performance
    setListLockers(listFiltered.slice(0, 100));
  }, [allLockers, selectedCounty, searchQuery, mapBounds, activeCouriers, currentZoom]);

  // When county changes, center map on that county
  useEffect(() => {
    if (selectedCounty && allLockers.length > 0) {
      const countyLocker = allLockers.find(l => 
        l.county?.toLowerCase().includes(selectedCounty.toLowerCase())
      );
      if (countyLocker) {
        setMapCenter([countyLocker.lat, countyLocker.lng]);
      }
    }
  }, [selectedCounty, allLockers]);

  const handleSelectLocker = useCallback((locker: Locker) => {
    setSelectedLocker(locker);
    setMapCenter([locker.lat, locker.lng]);
    setMapZoom(16); // Zoom in when selecting a locker
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

  // Get unique counties from lockers for dropdown
  const availableCounties = React.useMemo(() => {
    const counties = new Set(allLockers.map(l => l.county).filter(Boolean));
    return Array.from(counties).sort();
  }, [allLockers]);

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
            {/* County dropdown */}
            <Popover open={countyOpen} onOpenChange={setCountyOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={countyOpen}
                  className="flex-1 justify-between text-xs md:text-sm"
                >
                  <span className="truncate">
                    {selectedCounty || (language === 'ro' ? 'Selectează județ...' : 'Select county...')}
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 z-[100]" align="start">
                <Command>
                  <CommandInput placeholder={language === 'ro' ? 'Caută județ...' : 'Search county...'} />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty>{language === 'ro' ? 'Niciun județ găsit' : 'No county found'}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          setSelectedCounty('');
                          setCountyOpen(false);
                        }}
                      >
                        {language === 'ro' ? 'Toate județele' : 'All counties'}
                      </CommandItem>
                      {availableCounties.map((county) => (
                        <CommandItem
                          key={county}
                          value={county}
                          onSelect={(value) => {
                            setSelectedCounty(value);
                            setCountyOpen(false);
                          }}
                        >
                          {county}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

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
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ro' 
                  ? 'Caută după nume, adresă...' 
                  : 'Search by name, address...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
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
              : currentZoom >= MIN_ZOOM_FOR_LIST || searchQuery.trim() || selectedCounty
                ? `${listLockers.length} ${language === 'ro' ? 'puncte în zonă' : 'points in area'}`
                : `${allLockers.length} ${language === 'ro' ? 'puncte disponibile' : 'points available'}`
            }
          </p>
        </div>

        {/* Main content - split view on desktop, stacked on mobile */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map - shows first on mobile, right side on desktop */}
          <div className="h-[40%] md:h-auto md:w-3/5 md:order-2 flex flex-col border-b md:border-b-0 md:border-l">
            {/* Map */}
            <div className="flex-1 relative bg-muted min-h-[200px]">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <LockerMap 
                  lockers={mapLockers}
                  selectedLocker={selectedLocker}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  userLocation={userLocation}
                  onSelectLocker={handleSelectLocker}
                  onBoundsChange={handleMapBoundsChange}
                />
              </Suspense>
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
          <div className="flex-1 md:w-2/5 md:order-1 overflow-y-auto pt-2 md:pt-0">
            {loading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentZoom < MIN_ZOOM_FOR_LIST && !selectedLocker && !searchQuery.trim() && !selectedCounty ? (
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
            ) : listLockers.length === 0 ? (
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
                {/* Show selected locker first if exists */}
                {selectedLocker && (
                  (() => {
                    const courierInfo = getCourierInfo(selectedLocker.courier);
                    return (
                      <button
                        key={`selected-${selectedLocker.id}`}
                        onClick={() => handleSelectLocker(selectedLocker)}
                        className="w-full p-2.5 md:p-3 text-left bg-primary/10 border-l-4 border-primary"
                      >
                        <div className="flex items-start gap-2">
                          <div 
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0" 
                            style={{ backgroundColor: courierInfo.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-xs md:text-sm truncate">{selectedLocker.name}</p>
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            </div>
                            <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                              {selectedLocker.address}{selectedLocker.postal_code ? `, ${selectedLocker.postal_code}` : ''}
                            </p>
                            {formatSchedule(selectedLocker.schedule) && (
                              <p className="text-[10px] text-muted-foreground/80 truncate">
                                {language === 'ro' ? 'Program:' : 'Hours:'} {formatSchedule(selectedLocker.schedule)}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span 
                                className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
                                style={{ backgroundColor: courierInfo.color }}
                              >
                                {courierInfo.name}
                              </span>
                              <span className="text-[9px] md:text-[10px] text-muted-foreground">{selectedLocker.city}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })()
                )}
                {listLockers.filter(l => l.id !== selectedLocker?.id).map((locker) => {
                  const courierInfo = getCourierInfo(locker.courier);
                  return (
                    <button
                      key={locker.id}
                      onClick={() => handleSelectLocker(locker)}
                      className={`w-full p-2.5 md:p-3 text-left hover:bg-accent/50 transition-colors ${
                        selectedLocker?.id === locker.id ? 'bg-primary/10 border-l-4 border-primary' : ''
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
                            {selectedLocker?.id === locker.id && (
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
