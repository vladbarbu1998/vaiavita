import React, { useEffect, useRef, useCallback } from 'react';
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
  onBoundsChange?: (bounds: [[number, number], [number, number]]) => void;
}

function LockerMap({ lockers, selectedLocker, mapCenter, onSelectLocker, onBoundsChange }: LockerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const markerClusterRef = useRef<L.LayerGroup | null>(null);
  const onSelectLockerRef = useRef(onSelectLocker);
  const onBoundsChangeRef = useRef(onBoundsChange);

  // Keep refs updated
  useEffect(() => {
    onSelectLockerRef.current = onSelectLocker;
    onBoundsChangeRef.current = onBoundsChange;
  }, [onSelectLocker, onBoundsChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([45.9432, 24.9668], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapRef.current);

    markerClusterRef.current = L.layerGroup().addTo(mapRef.current);

    // Report bounds on move/zoom end
    const reportBounds = () => {
      if (mapRef.current && onBoundsChangeRef.current) {
        const bounds = mapRef.current.getBounds();
        onBoundsChangeRef.current([
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ]);
      }
    };

    mapRef.current.on('moveend', reportBounds);
    mapRef.current.on('zoomend', reportBounds);

    // Initial bounds report
    setTimeout(reportBounds, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when lockers change
  useEffect(() => {
    if (!mapRef.current || !markerClusterRef.current) return;

    // Clear existing markers
    markerClusterRef.current.clearLayers();
    markersRef.current.clear();

    // Add new markers
    lockers.forEach(locker => {
      const marker = L.marker([locker.lat, locker.lng], {
        icon: selectedLocker?.id === locker.id ? selectedIcon : defaultIcon
      })
        .bindPopup(`
          <div style="min-width: 150px;">
            <p style="font-weight: 600; margin: 0 0 4px 0;">${locker.name}</p>
            <p style="color: #666; margin: 0; font-size: 12px;">${locker.address}</p>
            <p style="color: #666; margin: 0; font-size: 12px;">${locker.postal_code || ''}</p>
          </div>
        `)
        .on('click', () => onSelectLockerRef.current(locker));

      markerClusterRef.current!.addLayer(marker);
      markersRef.current.set(locker.id, marker);
    });
  }, [lockers]);

  // Update marker icons when selection changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(selectedLocker?.id === id ? selectedIcon : defaultIcon);
    });
  }, [selectedLocker]);

  // Pan to center when it changes significantly
  useEffect(() => {
    if (mapRef.current && mapCenter[0] !== 45.9432) {
      mapRef.current.setView(mapCenter, 14, { animate: true });
    }
  }, [mapCenter]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

export default LockerMap;
