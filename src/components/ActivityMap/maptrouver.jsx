import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../hooks/AuthStore";

const RANKS = ["S", "A", "B", "C", "D", "E", "F"];
const API_BASE = (import.meta.env.VITE_BACKEND_URL || "https://backend.riseupmotion.com").replace(/\/$/, "");
const EVENTS_URL = `${API_BASE}/api/events`;

const rankColor = (r) =>
  ({
    S: "#ffd700",
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

// Composant pour capter le clic afin de positionner manuellement l’utilisateur
function ClickToSetUser({ enabled, onClick }) {
  useMapEvents({
    click(e) {
      if (enabled) onClick(e.latlng);
    },
  });
  return null;
}

export default function MapTrouver({
  initialCenter = [48.8566, 2.3522],
  users: usersProp = [],
}) {
  const { user } = useAuthStore();

  // 🧭 États principaux
  const [userPos, setUserPos] = useState(initialCenter);
  const [users, setUsers] = useState(usersProp || []);
  const [selectedRanks, setSelectedRanks] = useState(new Set(RANKS));
  const [hourStart, setHourStart] = useState(0);
  const [hourEnd, setHourEnd] = useState(23);

  // 🎯 Filtres pour les événements
  const [searchTitle, setSearchTitle] = useState("");
  const [filterAllure, setFilterAllure] = useState("");
  const [filterType, setFilterType] = useState("");

  // 📍 Gestion création d’événements
  const [createMode, setCreateMode] = useState(false);
  const [setUserPosMode, setSetUserPosMode] = useState(false);
  const [draftEvent, setDraftEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [creationFeedback, setCreationFeedback] = useState("");


useEffect(() => {
  const fetchEvents = () => {
    fetch(EVENTS_URL, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setEvents((data || []).filter((ev) => ev.created_by))) // retire les faux évènements sans auteur
      .catch((err) => console.error("Erreur fetch events:", err));
  };

  // Premier chargement
  fetchEvents();

  // Écoute quand un event est ajouté depuis ActivityFeed
  window.addEventListener("eventsUpdated", fetchEvents);

  // Nettoyage à la destruction du composant
  return () => window.removeEventListener("eventsUpdated", fetchEvents);
}, []);



function getCsrfToken() {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
  return token ? decodeURIComponent(token) : null;
}

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
  const map = window.L?.mapInstance; // récupère la carte globale si tu l’as
  if (map) {
    map.panTo([latlng.lat - 0.002, latlng.lng]); // 👈 décalage léger vers le bas
  }

  setDraftEvent({
    lat: latlng.lat,
    lng: latlng.lng,
    title: "",
    when: "",
    rank: "C",
    description: "",
    kilometre: "",
    allure_visee: "",
    type: "",
  });
}


// Fonction pour créer un évènement
async function saveEvent() {
  if (!draftEvent || !draftEvent.title?.trim()) {
    alert("Renseigne un titre pour l’évènement.");
    return;
  }
  if (!draftEvent.lat || !draftEvent.lng) {
    alert("Clique sur la carte pour positionner l’évènement.");
    return;
  }
  if (!draftEvent.when) {
    alert("Renseigne la date/heure de l’évènement.");
    return;
  }

  try {
    const csrfToken = getCsrfToken();
    const res = await fetch(EVENTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
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
        kilometre: draftEvent.kilometre,
        allure_visee: draftEvent.allure_visee,
        type: draftEvent.type,
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      console.error("Erreur création event:", res.status, message);
      alert("Création impossible: " + message);
      return;
    }

    const newEvent = await res.json();
    setEvents((prev) => [
      ...prev,
      { ...newEvent, isJoined: true, participants_count: (newEvent.participants_count ?? 0) + 1 },
    ]);

    // Auto-inscription à l'évènement fraîchement créé
    try {
      await fetch(`${EVENTS_URL}/${newEvent.id}/join`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
      });
    } catch (joinErr) {
      console.error("Erreur auto-join event:", joinErr);
    }

    setDraftEvent(null);
    setCreateMode(false);
    setSetUserPosMode(false);
    setCreationFeedback(
      "Super, tu viens de créer un évènement sportif ! Les autres utilisateurs pourront le voir et le rejoindre. N’hésite pas à contacter tes amis également."
    );
    window.dispatchEvent(new Event("eventsUpdated")); // 🔄 actualise ActivityFeed
  } catch (err) {
    console.error("Erreur création event:", err);
  }
}


// Fonction pour rejoindre un évènement
async function joinEvent(eventId) {
  try {
    const csrfToken = getCsrfToken();
    const res = await fetch(`${EVENTS_URL}/${eventId}/join`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken, // ✅ Ajout ici
      },
      
    });
    if (!res.ok) {
      const txt = await res.text();
      alert("Inscription impossible : " + txt);
      return;
    }

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
    const res = await fetch(`${EVENTS_URL}/${eventId}/leave`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken, // ✅ Ajout ici
      }
    });
    if (!res.ok) {
      const txt = await res.text();
      alert("Impossible de se désinscrire : " + txt);
      return;
    }

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
    const res = await fetch(`${EVENTS_URL}/${eventId}`, {
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
  if (res.status === 422 && errData.details) {
    const allErrors = Object.values(errData.details)
      .flat()
      .join("\n");
    alert("Erreurs de validation :\n" + allErrors);
  }

}
const filteredEvents = useMemo(() => {
  return events.filter((ev) => {
    const matchRank = selectedRanks.has(ev.training_rank);
    const matchTitle =
      searchTitle.trim() === "" ||
      ev.title?.toLowerCase().includes(searchTitle.toLowerCase());
    const matchAllure =
      filterAllure.trim() === "" ||
      ev.allure_visee?.toLowerCase().includes(filterAllure.toLowerCase());
    const matchType =
      filterType.trim() === "" ||
      ev.type?.toLowerCase().includes(filterType.toLowerCase());

    return matchRank && matchTitle && matchAllure && matchType;
  });
}, [events, selectedRanks, searchTitle, filterAllure, filterType]);


  return (
    <div
      className="map-trouver"
      style={{
        background: "#213A57",
        borderRadius: 16,
        padding: 16,
        width: "100%",
        border: "1px solid rgba(69,223,177,0.25)",
      }}
    >
      <h3 style={{ color: "#E0F2F1", margin: "0 0 12px" }}>Carte des utilisateurs</h3>
      {creationFeedback && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(69,223,177,0.12)",
            color: "#E0F2F1",
            border: "1px solid rgba(69,223,177,0.3)",
            fontWeight: 600,
          }}
        >
          {creationFeedback}
        </div>
      )}

      {/* Toolbar filtres + bouton événement */}
      <div className="map-trouver__toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <div className="map-trouver__ranks" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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

        <div className="map-trouver__actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: "#E0F2F1" }}>
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
            onClick={() => {
              setCreationFeedback("");
              setCreateMode((m) => !m);
            }}
            style={{ padding: "8px 14px", borderRadius: 12, border: "none", background: "#45DFB1", color: "#FFF", fontWeight: 700 }}
          >
            {createMode ? "Annuler" : "Créer un évènement"}
          </button>
          <button
            onClick={() => {
              setSetUserPosMode((m) => !m);
              setCreateMode(false);
            }}
            style={{ padding: "8px 14px", borderRadius: 12, border: "1px solid #45DFB1", background: setUserPosMode ? "#45DFB1" : "transparent", color: "#E0F2F1", fontWeight: 700 }}
          >
            {setUserPosMode ? "Cliquez sur la carte…" : "Me positionner"}
          </button>
        </div>
      </div>
      {/* Filtres de recherche pour les événements */}
      <div
        className="map-trouver__filters"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 12,
          marginBottom: 10, // 👈 ajoute un espace sous les filtres
        }}
      >

        <input
          type="text"
          placeholder="Rechercher un titre"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #14919B",
            background: "#173047",
            color: "#E0F2F1",
          }}
        />

        <input
          type="text"
          placeholder="Allure visée (ex: 5:00/km)"
          value={filterAllure}
          onChange={(e) => setFilterAllure(e.target.value)}
          style={{
            flex: 1,
            minWidth: 160,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #14919B",
            background: "#173047",
            color: "#E0F2F1",
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            flex: 1,
            minWidth: 160,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #14919B",
            background: "#173047",
            color: "#E0F2F1",
          }}
        >
          <option value="">Type de séance</option>
          <option value="Endurance">Endurance</option>
          <option value="Fractionné">Fractionné</option>
          <option value="Sortie longue">Sortie longue</option>
          <option value="Récupération">Récupération</option>
        </select>

        <button
          onClick={() => {
            setSearchTitle("");
            setFilterAllure("");
            setFilterType("");
          }}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #45DFB1",
            background: "transparent",
            color: "#45DFB1",
            fontWeight: 600,
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Carte */}
      <div className="map-trouver__map" style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(69,223,177,0.25)" }}>
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
          <ClickToSetUser
            enabled={setUserPosMode}
            onClick={(latlng) => {
              setUserPos([latlng.lat, latlng.lng]);
              setSetUserPosMode(false);
            }}
          />

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
                autoPan={true}                // ✅ active le recentrage automatique
                autoPanPadding={[50, 100]}    // ✅ ajoute une marge (100px vers le haut)
                interactive={true}
                open={true}                   // ✅ ouvre automatiquement à la création
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

                    <textarea
                      placeholder="Description (optionnel)"
                      value={draftEvent.description}
                      onChange={(e) => setDraftEvent({ ...draftEvent, description: e.target.value })}
                      rows={2}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />

                    <input
                      type="datetime-local"
                      value={draftEvent.when}
                      onChange={(e) => setDraftEvent({ ...draftEvent, when: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />

                    <select
                      value={draftEvent.rank}
                      onChange={(e) => setDraftEvent({ ...draftEvent, rank: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    >
                      {RANKS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Distance (km)"
                      value={draftEvent.kilometre || ""}
                      onChange={(e) => setDraftEvent({ ...draftEvent, kilometre: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />

                    <input
                      type="text"
                      placeholder="Allure visée (ex: 5:00/km)"
                      value={draftEvent.allure_visee || ""}
                      onChange={(e) => setDraftEvent({ ...draftEvent, allure_visee: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    />

                    <select
                      value={draftEvent.type || ""}
                      onChange={(e) => setDraftEvent({ ...draftEvent, type: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #14919B" }}
                    >
                      <option value="">Type de séance</option>
                      <option value="Endurance">Endurance</option>
                      <option value="Fractionné">Fractionné</option>
                      <option value="Sortie longue">Sortie longue</option>
                      <option value="Récupération">Récupération</option>
                    </select>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={saveEvent}
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
        className="map-trouver__summary"
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
