import React, { useEffect } from 'react';
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

interface LockerMapProps {
  lockers: Locker[];
  selectedLocker: Locker | null;
  mapCenter: [number, number];
  onSelectLocker: (locker: Locker) => void;
}

// Component to recenter map
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

function LockerMap({ lockers, selectedLocker, mapCenter, onSelectLocker }: LockerMapProps) {
  return (
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
            click: () => onSelectLocker(locker),
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
  );
}

export default LockerMap;
