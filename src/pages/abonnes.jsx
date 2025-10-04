// src/pages/abonnes.jsx
import React, { useState } from "react";

const COLORS = {
  bg: "#213A57",
  card: "#E0F2F1",
  accent: "#45DFB1",
  accent2: "#14919B",
  textDark: "#213A57",
  textLight: "#E0F2F1",
  border: "rgba(69, 223, 177, 0.2)",
};

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d || "-";
  }
}

function Pill({ children, color }) {
  return (
    <span
      style={{
        background: color || COLORS.accent,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function EventCard({ ev, tint = COLORS.accent }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 15,
        padding: 20,
        color: COLORS.textDark,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{ev.title}</div>
          <div style={{ color: COLORS.accent2, fontSize: 13 }}>{ev.location ?? "—"}</div>
        </div>
        <Pill color={tint}>{ev.type || "Évènement"}</Pill>
      </div>
      <div style={{ fontSize: 14, marginBottom: 6 }}>
        📆 {fmtDate(ev.start_time)} → {fmtDate(ev.end_time)}
      </div>
      <div style={{ fontSize: 14 }}>
        📏 {ev.kilometre ?? "-"} km — ⏱ {ev.allure_visee ?? "-"}
      </div>
      {ev.description && (
        <p style={{ marginTop: 8, color: COLORS.accent2 }}>{ev.description}</p>
      )}
    </div>
  );
}

function PersonCard({ p }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 15,
        padding: 16,
        color: COLORS.textDark,
        border: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            color: COLORS.textLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
          }}
        >
          {p.initials}
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{p.name}</div>
          <div style={{ color: COLORS.accent2, fontSize: 13 }}>{p.bio || "Coureur·se"}</div>
        </div>
      </div>
    </div>
  );
}

export default function AbonnesPage() {
  const [followers] = useState([
    { id: 1, name: "Sophie Martin", initials: "S", bio: "Trail & montagne" },
    { id: 2, name: "Thomas Leblanc", initials: "T", bio: "10k addict" },
  ]);

  const [upcoming] = useState([
    {
      id: 11,
      title: "Sortie longue dominicale",
      type: "Intermédiaire",
      location: "Bois de Boulogne",
      start_time: new Date(Date.now() + 36e5).toISOString(),
      end_time: new Date(Date.now() + 3 * 36e5).toISOString(),
      kilometre: 18.5,
      allure_visee: "5:15/km",
      description: "Allure confortable, café après ✨",
    },
  ]);

  const [past] = useState([
    {
      id: 21,
      title: "Sortie récupération",
      type: "Facile",
      location: "Parc Montsouris",
      start_time: new Date(Date.now() - 48 * 36e5).toISOString(),
      end_time: new Date(Date.now() - 47 * 36e5).toISOString(),
      kilometre: 6.5,
      allure_visee: "5:45/km",
      description: "Jambes légères, super météo 😌",
    },
  ]);

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        padding: 24,
        border: `1px solid ${COLORS.border}`,
        fontFamily: "'Inter', sans-serif",
        color: COLORS.textLight,
      }}
    >
      <h2 style={{ marginBottom: 20 }}>👥 Mon réseau & Événements</h2>

      {/* Section abonnés */}
      <h3 style={{ marginBottom: 10 }}>Mes abonnés ({followers.length})</h3>
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {followers.map((p) => (
          <PersonCard key={p.id} p={p} />
        ))}
      </div>

      {/* Section événements futurs */}
      <h3 style={{ marginBottom: 10 }}>📅 Événements à venir ({upcoming.length})</h3>
      <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
        {upcoming.map((ev) => (
          <EventCard key={ev.id} ev={ev} tint="#FFD700" />
        ))}
      </div>

      {/* Section événements passés */}
      <h3 style={{ marginBottom: 10 }}>⏮️ Événements passés ({past.length})</h3>
      <div style={{ display: "grid", gap: 14 }}>
        {past.map((ev) => (
          <EventCard key={ev.id} ev={ev} tint={COLORS.accent2} />
        ))}
      </div>
    </div>
  );
}
