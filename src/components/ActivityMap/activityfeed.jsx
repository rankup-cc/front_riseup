import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../hooks/AuthStore";
import { useNavigate } from "react-router-dom";


const ActivityFeed = () => {

const navigate = useNavigate();
const [activeTab, setActiveTab] = useState("activities");
const [events, setEvents] = useState([]);
const [showCreateForm, setShowCreateForm] = useState(false);
const [showMineOnly, setShowMineOnly] = useState(false);
const { user } = useAuthStore();
const [addressQuery, setAddressQuery] = useState(""); // texte tapé
const [addressResults, setAddressResults] = useState([]); // suggestions de l’API
const [isCreating, setIsCreating] = useState(false);
// 🔍 Filtres
const [searchTitle, setSearchTitle] = useState("");
const [filterAllure, setFilterAllure] = useState("");
const [filterType, setFilterType] = useState("");



  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    latitude: 48.8566,
    longitude: 2.3522,
    location: "",
    start_time: "",
    end_time: "",
    training_rank: "C",
    kilometre: "",
    allure_visee: "",
    type: "",
  });

  const RANKS = ["S", "A", "B", "C", "D", "E", "F"];

  // --- Charger les événements depuis Laravel ---
useEffect(() => {
  fetch("http://backend.react.test:8000/api/events", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then(setEvents)
    .catch((err) => console.error("Erreur fetch events:", err));
}, []);

  // --- Récupérer le token CSRF ---
  function getCsrfToken() {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];
    return token ? decodeURIComponent(token) : null;
  }

  // --- Créer un nouvel événement ---
 // --- Créer un nouvel événement ---
async function createEvent() {
  if (isCreating) return; // ✅ empêche le double clic
    setIsCreating(true);
  try {
    const csrfToken = getCsrfToken();

    // ✅ Construire le bon payload à envoyer au backend

    const newEventData = {
    title: newEvent.title,
    description: newEvent.description,
    address: newEvent.location, // l’adresse choisie
    start_time: newEvent.start_time,
    end_time: newEvent.end_time,
    training_rank: newEvent.training_rank,
    kilometre: newEvent.kilometre,
    allure_visee: newEvent.allure_visee,
    type: newEvent.type,
    };

    const res = await fetch("http://backend.react.test:8000/api/events", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
      },
      body: JSON.stringify(newEventData), // 👈 on envoie bien l'adresse
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Erreur backend:", errData);

      if (res.status === 422 && errData.details) {
        // Erreur de validation Laravel
        const firstError = Object.values(errData.details)[0][0];
        alert("Erreur de validation : " + firstError);
      } else {
        alert(errData.error || "Erreur lors de la création de l'événement");
      }
      return;
    }

    const data = await res.json();
    setEvents((prev) => [...prev, data]);
    setShowCreateForm(false);
    // Force un petit rechargement global des events après 1 seconde
    setTimeout(() => {
      fetch("http://backend.react.test:8000/api/events", { credentials: "include" })
        .then((res) => res.json())
        .then(setEvents)
        .catch((err) => console.error("Erreur refresh events:", err));
    }, 1000);

    // ✅ reset du formulaire
    setNewEvent({
      title: "",
      description: "",
      latitude: 48.8566,
      longitude: 2.3522,
      location: "",
      start_time: "",
      end_time: "",
      training_rank: "C",
      kilometre: "",
      allure_visee: "",
      type: "",
    });
    window.dispatchEvent(new Event("eventsUpdated"));
    setAddressQuery("");
    setAddressResults([]);

  } catch (err) {
    console.error("Erreur création event:", err);
    alert("Erreur côté client : impossible de créer l'événement");
  }finally {
    setIsCreating(false); // ✅ Réactive le bouton
  }
}


  // --- Rejoindre / quitter un événement ---
  async function joinEvent(eventId) {
    const csrfToken = getCsrfToken();
    await fetch(`http://backend.react.test:8000/api/events/${eventId}/join`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
      },
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              isJoined: true,
              participants_count: (ev.participants_count ?? 0) + 1,
            }
          : ev
      )
    );
  }

  async function leaveEvent(eventId) {
    const csrfToken = getCsrfToken();
    await fetch(`http://backend.react.test:8000/api/events/${eventId}/leave`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
      },
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              isJoined: false,
              participants_count: Math.max(0, (ev.participants_count ?? 1) - 1),
            }
          : ev
      )
    );
  }

  // --- Supprimer un événement ---
  async function deleteEvent(eventId) {
    if (!window.confirm("Supprimer cet évènement ?")) return;

    const csrfToken = getCsrfToken();
    await fetch(`http://backend.react.test:8000/api/events/${eventId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
      },
    });

    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
  }

  // --- Couleur selon le rang ---
  const getDifficultyColor = (rank) => {
    switch (rank) {
      case "S": return "#FFD700";
      case "A": return "#45DFB1";
      case "B": return "#14919B";
      case "C": return "#4A9EFF";
      case "D": return "#9CA3AF";
      case "E": return "#F59E0B";
      case "F": return "#EF4444";
      default: return "#45DFB1";
    }
  };

// --- Filtrage combiné ---
const filteredEvents = events.filter((ev) => {
  const matchesTitle = ev.title
    ?.toLowerCase()
    .includes(searchTitle.toLowerCase());
  const matchesAllure = filterAllure
    ? ev.allure_visee?.toLowerCase().includes(filterAllure.toLowerCase())
    : true;
  const matchesType = filterType ? ev.type === filterType : true;
  return matchesTitle && matchesAllure && matchesType;
});

// --- Si “mes événements uniquement” est activé ---
const displayedEvents = showMineOnly
  ? filteredEvents.filter((ev) => ev.created_by === user?.id)
  : filteredEvents;

// 🔍 Fonction de recherche d’adresses via Nominatim
async function searchAddress(query) {
  if (query.length < 3) return setAddressResults([]); // éviter les requêtes inutiles

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    setAddressResults(
      data.map((item) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }))
    );
  } catch (err) {
    console.error("Erreur recherche adresse:", err);
  }
}

  return (
    <div
      style={{
        backgroundColor: "#213A57",
        borderRadius: "20px",
        padding: "25px",
        border: "1px solid rgba(69, 223, 177, 0.2)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* --- Onglets --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(69, 223, 177, 0.2)",
          paddingBottom: 10,
          marginBottom: 20,
        }}
      >
        <h3 style={{ color: "#E0F2F1", fontSize: 22 }}>
          {activeTab === "activities"
            ? "Fil d'actualités"
            : "Événements communautaires"}
        </h3>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setActiveTab("activities")}
            style={{
              background:
                activeTab === "activities"
                  ? "#45DFB1"
                  : "rgba(69, 223, 177, 0.2)",
              border: "none",
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            🏃‍♂️
          </button>
          <button
            onClick={() => setActiveTab("events")}
            style={{
              background:
                activeTab === "events" ? "#45DFB1" : "rgba(69, 223, 177, 0.2)",
              border: "none",
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            📅
          </button>
        </div>
      </div>

      {/* --- Contenu événements --- */}
      {activeTab === "events" && (
        <>
          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <button
              onClick={() => setShowCreateForm((s) => !s)}
              style={{
                background: "#45DFB1",
                color: "#213A57",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {showCreateForm ? "Annuler" : "Créer un événement"}
            </button>

            <label style={{ color: "#E0F2F1", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showMineOnly}
                onChange={(e) => setShowMineOnly(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Mes événements uniquement
            </label>
          </div>

          {/* Formulaire création */}
          {showCreateForm && (
            <div
              style={{
                background: "#E0F2F1",
                color: "#213A57",
                padding: 16,
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <input
                placeholder="Titre"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                style={{
                  display: "block",
                  marginBottom: 10,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                }}
              />

              <textarea
                placeholder="Description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                rows={2}
                style={{
                  display: "block",
                  marginBottom: 10,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                }}
              />
            {/* Champ d’adresse avec suggestions */}
            <div style={{ position: "relative", marginBottom: 10 }}>
            <input
                type="text"
                placeholder="Adresse (ex: 12 rue de Paris, Lyon)"
                value={addressQuery}
                onChange={(e) => {
                setAddressQuery(e.target.value);
                searchAddress(e.target.value);
                }}
                style={{
                display: "block",
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #14919B",
                }}
            />

            {/* Menu déroulant de suggestions */}
            {addressResults.length > 0 && (
                <ul
                style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#FFFFFF",
                    border: "1px solid #14919B",
                    borderRadius: "8px",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    maxHeight: "150px",
                    overflowY: "auto",
                    zIndex: 10,
                }}
                >
                {addressResults.map((addr, index) => (
                    <li
                    key={index}
                    onClick={() => {
                        setNewEvent({
                        ...newEvent,
                        location: addr.display_name,
                        latitude: addr.lat,
                        longitude: addr.lon,
                        });
                        setAddressQuery(addr.display_name);
                        setAddressResults([]); // fermer le menu
                    }}
                    style={{
                        padding: "8px",
                        cursor: "pointer",
                        borderBottom: "1px solid #EEE",
                    }}
                    >
                    {addr.display_name}
                    </li>
                ))}
                </ul>
            )}
            </div>


              <input
                type="datetime-local"
                value={newEvent.start_time}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, start_time: e.target.value })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              />

              <input
                type="number"
                placeholder="Distance (km)"
                value={newEvent.kilometre || ""}
                onChange={(e) =>
                  setNewEvent({
                    ...newEvent,
                    kilometre: parseFloat(e.target.value),
                  })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              />

              <input
                type="text"
                placeholder="Allure visée (ex: 5:00/km)"
                value={newEvent.allure_visee || ""}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, allure_visee: e.target.value })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              />

              <select
                value={newEvent.type || ""}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, type: e.target.value })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              >
                <option value="">Type de séance</option>
                <option value="Endurance">Endurance</option>
                <option value="Fractionné">Fractionné</option>
                <option value="Sortie longue">Sortie longue</option>
                <option value="Récupération">Récupération</option>
              </select>

              <select
                value={newEvent.training_rank}
                onChange={(e) =>
                  setNewEvent({
                    ...newEvent,
                    training_rank: e.target.value,
                  })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                onClick={createEvent}
                disabled={isCreating}
                style={{
                  background: isCreating ? "#9CA3AF" : "#45DFB1",
                  color: "#213A57",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  cursor: isCreating ? "not-allowed" : "pointer",
                }}
              >
                {isCreating ? "Création..." : "Créer"}
              </button>

            </div>
          )}
          {/* Filtres */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
              background: "#E0F2F1",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <input
              type="text"
              placeholder="Rechercher un titre..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              style={{
                flex: 1,
                minWidth: 180,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #14919B",
              }}
            />

            <input
              type="text"
              placeholder="Allure visée (ex: 5:00/km)"
              value={filterAllure}
              onChange={(e) => setFilterAllure(e.target.value)}
              style={{
                flex: 1,
                minWidth: 150,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #14919B",
              }}
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                flex: 1,
                minWidth: 150,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #14919B",
              }}
            >
              <option value="">Tous les types</option>
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
                background: "#45DFB1",
                color: "#213A57",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
              }}
            >
              Réinitialiser
            </button>
          </div>

          {/* Liste d'événements */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {[...displayedEvents]
              .sort((a, b) => {
                // 🔹 Si "a" est rejoint et pas "b", a vient avant
                if (a.isJoined && !b.isJoined) return -1;
                // 🔹 Si "b" est rejoint et pas "a", b vient avant
                if (!a.isJoined && b.isJoined) return 1;
                // 🔹 Sinon, tri secondaire : du plus récent au plus ancien
                return new Date(b.created_at) - new Date(a.created_at);
              })
              .map((event) => {

              const isMine = user && event.created_by === user.id;

              return (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: "#E0F2F1",
                    borderRadius: "15px",
                    padding: "20px",
                    color: "#213A57",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <b>{event.title}</b>
                    <span
                      style={{
                        background: getDifficultyColor(event.training_rank),
                        color: "#213A57",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        fontWeight: "600",
                      }}
                    >
                      Rang {event.training_rank}
                    </span>
                  </div>

                  <p>{event.description}</p>
                  <div style={{ color: "#14919B", fontSize: "14px" }}>
                    📍 {event.address ?? "Adresse inconnue"}<br />
                    📏 {event.kilometre ?? "-"} km — ⏱ {event.allure_visee ?? "-"} <br />
                    🏋️ Type : {event.type ?? "-"} <br />
                    👥 Participants : {event.participants_count ?? 0}
                      

                    </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                  {/* Bouton rejoindre / se désinscrire */}
                  <button
                    onClick={() =>
                      event.isJoined
                        ? leaveEvent(event.id)
                        : joinEvent(event.id)
                    }
                    style={{
                      background: event.isJoined ? "#14919B" : "#45DFB1",
                      color: "#213A57",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {event.isJoined ? "Se désinscrire" : "Rejoindre"}
                  </button>

                  {/* Bouton discussion visible seulement si inscrit */}
                  {event.isJoined && (
                    <button
                      onClick={() => navigate(`/events/${event.id}/chat`)}
                      style={{
                        background: "#173047",
                        color: "#45DFB1",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      💬 Discussion
                    </button>
                  )}


                  {/* Bouton supprimer visible seulement si c’est ton événement */}
                  {isMine && (
                    <button
                      onClick={() => deleteEvent(event.id)}
                      style={{
                        background: "#EF4444",
                        color: "#FFF",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: "600",
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityFeed;
