import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../hooks/AuthStore";


const RANKS = ["S", "A", "B", "C", "D", "E", "F"];
const rankColor = (r) =>
  ({
    S: "#ffd700", // or
    A: "#45DFB1",
    B: "#14919B",
    C: "#4A9EFF",
    D: "#9CA3AF",
    E: "#F59E0B",
    F: "#EF4444",
  }[r] || "#888");

// Composant pour capter le clic sur la carte en mode "Créer un évènement"
function ClickToCreate({ enabled, onClick }) {
  useMapEvents({
    click(e) {
      if (enabled) onClick(e.latlng);
    },
  });
  return null;
}
function handleCreateEvent(latlng) {
  setDraftEvent({
    lat: latlng.lat,
    lng: latlng.lng,
    title: "",
    when: "",
    rank: "S",
    description: "",
  });
}


/**
 * Props optionnelles :
 * - initialCenter: [lat, lng] (défaut Paris)
 * - users: [{id, name, rank:'A'..'F', lat, lng, hour:0..23}]
 */
export default function MapTrouver({
  initialCenter = [48.8566, 2.3522],
  users: usersProp = [],   // ← défaut conseillé
})  {
  const { user } = useAuthStore();
  const [userPos, setUserPos] = useState(initialCenter);
  const [users, setUsers] = useState(usersProp || []);
  const [selectedRanks, setSelectedRanks] = useState(new Set(RANKS));
  const [hourStart, setHourStart] = useState(0);
  const [hourEnd, setHourEnd] = useState(23);

  const [createMode, setCreateMode] = useState(false);
  const [draftEvent, setDraftEvent] = useState(null);
  const [events, setEvents] = useState([]);

const NUM_USERS   = 200;   // ← 25 -> 200
const LAT_SPREAD  = 0.02;  // ← était 0.01 (≈ zone 2x plus large N/S)
const LNG_SPREAD  = 0.03;  // ← était 0.015 (≈ zone 2x plus large E/O)
const JITTER_M    = 50;    // ← décale chaque point de ~50 m aléatoirement
  // Génère des utilisateurs factices si rien n'est passé en props
function jitterMeters(lat, lng, meters = 40) {
  const r = meters / 111_111;                 // ≈ degrés de lat pour X m
  const t = Math.random() * Math.PI * 2;      // angle
  const dx = r * Math.cos(t);
  const dy = r * Math.sin(t) / Math.cos(lat * Math.PI / 180);
  return [lat + dy, lng + dx];
}
useEffect(() => {
  fetch("http://backend.react.test:8000/api/events", {
    credentials: "include", // ✅ obligatoire pour envoyer le cookie de session
  })
    .then((res) => res.json())
    .then(setEvents)
    .catch((err) => console.error("Erreur fetch events:", err));
}, []);



function getCsrfToken() {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
  return token ? decodeURIComponent(token) : null;
}
// useEffect(() => {
//   if (!usersProp || usersProp.length === 0) {
//     const base = userPos;
//     const rnd = (min, max) => Math.random() * (max - min) + min;

//     const gen = Array.from({ length: NUM_USERS }).map((_, i) => {
//       // zone plus large
//       const lat0 = base[0] + rnd(-LAT_SPREAD, LAT_SPREAD);
//       const lng0 = base[1] + rnd(-LNG_SPREAD, LNG_SPREAD);
//       // léger décalage pour éviter les superpositions exactes
//       const [lat, lng] = jitterMeters(lat0, lng0, JITTER_M);

//       return {
//         id: i + 1,
//         name: `Runner ${i + 1}`,
//         rank: RANKS[Math.floor(Math.random() * RANKS.length)],
//         lat,
//         lng,
//         hour: Math.floor(Math.random() * 24),
//       };
//     });

//     setUsers(gen);
//   }// eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

  // Centrage sur la géolocalisation de l’utilisateur (si autorisée)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {}, // ignore erreurs
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Filtres
  const filteredUsers = useMemo(
    () => users.filter((u) => selectedRanks.has(u.rank) && u.hour >= hourStart && u.hour <= hourEnd),
    [users, selectedRanks, hourStart, hourEnd]
  );

  function toggleRank(r) {
    setSelectedRanks((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  }

  function handleCreateEvent(latlng) {
    setDraftEvent({
      lat: latlng.lat,
      lng: latlng.lng,
      title: "",
      when: "",
      rank: "S",
      description: "",
    });
  }

  async function saveEvent() {
    try {
      const res = await fetch("http://backend.react.test:8000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftEvent.title,
          description: draftEvent.description,
          latitude: draftEvent.lat,
          longitude: draftEvent.lng,
          start_time: draftEvent.when,
          end_time: draftEvent.when, // ou autre logique      
          training_rank: "B",        // idem
        }),
      });

      const newEvent = await res.json();
      setEvents((prev) => [...prev, newEvent]);
      setDraftEvent(null);
      setCreateMode(True);
    } catch (err) {
      console.error("Erreur création event:", err);
    }
  }
  // Fonction pour créer un évènement
async function saveEvent() {
  try {
    const csrfToken = getCsrfToken();
    const res = await fetch("http://backend.react.test:8000/api/events", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken, // ✅ Ajout ici
        },
      credentials: "include",
      body: JSON.stringify({
        title: draftEvent.title,
        description: draftEvent.description,
        latitude: draftEvent.lat,
        longitude: draftEvent.lng,
        start_time: draftEvent.when,
        end_time: draftEvent.when,
        training_rank: draftEvent.rank,
      }),
    });

    const newEvent = await res.json();
    setEvents((prev) => [...prev, newEvent]);
    setDraftEvent(null);
    setCreateMode(false);
  } catch (err) {
    console.error("Erreur création event:", err);
  }
}

// Fonction pour rejoindre un évènement
async function joinEvent(eventId) {
  try {
    const csrfToken = getCsrfToken();
    await fetch(`http://backend.react.test:8000/api/events/${eventId}/join`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken, // ✅ Ajout ici
      },
      
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, isJoined: true, participants_count: (ev.participants_count ?? 0) + 1, } : ev
      )
    );
  } catch (err) {
    console.error("Erreur inscription:", err);
  }
}

// Fonction pour se désinscrire
async function leaveEvent(eventId) {
  try {
    const csrfToken = getCsrfToken();
    await fetch(`http://backend.react.test:8000/api/events/${eventId}/leave`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken, // ✅ Ajout ici
      }
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, isJoined: false, participants_count: (ev.participants_count ?? 0) - 1, } : ev
      )
    );
  } catch (err) {
    console.error("Erreur désinscription:", err);
  }
}
async function deleteEvent(eventId) {
  if (!window.confirm("Voulez-vous vraiment supprimer cet évènement ?")) return;

  try {
    const csrfToken = getCsrfToken();
    const res = await fetch(`http://backend.react.test:8000/api/events/${eventId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Erreur suppression:", res.status, txt);
      return;
    }

    // Supprime localement sans recharger la page
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
  } catch (err) {
    console.error("Erreur suppression event:", err);
  }
}
const filteredEvents = useMemo(
  () => events.filter((ev) => selectedRanks.has(ev.training_rank)),
  [events, selectedRanks]
);


  return (
    <div
      style={{
        background: "#213A57",
        borderRadius: 16,
        padding:16,
        marginLeft: 20,
        marginRight: 20,
        marginTop: 20,  
        border: "1px solid rgba(69,223,177,0.25)",
      }}
    >
      <h3 style={{ color: "#E0F2F1", margin: "0 0 12px" }}>Carte des utilisateurs</h3>

      {/* Toolbar filtres + bouton événement */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RANKS.map((r) => (
            <button
              key={r}
              onClick={() => toggleRank(r)}
              style={{
                padding: "6px 10px",
                borderRadius: 12,
                border: selectedRanks.has(r) ? `2px solid ${rankColor(r)}` : "2px solid rgba(255,255,255,0.15)",
                background: selectedRanks.has(r) ? "rgba(255,255,255,0.06)" : "transparent",
                color: "#E0F2F1",
                fontWeight: 600,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: "#E0F2F1" }}>
          Heure:
          <input
            type="number"
            min={0}
            max={23}
            value={hourStart}
            onChange={(e) => setHourStart(Math.max(0, Math.min(23, Number(e.target.value))))}
            style={{ width: 56, padding: 6, borderRadius: 8, border: "1px solid #14919B", background: "#173047", color: "#E0F2F1" }}
          />
          —
          <input
            type="number"
            min={0}
            max={23}
            value={hourEnd}
            onChange={(e) => setHourEnd(Math.max(0, Math.min(23, Number(e.target.value))))}
            style={{ width: 56, padding: 6, borderRadius: 8, border: "1px solid #14919B", background: "#173047", color: "#E0F2F1" }}
          />
          <button
            onClick={() => {
              setHourStart(0);
              setHourEnd(23);
            }}
            style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #14919B", background: "transparent", color: "#E0F2F1" }}
          >
            Réinitialiser
          </button>
          <button
            onClick={() => setCreateMode((m) => !m)}
            style={{ padding: "8px 14px", borderRadius: 12, border: "none", background: "#45DFB1", color: "#FFF", fontWeight: 700 }}
          >
            {createMode ? "Annuler" : "Créer un évènement"}
          </button>
        </div>
      </div>

      {/* Carte */}
      <div style={{ width: "100%", height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(69,223,177,0.25)" }}>
        <MapContainer center={userPos} zoom={14} scrollWheelZoom style={{ width: "100%", height: "100%" }} preferCanvas>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />

          {/* Position utilisateur */}
          <CircleMarker
            center={userPos}
            radius={10}
            pathOptions={{ color: "#45DFB1", weight: 2, fillColor: "#45DFB1", fillOpacity: 0.6 }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, color: "#213A57" }}>Vous</div>
                <div style={{ marginTop: 6, padding: 8, borderRadius: 8, background: "#E0F2F1", color: "#213A57" }}>
                  Rang&nbsp;<span style={{ fontWeight: 800 }}>A</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Utilisateurs filtrés */}
          {filteredUsers.map((u) => (
            <CircleMarker
              key={u.id}
              center={[u.lat, u.lng]}
              radius={7}
              pathOptions={{ color: rankColor(u.rank), weight: 2, fillColor: rankColor(u.rank), fillOpacity: 0.7 }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong style={{ color: "#213A57" }}>{u.name}</strong>
                    <span
                      style={{
                        background: rankColor(u.rank),
                        color: "#213A57",
                        fontWeight: 800,
                        borderRadius: 8,
                        padding: "2px 8px",
                      }}
                    >
                      {u.rank}
                    </span>
                  </div>
                  <div style={{ color: "#14919B" }}>Heure dispo: {String(u.hour).padStart(2, "0")}h</div>
                  <button
                    style={{
                      marginTop: 8,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "#213A57",
                      color: "#E0F2F1",
                    }}
                  >
                    Inviter
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Évènements existants */}
          {filteredEvents.map((ev) => {
            const isMine = user && ev.created_by === user.id; // ✅ ton propre event

            return (
              <>
                {/* Halo rouge autour si c’est ton event */}
                {isMine && (
                  <CircleMarker
                    center={[ev.latitude, ev.longitude]}
                    radius={14}
                    pathOptions={{
                      color: "rgba(255,0,0,0.5)", // rouge transparent
                      weight: 0,
                      fillOpacity: 0,
                    }}
                  />
                )}

                <CircleMarker
                  key={ev.id}
                  center={[ev.latitude, ev.longitude]}
                  radius={10}
                  pathOptions={{
                    color: isMine ? "#FF0000" : rankColor(ev.training_rank), // 🔴 contour rouge si c’est le tien
                    weight: isMine ? 3 : 1,
                    fillColor: rankColor(ev.training_rank),
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 220 }}>
                      <div style={{ fontWeight: 800, color: "#213A57" }}>
                        {ev.title || "Évènement"}
                      </div>
                      <div style={{ color: "#14919B", margin: "6px 0" }}>{ev.start_time}</div>
                      <div style={{ color: "#213A57" }}>Niveaux: {ev.training_rank}</div>
                      <div style={{ color: "#14919B", marginTop: 4 }}>
                        Participants : {ev.participants_count ?? 0}
                      </div>
                      {ev.description && (
                        <div style={{ marginTop: 6, color: "#213A57" }}>
                          {ev.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px", // ✅ espace vertical automatique
                          marginTop: "10px",
                        }}
                      >
                        <button
                          onClick={() => ev.isJoined ? leaveEvent(ev.id) : joinEvent(ev.id)}
                          style={{
                            background: ev.isJoined ? "#14919B" : "#45DFB1",
                            color: ev.isJoined ? "#E0F2F1" : "#213A57",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          {ev.isJoined ? "Se désinscrire" : "Rejoindre"}
                        </button>

                        {ev.created_by === user?.id && (
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            style={{
                              background: "#EF4444",
                              color: "#FFF",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontSize: "13px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>

                      
                    </div>
                  </Popup>
                </CircleMarker>
              </>
            );
          })}

          {/* Mode création : clic sur la carte pour poser l’évènement */}
          <ClickToCreate enabled={createMode} onClick={handleCreateEvent} />

          {/* Prévisualisation + formulaire de l’évènement en cours */}
          {draftEvent && (
            <CircleMarker
              center={[draftEvent.lat, draftEvent.lng]}
              radius={10}
              pathOptions={{ color: "#F59E0B", weight: 2, fillColor: "#FDE68A", fillOpacity: 0.6 }}
            >
              <Popup
                closeOnClick={false}
                autoClose={false}
                autoPan={false}
                interactive={true} // ✅ permet les clics dans le contenu
              >
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 800, color: "#213A57", marginBottom: 8 }}>Nouvel évènement</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      placeholder="Titre"
                      value={draftEvent.title}
                      onChange={(e) => setDraftEvent({ ...draftEvent, title: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />
                    <input
                      type="datetime-local"
                      value={draftEvent.when}
                      onChange={(e) => setDraftEvent({ ...draftEvent, when: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={draftEvent.rank}
                        onChange={(e) => setDraftEvent({ ...draftEvent, rank: e.target.value })}
                        style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B", flex: 1 }}
                      >
                        {RANKS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      placeholder="Description (optionnel)"
                      value={draftEvent.description}
                      onChange={(e) => setDraftEvent({ ...draftEvent, description: e.target.value })}
                      rows={3}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        type="button" // ✅ important pour éviter un submit fantôme
                        onClick={() => {
                          console.log("Clic bouton créer ✅");
                          saveEvent();
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "none",
                          background: "#45DFB1",
                          color: "#213A57",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Créer
                      </button>
                      <button
                        onClick={() => setDraftEvent(null)}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #213A57",
                          background: "transparent",
                          color: "#213A57",
                          fontWeight: 700,
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {/* Résumé sous la carte */}
      <div
        style={{
          marginTop: 12,
          color: "#E0F2F1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>{filteredUsers.length} utilisateur(s) visible(s)</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Astuce : active “Créer un évènement”, puis clique sur la carte pour positionner l’évènement.
        </div>
      </div>
    </div>
  );
}