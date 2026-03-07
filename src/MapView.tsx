import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  coords: [number, number];
  route?: [number, number][] | null;
  distance?: number;
  duration?: number;
}

// ── Satellite style using Esri World Imagery (free, no key) ──────────────────
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'esri-satellite',
      paint: { 'raster-opacity': 1 },
    },
    {
      id: 'labels',
      type: 'raster',
      source: 'esri-labels',
      paint: { 'raster-opacity': 0.9 },
    },
  ],
};

export default function MapView({ coords, route, distance, duration }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const destMarker = useRef<maplibregl.Marker | null>(null);
  const geolocateControl = useRef<maplibregl.GeolocateControl | null>(null);
  const isMapLoaded = useRef(false);
  const initialUserFlyDone = useRef(false);

  const throttle = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) { lastCall = now; fn(...args); }
    };
  };

  const formatDistance = (m?: number) => {
    if (!m) return '—';
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  };

  const formatDuration = (s?: number) => {
    if (!s) return '—';
    const min = Math.round(s / 60);
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60} min`;
  };

  // 1. Map init
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: SATELLITE_STYLE,
      center: [coords[1], coords[0]],
      zoom: 17,
      pitch: 45,
      bearing: 0,
    });

    const currentMap = map.current;

    currentMap.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    geolocateControl.current = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    currentMap.addControl(geolocateControl.current, 'top-right');

    currentMap.on('load', () => {
      isMapLoaded.current = true;

      // Route sources & layers
      currentMap.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });

      // Glow / shadow under route
      currentMap.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#60aaff',
          'line-width': 14,
          'line-opacity': 0.25,
          'line-blur': 6,
        },
      });

      // Main route line
      currentMap.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#3388ff',
          'line-width': 5,
          'line-opacity': 0.95,
        },
      });

      // Destination marker — custom styled pin
      const destEl = document.createElement('div');
      destEl.style.cssText = `
        width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
        background: #0066ff; border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,102,255,0.6);
      `;
      destMarker.current = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
        .setLngLat([coords[1], coords[0]])
        .addTo(currentMap);
    });

    return () => { map.current?.remove(); };
  }, []);

  // 2. User GPS marker
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    const throttledUpdate = throttle((lat: number, lng: number) => {
      if (!userMarker.current) {
        // Pulsing dot for user location
        const el = document.createElement('div');
        el.style.cssText = `
          width: 18px; height: 18px; border-radius: 50%;
          background: #ff3333; border: 3px solid white;
          box-shadow: 0 0 0 6px rgba(255,51,51,0.25);
        `;
        userMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(m);

        if (!initialUserFlyDone.current) {
          m.flyTo({ center: [lng, lat], zoom: 17, pitch: 45, essential: true, duration: 1400 });
          initialUserFlyDone.current = true;
        }
      } else {
        userMarker.current.setLngLat([lng, lat]);
      }
    }, 1200);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => throttledUpdate(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 3. Update dest marker
  useEffect(() => {
    if (!map.current || !isMapLoaded.current || !destMarker.current) return;
    destMarker.current.setLngLat([coords[1], coords[0]]);
  }, [coords]);

  // 4. Update route
  useEffect(() => {
    if (!map.current || !isMapLoaded.current || !route?.length) return;
    const m = map.current;
    const source = m.getSource('route') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData({
      type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: route },
    });

    const bounds = new maplibregl.LngLatBounds();
    route.forEach((coord) => bounds.extend(coord));
    m.fitBounds(bounds, { padding: { top: 80, bottom: 120, left: 60, right: 60 }, maxZoom: 16, duration: 1400 });
  }, [route]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Attribution badge */}
      <div style={{
        position: 'absolute', bottom: route?.length ? 70 : 8, right: 8,
        fontSize: 10, color: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4,
        pointerEvents: 'none', zIndex: 5,
      }}>
        Tiles © Esri
      </div>

      {/* Route info badge */}
      {route?.length ? (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.78)', color: 'white',
          padding: '10px 18px', borderRadius: 12, fontSize: 15, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'none',
          zIndex: 10, whiteSpace: 'nowrap', backdropFilter: 'blur(4px)',
        }}>
          <span style={{ marginRight: 24 }}>
            Distance <strong>{formatDistance(distance)}</strong>
          </span>
          <span>
            Time <strong>{formatDuration(duration)}</strong>
          </span>
        </div>
      ) : null}
    </div>
  );
}