import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';

function normalizeCoords(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((pt) => {
      if (pt && typeof pt === 'object' && !Array.isArray(pt)) {
        const lat = parseFloat(pt.lat);
        const lng = parseFloat(pt.lng);
        if (isFinite(lat) && isFinite(lng)) return [lat, lng];
        return null;
      }
      if (Array.isArray(pt) && pt.length >= 2) {
        let a = parseFloat(pt[0]);
        let b = parseFloat(pt[1]);
        if (!isFinite(a) || !isFinite(b)) return null;

        if (Math.abs(a) <= 3 && Math.abs(b) >= 30) {
          [a, b] = [b, a]; // inverse
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

export default function ActivityMap({ coords, height = 400 }) {
  const norm = useMemo(() => normalizeCoords(coords || []), [coords]);
  const fallbackCenter = norm[0] ?? [48.8566, 2.3522]; // Paris

  const [events, setEvents] = useState([]);

  // Charger les events depuis Laravel
  useEffect(() => {
    fetch("http://backend.react.test:8000/api/events")
      .then((res) => res.json())
      .then(setEvents)
      .catch((err) => console.error("Erreur fetch events:", err));
  }, []);

  return (
    <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={fallbackCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        preferCanvas
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />

        {/* Events */}
        {events.map((e) => (
          <Marker key={`event-${e.id}`} position={[e.latitude, e.longitude]}>
            <Popup>
              <b>{e.title}</b><br />
              {e.description}<br />
              <hr />
              <b>Distance :</b> {e.kilometre ?? "-"} km<br />
              <b>Allure visée :</b> {e.allure_visee ?? "-"}<br />
              <b>Type :</b> {e.type ?? "-"}<br />
              <b>Début :</b> {e.start_time ? new Date(e.start_time).toLocaleString() : "-"}<br />
              <b>Fin :</b> {e.end_time ? new Date(e.end_time).toLocaleString() : "-"}
            </Popup>
          </Marker>
        ))}

        {/* Ton polyline si coords est fourni */}
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
