import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../hooks/AuthStore";

const ActivityFeed = () => {
  const [activeTab, setActiveTab] = useState("activities");
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const { user } = useAuthStore();

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    latitude: 48.8566,
    longitude: 2.3522,
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
    fetch("http://backend.react.test:8000/api/events", { credentials: "include" })
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
  async function createEvent() {
    try {
      const csrfToken = getCsrfToken();
      const res = await fetch("http://backend.react.test:8000/api/events", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify(newEvent),
      });

      const data = await res.json();
      setEvents((prev) => [...prev, data]);
      setShowCreateForm(false);

      // reset du formulaire
      setNewEvent({
        title: "",
        description: "",
        latitude: 48.8566,
        longitude: 2.3522,
        start_time: "",
        end_time: "",
        training_rank: "C",
        kilometre: "",
        allure_visee: "",
        type: "",
      });
    } catch (err) {
      console.error("Erreur création event:", err);
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

  // --- Filtre “mes événements uniquement” ---
  const displayedEvents = showMineOnly
    ? events.filter((ev) => ev.created_by === user?.id)
    : events;

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
                style={{
                  background: "#45DFB1",
                  color: "#213A57",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                }}
              >
                Créer
              </button>
            </div>
          )}

          {/* Liste d'événements */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {displayedEvents.map((event) => {
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
                    📏 {event.kilometre ?? "-"} km — ⏱ {event.allure_visee ?? "-"}
                    <br />
                    🏋️ Type : {event.type ?? "-"}
                    <br />
                    👥 Participants : {event.participants_count ?? 0}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
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
