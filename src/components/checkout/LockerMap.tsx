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

// Create marker icons with courier logos
const createCourierIcon = (courierInfo: { color: string; logo?: string }, isSelected: boolean = false) => {
  const size = isSelected ? 40 : 32;
  const borderWidth = isSelected ? 3 : 2;
  
  // Use logo image if available, otherwise fallback to colored pin
  if (courierInfo.logo) {
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: white;
          border-radius: 50%;
          border: ${borderWidth}px solid ${isSelected ? '#000' : courierInfo.color};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        ">
          <img src="${courierInfo.logo}" alt="" style="width: ${size - 8}px; height: ${size - 8}px; object-fit: contain;" />
        </div>
      `,
      className: 'courier-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }
  
  // Fallback to SVG pin marker
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${courierInfo.color}" stroke="${isSelected ? '#000' : '#fff'}" stroke-width="1.5" 
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
  mapZoom?: number;
  userLocation?: [number, number] | null;
  onSelectLocker: (locker: Locker) => void;
  onBoundsChange?: (bounds: [[number, number], [number, number]], zoom: number) => void;
}

function LockerMap({ lockers, selectedLocker, mapCenter, mapZoom, userLocation, onSelectLocker, onBoundsChange }: LockerMapProps) {
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

  // Get courier info (color, logo, and display name)
  const getCourierInfo = (courierName: string): { color: string; logo?: string; displayName: string } => {
    const courierLower = (courierName || '').toLowerCase();
    const courier = COURIERS.find(c => courierLower.includes(c.id));
    return courier 
      ? { color: courier.color, logo: courier.logo, displayName: courier.name } 
      : { color: '#6B7280', displayName: courierName || 'Locker' };
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

    // Report bounds and zoom on move/zoom end
    const reportBounds = () => {
      if (mapRef.current && onBoundsChangeRef.current) {
        const bounds = mapRef.current.getBounds();
        const zoom = mapRef.current.getZoom();
        onBoundsChangeRef.current([
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ], zoom);
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
      const courierInfo = getCourierInfo(locker.courier);
      const isSelected = selectedLocker?.id === locker.id;
      const icon = createCourierIcon(courierInfo, isSelected);

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
                background: ${courierInfo.color}20;
                color: ${courierInfo.color};
              ">${courierInfo.displayName}</span>
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
        const courierInfo = getCourierInfo(locker.courier);
        const isSelected = selectedLocker?.id === id;
        marker.setIcon(createCourierIcon(courierInfo, isSelected));
      }
    });
  }, [selectedLocker, lockers]);

  // Pan/zoom to center when it changes
  const lastCenterRef = useRef<[number, number]>([45.9432, 24.9668]);
  const lastZoomRef = useRef<number>(7);
  useEffect(() => {
    if (mapRef.current) {
      const targetZoom = mapZoom ?? mapRef.current.getZoom();
      const zoomChanged = mapZoom !== undefined && mapZoom !== lastZoomRef.current;
      const centerChanged = mapCenter[0] !== lastCenterRef.current[0] || mapCenter[1] !== lastCenterRef.current[1];
      
      if (centerChanged || zoomChanged) {
        mapRef.current.setView(mapCenter, targetZoom, { animate: true });
        lastCenterRef.current = mapCenter;
        lastZoomRef.current = targetZoom;
      }
    }
  }, [mapCenter, mapZoom]);

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
