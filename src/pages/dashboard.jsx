// src/pages/dashboard.jsx
import React, { useEffect, useState } from "react";
import "./dashboard.css";
import { useAuthStore } from "@/hooks/AuthStore.jsx";

/* ------------------------ Config API Laravel (profil) ------------------------ */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://backend.react.test:8000";
const API_URL = (import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`).replace(/\/+$/, "");

function getCookie(name) {
  return document.cookie.split("; ").find((row) => row.startsWith(name + "="))?.split("=")[1];
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const url = `${API_URL}${path}`;
  const xsrfCookie = getCookie("XSRF-TOKEN");

  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (xsrfCookie) headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfCookie);

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text().catch(() => "");
  const isJSON = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJSON && text ? JSON.parse(text) : text;

  if (!res.ok) {
    const msg =
      (payload && payload.message) ||
      (payload && payload.error) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return isJSON ? payload : text;
}

/* ------------------- Helpers rang -> niveau -> payload nv_* ------------------ */
function levelFromRankLetter(rank) {
  const R = String(rank || "").toUpperCase();
  const map = { S: 90, A: 70, B: 55, C: 42, D: 32, E: 22 };
  return map[R] ?? null;
}

function buildNvPayloadFromRanks(ranksObj) {
  const getLevel = (evKey) => {
    const r = ranksObj?.[evKey];
    if (!r) return null;
    const numeric = r.niveau ?? r.level ?? r.nv ?? null;
    if (Number.isFinite(numeric)) return Number(numeric);
    return levelFromRankLetter(r.rank);
  };

  return {
    nv_1500: getLevel("1500m"),
    nv_3000: getLevel("3000m"),
    nv_5000: getLevel("5000m"),
    nv_10000: getLevel("10000m"),
    nv_semi: getLevel("semi"),
    nv_marathon: getLevel("marathon"),
  };
}

/* ------------------------------ UI mini-helpers ------------------------------ */
const mmss = (sec) => {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
};

/* ----------------------------- Plan 2 semaines UI ---------------------------- */
function TwoWeekPlan({ paces }) {
  // paces: { ef:{seconds}, seuil:{seconds}, marathon:{seconds} }
  const ef = paces?.ef?.seconds || 6 * 60;
  const t = paces?.seuil?.seconds || 4 * 60 + 20;
  const mp = paces?.marathon?.seconds || 4 * 60 + 50;

  const W = () => ({
    ef: `EF ${mmss(ef)}/km`,
    t: `Seuil ${mmss(t)}/km`,
    mp: `Allure marathon ${mmss(mp)}/km`,
    r: `Repos / mobilité`,
    i: `Intervalles (5 × 1000 m @ ${mmss(Math.max(0, t - 15))}/km, r: 2')`,
    l: `Longue sortie (70–90') @ ${mmss(ef)}/km`,
  });

  const plan = [
    [W().ef, W().i, W().r, W().t, W().ef, W().l, W().r],
    [W().ef, W().i, W().r, W().t, W().ef, W().l, W().r],
  ];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div
      style={{
        background: "#213A57",
        border: "1px solid rgba(69,223,177,.2)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 5px 15px rgba(0,0,0,.3)",
        color: "#E0F2F1",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 14, fontSize: 20, fontWeight: 700, textAlign: "center" }}>
        Plan d’entraînement – 2 semaines
      </h3>

      {plan.map((week, wi) => (
        <div key={wi} style={{ marginBottom: 16 }}>
          <div style={{ color: "#8ADCC6", fontWeight: 600, margin: "6px 0 8px" }}>Semaine {wi + 1}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(160px,1fr))",
              gap: 10,
              overflowX: "auto",
            }}
          >
            {week.map((w, di) => (
              <div
                key={di}
                style={{
                  background: "#F1F7F6",
                  color: "#213A57",
                  borderRadius: 12,
                  padding: "10px 12px",
                  border: "1px solid rgba(69,223,177,.25)",
                  minHeight: 72,
                }}
              >
                <div style={{ fontSize: 12, color: "#14919B", fontWeight: 700, marginBottom: 6 }}>
                  {dayNames[di]}
                </div>
                <div style={{ fontSize: 14, lineHeight: "18px" }}>{w}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, fontSize: 12, color: "#8ADCC6", textAlign: "center" }}>
        Conseil : ajuste les volumes à ton expérience. Garde 1–2 jours très faciles par semaine.
      </div>
    </div>
  );
}

/* --------------------------------- Page ------------------------------------- */
export default function Page() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("paces"); // "paces" | "plan"
  const [loading, setLoading] = useState(true);
  const [paces, setPaces] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        // 1) Récupère les rangs sauvegardés côté Laravel
        const prof = await apiFetch("/profile"); // => { user, profile, ranks }
        const ranksObj = prof?.ranks || {};
        if (!Object.keys(ranksObj).length) {
          setError("Aucun rang enregistré. Va dans Profil > Calcul de rangs pour les calculer puis enregistre-les.");
          setPaces(null);
          return;
        }

        // 2) Construit le payload de niveaux nv_* depuis les rangs
        const body = buildNvPayloadFromRanks(ranksObj);
        Object.keys(body).forEach((k) => body[k] == null && delete body[k]);

        if (!Object.keys(body).length) {
          setError("Impossible de déduire un niveau depuis tes rangs. Recalcule tes rangs dans Profil.");
          setPaces(null);
          return;
        }

        // 3) Appelle l’API EXTERNE via le PROXY Laravel (pas de CORS)
        const resp = await apiFetch("/ext/training/paces", { method: "POST", body });
        if (resp?.success && resp?.paces) {
          if (mounted) setPaces(resp.paces); // { ef, seuil, marathon }
        } else {
          throw new Error("Réponse inattendue de l’API d’allures.");
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError(e.message || "Erreur lors du chargement des allures.");
          setPaces(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <div className="dashboard-container" style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      {/* Tabs header */}
      <div
        style={{
          display: "flex",
          gap: 10,
          margin: "8px 0 20px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setActiveTab("paces")}
          style={{
            border: "1px solid rgba(69,223,177,.35)",
            background: activeTab === "paces" ? "#14919B" : "#213A57",
            color: "#E0F2F1",
            padding: "10px 14px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🏁 Allures d’entraînement
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          style={{
            border: "1px solid rgba(69,223,177,.35)",
            background: activeTab === "plan" ? "#14919B" : "#213A57",
            color: "#E0F2F1",
            padding: "10px 14px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          📅 Plan 2 semaines
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: "#213A57", background: "#E0F2F1", padding: 16, borderRadius: 12 }}>
          Chargement…
        </div>
      ) : error ? (
        <div
          style={{
            color: "#E53E3E",
            background: "#FFF5F5",
            padding: 16,
            borderRadius: 12,
            border: "1px solid #FED7D7",
          }}
        >
          {error} <a href="/profile" style={{ color: "#14919B", fontWeight: 700 }}>Ouvrir le profil</a>
        </div>
      ) : activeTab === "paces" ? (
        <div
          style={{
            background: "#213A57",
            border: "1px solid rgba(69,223,177,.2)",
            borderRadius: 20,
            padding: 20,
            boxShadow: "0 5px 15px rgba(0,0,0,.3)",
          }}
        >
          <h3 style={{ color: "#E0F2F1", fontSize: 22, margin: 0, marginBottom: 16, fontWeight: 700 }}>
            Allures d’entraînement
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {["ef", "seuil", "marathon"].map((k) => {
              const sec = paces?.[k]?.seconds ?? 0;
              return (
                <div
                  key={k}
                  style={{
                    background: "#F1F7F6",
                    color: "#213A57",
                    borderRadius: 12,
                    padding: 16,
                    border: "1px solid rgba(69,223,177,.25)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "#14919B", fontWeight: 700, marginBottom: 6 }}>
                    {k.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{mmss(sec)}/km</div>
                  {paces?.[k]?.source && (
                    <div style={{ fontSize: 12, color: "#14919B", marginTop: 6 }}>
                      source: {paces[k].source}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <TwoWeekPlan paces={paces} />
      )}
    </div>
  );
}
