import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Loader2, Package, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom selected marker icon
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

interface Locality {
  id: number;
  name: string;
  municipality: string;
  postal_code: string;
  county: {
    id: number;
    name: string;
    code: string;
  };
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

// Component to recenter map
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export function LockerSelector({ open, onOpenChange, onSelectLocker, selectedLockerId }: LockerSelectorProps) {
  const { language } = useLanguage();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.9432, 24.9668]); // Romania center

  const searchLockers = useCallback(async () => {
    if (searchQuery.length < 3) {
      setError(language === 'ro' ? 'Introdu cel puțin 3 caractere' : 'Enter at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // First search for localities
      const { data: localityData, error: localityError } = await supabase.functions.invoke('get-ecolet-lockers', {
        body: { 
          action: 'search-localities',
          searchQuery: searchQuery,
          countryCode: 'RO'
        }
      });

      if (localityError) throw localityError;

      const localities: Locality[] = localityData?.localities || [];
      let localityId: number | undefined;

      if (localities.length > 0) {
        // Use the first matching locality
        localityId = localities[0].id;
        console.log('Found locality:', localities[0].name, 'ID:', localityId);
      }

      // Now fetch lockers with the locality filter
      const { data, error: lockersError } = await supabase.functions.invoke('get-ecolet-lockers', {
        body: { 
          localityId,
          searchQuery: searchQuery,
          countryCode: 'RO'
        }
      });

      if (lockersError) throw lockersError;

      const fetchedLockers = data?.lockers || [];
      setLockers(fetchedLockers);

      // Center map on first result if available
      if (fetchedLockers.length > 0) {
        const firstLocker = fetchedLockers[0];
        setMapCenter([firstLocker.lat, firstLocker.lng]);
      }

      if (fetchedLockers.length === 0) {
        setError(language === 'ro' 
          ? 'Nu am găsit niciun punct de livrare pentru această zonă' 
          : 'No delivery points found for this area');
      }
    } catch (err) {
      console.error('Error searching lockers:', err);
      setError(language === 'ro' ? 'Eroare la căutarea punctelor de livrare' : 'Error searching delivery points');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLockers();
    }
  };

  const handleSelectLocker = (locker: Locker) => {
    setSelectedLocker(locker);
    setMapCenter([locker.lat, locker.lng]);
  };

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
  React.useEffect(() => {
    if (!open) {
      setLockers([]);
      setSearchQuery('');
      setSelectedLocker(null);
      setHasSearched(false);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>
            {language === 'ro' ? 'Selectează punctul de livrare' : 'Select delivery point'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Search bar */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ro' 
                  ? 'Caută după oraș, adresă sau nume locker...' 
                  : 'Search by city, address or locker name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={searchLockers} disabled={loading || searchQuery.length < 3}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ro' ? 'Caută' : 'Search')}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        {/* Main content - split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - List */}
          <div className="w-2/5 border-r overflow-y-auto">
            {!hasSearched ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <MapPin className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  {language === 'ro' 
                    ? 'Caută un oraș sau adresă pentru a vedea punctele de livrare disponibile' 
                    : 'Search for a city or address to see available delivery points'}
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  {language === 'ro' ? 'Se încarcă...' : 'Loading...'}
                </span>
              </div>
            ) : lockers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  {language === 'ro' 
                    ? 'Nu am găsit puncte de livrare. Încearcă altă căutare.' 
                    : 'No delivery points found. Try another search.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {lockers.map((locker) => (
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
                        <p className="text-xs text-muted-foreground truncate">{locker.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {locker.city}{locker.postal_code ? `, ${locker.postal_code}` : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right - Map */}
          <div className="w-3/5 relative">
            <MapContainer
              center={mapCenter}
              zoom={7}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter center={mapCenter} />
              {lockers.map((locker) => (
                <Marker
                  key={locker.id}
                  position={[locker.lat, locker.lng]}
                  icon={selectedLocker?.id === locker.id ? selectedIcon : defaultIcon}
                  eventHandlers={{
                    click: () => handleSelectLocker(locker),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{locker.name}</p>
                      <p className="text-muted-foreground">{locker.address}</p>
                      <p className="text-muted-foreground">{locker.city}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
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
