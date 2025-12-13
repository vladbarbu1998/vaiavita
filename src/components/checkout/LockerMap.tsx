import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { COURIERS } from './LockerSelector';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create colored marker icons for each courier
const createCourierIcon = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? 32 : 24;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="${isSelected ? '#000' : '#fff'}" stroke-width="1.5" 
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'courier-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// User location icon
const userLocationIcon = L.divIcon({
  html: `
    <div style="
      width: 20px; 
      height: 20px; 
      background: #3B82F6; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(59,130,246,0.5);
    "></div>
  `,
  className: 'user-location-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
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
  userLocation?: [number, number] | null;
  onSelectLocker: (locker: Locker) => void;
  onBoundsChange?: (bounds: [[number, number], [number, number]]) => void;
}

function LockerMap({ lockers, selectedLocker, mapCenter, userLocation, onSelectLocker, onBoundsChange }: LockerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const markerClusterRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onSelectLockerRef = useRef(onSelectLocker);
  const onBoundsChangeRef = useRef(onBoundsChange);

  // Keep refs updated
  useEffect(() => {
    onSelectLockerRef.current = onSelectLocker;
    onBoundsChangeRef.current = onBoundsChange;
  }, [onSelectLocker, onBoundsChange]);

  // Get courier color
  const getCourierColor = (courierName: string): string => {
    const courierLower = (courierName || '').toLowerCase();
    const courier = COURIERS.find(c => courierLower.includes(c.id));
    return courier?.color || '#6B7280';
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([45.9432, 24.9668], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapRef.current);

    // Create marker cluster group with custom styling
    markerClusterRef.current = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        let color = '#10B981'; // green
        
        if (count > 100) {
          size = 'large';
          color = '#EF4444'; // red
        } else if (count > 50) {
          size = 'medium';
          color = '#F59E0B'; // orange
        } else if (count > 20) {
          color = '#EAB308'; // yellow
        }
        
        const dimensions = size === 'large' ? 50 : size === 'medium' ? 40 : 30;
        
        return L.divIcon({
          html: `
            <div style="
              background: ${color};
              color: white;
              width: ${dimensions}px;
              height: ${dimensions}px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: ${size === 'large' ? '14px' : size === 'medium' ? '12px' : '11px'};
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">${count}</div>
          `,
          className: 'marker-cluster',
          iconSize: L.point(dimensions, dimensions),
        });
      }
    });
    
    mapRef.current.addLayer(markerClusterRef.current);

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
      const color = getCourierColor(locker.courier);
      const isSelected = selectedLocker?.id === locker.id;
      const icon = createCourierIcon(color, isSelected);

      const marker = L.marker([locker.lat, locker.lng], { icon })
        .bindPopup(`
          <div style="min-width: 180px;">
            <p style="font-weight: 600; margin: 0 0 4px 0;">${locker.name}</p>
            <p style="color: #666; margin: 0; font-size: 12px;">${locker.address}</p>
            <p style="color: #666; margin: 0; font-size: 12px;">${locker.postal_code || ''} ${locker.city}</p>
            <p style="margin: 8px 0 0 0;">
              <span style="
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                background: ${color}20;
                color: ${color};
              ">${locker.courier || 'Locker'}</span>
            </p>
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
      const locker = lockers.find(l => l.id === id);
      if (locker) {
        const color = getCourierColor(locker.courier);
        const isSelected = selectedLocker?.id === id;
        marker.setIcon(createCourierIcon(color, isSelected));
      }
    });
  }, [selectedLocker, lockers]);

  // Pan to center when it changes significantly
  useEffect(() => {
    if (mapRef.current && mapCenter[0] !== 45.9432) {
      mapRef.current.setView(mapCenter, 14, { animate: true });
    }
  }, [mapCenter]);

  // Handle user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Add new user marker if location exists
    if (userLocation) {
      userMarkerRef.current = L.marker(userLocation, { icon: userLocationIcon })
        .addTo(mapRef.current)
        .bindPopup('Locația ta');
      
      // Zoom to user location
      mapRef.current.setView(userLocation, 14, { animate: true });
    }
  }, [userLocation]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

export default LockerMap;
