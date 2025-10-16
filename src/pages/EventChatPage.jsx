import React, { useEffect, useState } from "react";

export default function EventChatPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
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

    fetchMessages(); // premier chargement
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);



  useEffect(() => {
    fetch("http://backend.react.test:8000/api/events", { credentials: "include" })
      .then((res) => res.json())
      .then(setEvents)
      .catch((err) => console.error("Erreur fetch events:", err));
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    fetch(`http://backend.react.test:8000/api/events/${selectedEvent.id}/messages`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setMessages)
      .catch((err) => console.error("Erreur fetch messages:", err));
  }, [selectedEvent]);

  async function sendMessage() {
  if (!newMessage.trim() || !selectedEvent) return;

  try {
    // 1️⃣ D’abord, on initialise le cookie CSRF de Laravel
    await fetch("http://backend.react.test:8000/sanctum/csrf-cookie", {
      credentials: "include",
    });

    // 2️⃣ Ensuite, on récupère le token du cookie
    const csrfToken = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1] || ""
    );


    // 3️⃣ Enfin, on envoie le message
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
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E5E7EB",
                background: "#45DFB1",
                color: "#213A57",
                fontWeight: 700,
              }}
            >
              {selectedEvent.title}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: 16, overflowY: "auto", background: "#F9FAFB" }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: m.isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background: m.isMine ? "#45DFB1" : "#E5E7EB",
                      color: m.isMine ? "#213A57" : "#111827",
                      padding: "10px 14px",
                      borderRadius: 12,
                      maxWidth: "70%",
                    }}
                  >
                    {m.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Zone de saisie */}
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
    </div>
  );
}
