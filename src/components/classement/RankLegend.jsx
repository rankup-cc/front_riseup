import React from "react";

const RANKS = [
  { key: "S",  color: "#F5E60B", label: "S",  desc: "Sommet" },
  { key: "A+", color: "#AF0606", label: "A+", desc: "Maître" },
  { key: "A",  color: "#FF4C4C", label: "A",  desc: "Expert" },
  { key: "A-", color: "#DF6868", label: "A-", desc: "Avancé" },
  { key: "B+", color: "#0000CC", label: "B+", desc: "Très assidu" },
  { key: "B",  color: "#4C6EFF", label: "B",  desc: "Assidu" },
  { key: "B-", color: "#9999FF", label: "B-", desc: "Régulier" },
  { key: "C+", color: "#006600", label: "C+", desc: "Explorateur" },
  { key: "C",  color: "#00CC00", label: "C",  desc: "Actif" },
  { key: "C-", color: "#99FF99", label: "C-", desc: "Occasionnel" },
  { key: "D+", color: "#50005C", label: "D+", desc: "Curieux" },
  { key: "D",  color: "#893395", label: "D",  desc: "Débutant" },
  { key: "D-", color: "#A666B0", label: "D-", desc: "Reprise" },
  { key: "E+", color: "#A666B0", label: "E+", desc: "Premier pas" },
];

// Couleur de texte lisible selon le fond
function readableTextColor(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b; // luminance
  return Y > 145 ? "#213A57" : "#FFFFFF";
}

export default function RankLegend({ columns = 2 }) {
  return (
    <div
      style={{
        background: "#E0F2F1",
        border: "1px solid rgba(69,223,177,0.35)",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3
        style={{
          margin: "0 0 12px",
          color: "#213A57",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        Légende des rangs
      </h3>

      <p style={{ margin: "0 0 16px", color: "#14919B", fontSize: 14 }}>
        De <strong>S</strong> (Sommet) à <strong>E+</strong> (Premier pas).
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(150px, 1fr))`,
          gap: 10,
        }}
      >
        {RANKS.map((r) => {
          const text = readableTextColor(r.color);
          return (
            <div
              key={r.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#FFFFFF",
                border: "1px solid rgba(33,58,87,0.08)",
                borderRadius: 12,
                padding: "12px 14px",
                minWidth: 0, // permet l’ellipsis
              }}
            >
              {/* Pastille colorée */}
              <div
                style={{
                  background: r.color,
                  color: text,
                  borderRadius: 10,
                  fontWeight: 800,
                  padding: "6px 10px",
                  minWidth: 44,
                  textAlign: "center",
                  flex: "0 0 auto",
                }}
                title={r.key}
              >
                {r.label}
              </div>

              {/* Libellé du rang (une seule ligne) */}
              <div
                style={{
                  color: "#213A57",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: "1 1 auto",
                }}
              >
                {r.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
