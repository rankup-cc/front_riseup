import React, { useEffect, useState } from "react";
import { useAuthStore } from "../hooks/AuthStore";
import { useParams } from "react-router-dom";

export default function EventChatPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { id } = useParams();

  const { user, fetchUser, isFetchingUser } = useAuthStore();

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  const currentUserId = user?.id;

  useEffect(() => {
  fetch("http://backend.react.test:8000/api/user/events", { credentials: "include" })
    .then((res) => {
      if (!res.ok) throw new Error("Non autorisé");
      return res.json();
    })
    .then((data) => {
      setEvents(data);

      // 👇 Si on a un id dans l’URL, on sélectionne le bon event
      const eventFromUrl = data.find((ev) => ev.id === parseInt(id));

      if (eventFromUrl) {
        setSelectedEvent(eventFromUrl);
      } 
      // 👇 Sinon, on redirige vers le premier event existant
      else if (!id && data.length > 0) {
        const firstEvent = data[0];
        window.history.replaceState({}, "", `/events/chat/${firstEvent.id}`);
        setSelectedEvent(firstEvent);
      }
    })
    .catch((err) => console.error("Erreur fetch user events:", err));
}, [id]);


  useEffect(() => {
    if (!selectedEvent) return;

    const fetchMessages = () => {
      fetch(`http://backend.react.test:8000/api/events/${selectedEvent.id}/messages`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setMessages)
        .catch((err) => console.error("Erreur fetch messages:", err));
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  async function sendMessage() {
    if (!newMessage.trim() || !selectedEvent) return;

    try {
      await fetch("http://backend.react.test:8000/sanctum/csrf-cookie", { credentials: "include" });
     let csrfToken = "";
      try {
        const cookie = document.cookie || "";
        const tokenPart = cookie.split("; ").find((row) => row.startsWith("XSRF-TOKEN="));
        if (tokenPart) {
          csrfToken = decodeURIComponent(tokenPart.split("=")[1]);
        }
    } catch (e) {
      console.warn("⚠️ Impossible de lire le cookie XSRF-TOKEN :", e);
    }

      const res = await fetch(
        `http://backend.react.test:8000/api/events/${selectedEvent.id}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Erreur backend:", res.status, errText);
        alert("Erreur d’envoi du message (" + res.status + ")");
        return;
      }

      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      console.error("Erreur JS:", err);
      alert("Impossible d’envoyer le message. Vérifie ta connexion ou le backend.");
    }
  }

  if (isFetchingUser) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "90vh" }}>
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "90vh", color: "#9CA3AF" }}>
        ⚠️ Vous devez être connecté pour accéder à la discussion.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "90vh", background: "#F3F4F6", borderRadius: 16, overflow: "hidden" }}>
      {/* --- Liste des événements (gauche) --- */}
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #E5E7EB",
          background: "#213A57",
          color: "#E0F2F1",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "700" }}>
          Événements
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background: selectedEvent?.id === ev.id ? "rgba(69,223,177,0.15)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontWeight: "600" }}>{ev.title}</div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>{ev.type || "Type inconnu"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Discussion (droite) --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
        {!selectedEvent ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
            💬 Sélectionne un événement à gauche
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E5E7EB",
                background: "#45DFB1",
                color: "#213A57",
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{selectedEvent.title}</span>

              <button
                onClick={() => setShowEventInfo(true)}
                style={{
                  background: "#45DFB1",
                  border: "none",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#213A57"
                  style={{ width: 18, height: 18 }}
                >
                  <circle cx="12" cy="12" r="10" stroke="#213A57" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="8" stroke="#213A57" strokeWidth="2" />
                  <line x1="12" y1="10" x2="12" y2="16" stroke="#213A57" strokeWidth="2" />
                </svg>
              </button>

            </div>

            <div style={{ flex: 1, padding: 16, overflowY: "auto", background: "#F9FAFB" }}>
              {messages.map((m) => {
                const isMine = m.user?.id === currentUserId;
                return (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 12,
                      display: "flex",
                      flexDirection: isMine ? "row-reverse" : "row",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    {!isMine && (
                      <img
                        src={
                          m.user?.profile_photo_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.name || "U")}`
                        }
                        alt={m.user?.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMine ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                      }}
                    >
                      {!isMine && (
                        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>
                          {m.user?.name || "Utilisateur"}
                        </div>
                      )}
                      <div
                        style={{
                          background: isMine ? "#45DFB1" : "#E5E7EB",
                          color: isMine ? "#213A57" : "#111827",
                          padding: "10px 14px",
                          borderRadius: 16,
                          borderTopRightRadius: isMine ? 0 : 16,
                          borderTopLeftRadius: isMine ? 16 : 0,
                          wordBreak: "break-word",
                        }}
                      >
                        {m.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: 12, borderTop: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Écris un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flex: 1,
                  borderRadius: 20,
                  border: "1px solid #D1D5DB",
                  padding: "10px 14px",
                  outline: "none",
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  background: "#45DFB1",
                  color: "#213A57",
                  border: "none",
                  borderRadius: 20,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>

      {/* ✅ MODALE D’INFORMATION (placée à la bonne position) */}
      {showEventInfo && selectedEvent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setShowEventInfo(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 24,
              width: "90%",
              maxWidth: 400,
              color: "#213A57",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEventInfo(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                border: "none",
                background: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "#213A57",
              }}
            >
              ✕
            </button>

            <h2 style={{ color: "#45DFB1", marginBottom: 10 }}>{selectedEvent.title}</h2>
            <p><strong>Description :</strong> {selectedEvent.description || "Aucune description"}</p>
            <p><strong>Type :</strong> {selectedEvent.type || "Non précisé"}</p>
            <p><strong>Allure visée :</strong> {selectedEvent.allure_visee || "-"}</p>
            <p><strong>Distance :</strong> {selectedEvent.kilometre ? `${selectedEvent.kilometre} km` : "-"}</p>
            <p><strong>Rang :</strong> {selectedEvent.training_rank || "-"}</p>
            <p><strong>Adresse :</strong> {selectedEvent.address || "Non renseignée"}</p>
            <p><strong>Date :</strong> {selectedEvent.start_time ? new Date(selectedEvent.start_time).toLocaleString() : "Non précisée"}</p>
            {/* ✅ Liste des participants */}
            <div style={{ marginTop: 16 }}>
              <strong>Participants :</strong>
              {selectedEvent.participants && selectedEvent.participants.length > 0 ? (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {selectedEvent.participants.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 70,
                    }}
                  >
                    <img
                      src={
                        p.profile_photo_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "U")}&background=45DFB1&color=213A57`
                      }
                      alt={p.name || "Inconnu"}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: 4,
                      }}
                    />
                    <span style={{ fontSize: 12, textAlign: "center" }}>
                      {p.name?.split(" ")[0] || "Inconnu"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6B7280", marginTop: 4 }}>Aucun participant pour le moment</p>
            )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
