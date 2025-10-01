import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';

function normalizeCoords(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((pt) => {
      // { lat, lng }
      if (pt && typeof pt === 'object' && !Array.isArray(pt)) {
        const lat = parseFloat(pt.lat);
        const lng = parseFloat(pt.lng);
        if (isFinite(lat) && isFinite(lng)) return [lat, lng];
        return null;
      }
      // [a, b]
      if (Array.isArray(pt) && pt.length >= 2) {
        let a = parseFloat(pt[0]);
        let b = parseFloat(pt[1]);
        if (!isFinite(a) || !isFinite(b)) return null;

        // Heuristique : si |a| <= 3 et |b| >= 30, c'est probablement [lng, lat]
        // (Paris ~ lat 48.x, lng 2.x)
        // Adapte si tu es dans une autre zone du monde.
        if (Math.abs(a) <= 3 && Math.abs(b) >= 30) {
          [a, b] = [b, a]; // inverse en [lat,lng]
        }
        return [a, b];
      }
      return null;
    })
    .filter(Boolean);
}

function FitToRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length) {
      map.fitBounds(L.latLngBounds(coords), { padding: [20, 20] });
    }
  }, [coords, map]);
  return null;
}

export default function ActivityMap({ coords, height = 200 }) {
  const norm = useMemo(() => normalizeCoords(coords || []), [coords]);
  const fallbackCenter = norm[0] ?? [48.837, 2.44];

  // Debug temporaire
  // console.log('ActivityMap coords (normalized):', norm);

  return (
    <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={fallbackCenter}
        zoom={14}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        preferCanvas
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {norm.length > 0 && (
          <>
            <Polyline positions={norm} pathOptions={{ color: '#14919B', weight: 6, opacity: 0.9 }} />
            <FitToRoute coords={norm} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
