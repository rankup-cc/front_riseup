// src/pages/dashboard.jsx
import React, { useMemo, useState } from "react";
import "./dashboard.css";
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import { usePaces } from "@/context/PacesContext";

// --------- helpers ----------
const mmss = (sec) => {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
};

const addDays = (date, d) => {
  const x = new Date(date);
  x.setDate(x.getDate() + d);
  return x;
};

const formatDay = (d) =>
  d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "2-digit" });

const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// --------- générateur de semaine ----------
function buildWeekPlan(paces) {
  const ef = paces?.ef?.seconds || 6 * 60 + 0;
  const t = paces?.seuil?.seconds || 4 * 60 + 20;
  const mp = paces?.marathon?.seconds || 4 * 60 + 50;

  const i400 =
    paces?.i5?.i400?.seconds ??
    paces?.intervals_5k?.i400?.seconds ??
    Math.max(t - 20, 3 * 60);
  const i1000 =
    paces?.i5?.i1000?.seconds ??
    paces?.intervals_5k?.i1000?.seconds ??
    Math.max(t - 15, 3 * 60 + 10);
  const i1200 =
    paces?.i5?.i1200?.seconds ??
    paces?.intervals_5k?.i1200?.seconds ??
    Math.max(t - 10, 3 * 60 + 20);
  const i1600 =
    paces?.i5?.i1600?.seconds ??
    paces?.intervals_5k?.i1600?.seconds ??
    Math.max(t - 5, 3 * 60 + 30);

  const r200 =
    paces?.r15?.r200?.seconds ?? paces?.intervals_1500?.r200?.seconds ?? 45;
  const r300 =
    paces?.r15?.r300?.seconds ?? paces?.intervals_1500?.r300?.seconds ?? 70;
  const r400 =
    paces?.r15?.r400?.seconds ?? paces?.intervals_1500?.r400?.seconds ?? 95;
  const r600 =
    paces?.r15?.r600?.seconds ?? paces?.intervals_1500?.r600?.seconds ?? 160;
  const r800 =
    paces?.r15?.r800?.seconds ?? paces?.intervals_1500?.r800?.seconds ?? 220;

  return [
    {
      title: "Footing facile",
      desc: `Footing 30–45' à ${mmss(ef)}/km. Conseils : respiration nasale, aisance.`,
    },
    {
      title: "Intervalles 5k",
      desc: `5 × 1000 m @ ${mmss(i1000)}/km — récup 2'. Échauff. 15', retour au calme 10'.`,
    },
    {
      title: "Repos / Mobilité",
      desc: "Jour léger : mobilité, gainage 10', sommeil + hydratation.",
    },
    {
      title: "Seuil",
      desc: `2 × 12' @ ${mmss(t)}/km — récup 3'. Échauff. 15', RAC 10'.`,
    },
    {
      title: "EF + éducatifs",
      desc: `40' à ${mmss(ef)}/km. 6×(80 m éducatifs/retour marche).`,
    },
    {
      title: "Sortie longue",
      desc: `75–90' dont 30' @ allure marathon ${mmss(mp)}/km. Nutrition à tester.`,
    },
    {
      title: "Vitesse 1500",
      desc: `Série mixte : 6×(400 m @ ${mmss(r400)}) r=1' + 4×(200 m @ ${mmss(r200)}) r=1'.`,
    },
  ];
}

// 7 dates d'une semaine en fonction de l'offset
function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = lundi
  const monday = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -day + 7 * weekOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// --------- Composant principal ----------
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { paces } = usePaces(); // contexte rempli depuis profile.jsx
  const [weekOffset, setWeekOffset] = useState(0); // 0..3
  const [activeTab, setActiveTab] = useState("train"); // "train" | "strength"

  const allures = useMemo(() => {
    if (!paces) return null;
    return {
      ef: paces?.paces?.ef,
      seuil: paces?.paces?.seuil,
      marathon: paces?.paces?.marathon,
      i5: paces?.intervals_5k,
      r15: paces?.intervals_1500,
    };
  }, [paces]);

  const currentWeekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const oneWeekPlan = useMemo(() => buildWeekPlan(allures), [allures]);
  const noPaces = !allures;

  const prevDisabled = weekOffset <= 0;
  const nextDisabled = weekOffset >= 3; // 4 semaines max

  return (
    <div className="dashboard-container">
      {/* Onglets */}
      <div className="nav-tabs center">
        <button
          onClick={() => setActiveTab("train")}
          className={`nav-tab ${activeTab === "train" ? "active" : ""}`}
          type="button"
        >
          📅 Entraînement
        </button>
        <button
          onClick={() => setActiveTab("strength")}
          className={`nav-tab ${activeTab === "strength" ? "active" : ""}`}
          type="button"
        >
          💪 Renforcement
        </button>
      </div>

      {/* Alerte si pas d’allures */}
      {noPaces && activeTab === "train" && (
        <div className="cta-empty">
          Aucune allure disponible. Va sur <a href="/profile">Profil</a> → “Calcul de rangs”,
          clique “⚡ Calculer mes allures”, puis reviens ici.
        </div>
      )}

      {/* Onglet ENTRAÎNEMENT = Semaine + Allures dans le même onglet */}
      {!noPaces && activeTab === "train" && (
        <>
          {/* PLAN HEBDO */}
          <section className="week-card" style={{ marginBottom: 16 }}>
            <div className="week-nav">
              <button
                type="button"
                className="week-btn"
                onClick={() => !prevDisabled && setWeekOffset((w) => Math.max(0, w - 1))}
                disabled={prevDisabled}
                title="Semaine précédente"
              >
                ←
              </button>

              <div className="week-header">
                <div className="week-title">
                  Semaine du {currentWeekDays[0].toLocaleDateString()} au {currentWeekDays[6].toLocaleDateString()}
                </div>
                <div className="week-subtitle">
                  Ajuste les volumes à ton expérience. 1–2 jours très faciles / semaine.
                </div>
              </div>

              <button
                type="button"
                className="week-btn"
                onClick={() => !nextDisabled && setWeekOffset((w) => Math.min(3, w + 1))}
                disabled={nextDisabled}
                title="Semaine suivante"
              >
                →
              </button>
            </div>

            <div className="week-grid">
              {oneWeekPlan.map((w, i) => (
                <article className="day-card" key={i}>
                  <div className="day-head">
                    <div className="day-date">
                      {dayNames[i]} — {formatDay(currentWeekDays[i])}
                    </div>
                  </div>
                  <h4 className="day-title">{w.title}</h4>
                  <p className="day-desc">{w.desc}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ALLURES & INTERVALLES */}
          <section className="paces-root">
            {/* EF / Seuil / Marathon */}
            <div className="card">
              <h3 className="card-title">Allures distances longues</h3>
              <div className="paces-grid">
                {["ef", "seuil", "marathon"].map((k) => {
                  const sec = allures?.[k]?.seconds ?? 0;
                  return (
                    <div className="pace-item" key={k}>
                      <div className="pace-label">{k.toUpperCase()}</div>
                      <div className="pace-value">{mmss(sec)}/km</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intervalles 5k */}
            {allures?.i5 && (
              <div className="card">
                <h3 className="card-title">Temps de passage – allure 5K</h3>
                <div className="intervals-grid">
                  {[
                    ["400 m", allures.i5.i400],
                    ["1000 m", allures.i5.i1000],
                    ["1200 m", allures.i5.i1200],
                    ["1600 m", allures.i5.i1600],
                  ].map(([lab, val]) => (
                    <div className="pace-item" key={lab}>
                      <div className="pace-label">{lab}</div>
                      <div className="pace-value">{mmss(val?.seconds ?? 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intervalles 1500 */}
            {allures?.r15 && (
              <div className="card">
                <h3 className="card-title">Intervalles – allure 1500</h3>
                <div className="intervals-grid">
                  {[
                    ["200 m", allures.r15.r200],
                    ["300 m", allures.r15.r300],
                    ["400 m", allures.r15.r400],
                    ["600 m", allures.r15.r600],
                    ["800 m", allures.r15.r800],
                  ].map(([lab, val]) => (
                    <div className="pace-item" key={lab}>
                      <div className="pace-label">{lab}</div>
                      <div className="pace-value">{mmss(val?.seconds ?? 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Onglet RENFORCEMENT = Étirements + Muscu */}
      {activeTab === "strength" && (
        <section className="paces-root">
          {/* Étirements */}
          <div className="card">
            <h3 className="card-title">Étirements (10–15')</h3>
            <div className="paces-grid">
              {[
                ["Mollets contre mur", "2×30–45\" par jambe"],
                ["Ischios (PNF léger)", "2×30–45\""],
                ["Quadriceps debout", "2×30–45\" par jambe"],
                ["Fessiers (pigeon)", "2×30–45\" par jambe"],
                ["Hanche/Fléchisseurs", "2×30–45\" par jambe"],
                ["Dos/Grand dorsal", "2×30–45\""],
              ].map(([name, vol]) => (
                <div className="pace-item" key={name}>
                  <div className="pace-label">{name}</div>
                  <div className="pace-value" style={{ fontSize: 18 }}>{vol}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Musculation / Prépa Physique */}
          <div className="card">
            <h3 className="card-title">Musculation – gainage & force (20–30')</h3>
            <div className="intervals-grid">
              {[
                ["Gainage planche", "3×30–45\" (r:30\")"],
                ["Gainage latéral", "3×30–45\"/côté (r:30\")"],
                ["Hip thrust", "3×10–12 (r:60–90\")"],
                ["Squat gobelet", "3×8–10 (r:90\")"],
                ["Fentes marchées", "2×12/ jambe (r:60\")"],
                ["Mollets debout", "3×12–15 (r:45\")"],
                ["Oiseaux élastique", "2×15–20 (r:45\")"],
                ["Rotation buste (core)", "2×12–15/ côté (r:45\")"],
              ].map(([name, vol]) => (
                <div className="pace-item" key={name}>
                  <div className="pace-label">{name}</div>
                  <div className="pace-value" style={{ fontSize: 18 }}>{vol}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
