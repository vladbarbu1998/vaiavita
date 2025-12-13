import React, { useEffect, useRef } from 'react';
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

function LockerMap({ lockers, selectedLocker, mapCenter, onSelectLocker }: LockerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView(mapCenter, 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when lockers change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    lockers.forEach(locker => {
      const marker = L.marker([locker.lat, locker.lng], {
        icon: selectedLocker?.id === locker.id ? selectedIcon : defaultIcon
      })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="text-sm">
            <p class="font-medium">${locker.name}</p>
            <p class="text-gray-600">${locker.address}</p>
            <p class="text-gray-600">${locker.city}</p>
          </div>
        `)
        .on('click', () => onSelectLocker(locker));

      markersRef.current.set(locker.id, marker);
    });
  }, [lockers, onSelectLocker]);

  // Update marker icons when selection changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(selectedLocker?.id === id ? selectedIcon : defaultIcon);
    });
  }, [selectedLocker]);

  // Pan to center when it changes
  useEffect(() => {
    if (mapRef.current && mapCenter[0] !== 0 && mapCenter[1] !== 0) {
      mapRef.current.setView(mapCenter, 14);
    }
  }, [mapCenter]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

export default LockerMap;
