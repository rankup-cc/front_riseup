// src/pages/profile.jsx
import React, { useEffect, useRef, useState } from "react";
import "./dashboard.css";
import "./profile.css";
import { useAuthStore } from "../hooks/AuthStore.jsx";
import RankLegend from "@/components/classement/RankLegend.jsx";
// 👉 adapte ce chemin selon l'endroit où tu as créé le helper
import { extApi } from "@/services/externalApi.js"; // ou "@/services/externalApi.js"

// -------------------- CONFIG API LARAVEL (local) --------------------
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://backend.react.test:8000";
const API_URL = (import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`).replace(/\/+$/, "");

// helper pour lire un cookie (XSRF-TOKEN posé par /sanctum/csrf-cookie)
function getCookie(name) {
  return document.cookie.split("; ").find((row) => row.startsWith(name + "="))?.split("=")[1];
}

// fetch JSON + cookies + XSRF header (pour ton back Laravel)
async function apiFetch(path, { method = "GET", body } = {}) {
  const url = `${API_URL}${path}`;
  const xsrfCookie = getCookie("XSRF-TOKEN"); // posé par /sanctum/csrf-cookie
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (xsrfCookie) {
    headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfCookie);
  }

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
    console.error("API ERROR:", res.status, res.statusText, "URL:", url, "Body:", payload);
    const msg =
      (payload && payload.message) ||
      (payload && payload.error) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return isJSON ? payload : text;
}

// -------------------- Helpers rang -> niveau -> payload --------------------
// Fallback si l’iframe n’envoie pas un niveau numérique
function levelFromRankLetter(rank) {
  const R = String(rank || "").toUpperCase();
  // Ajuste ces valeurs si besoin
  const map = { S: 90, A: 70, B: 55, C: 42, D: 32, E: 22 };
  return map[R] ?? null;
}

// Construit le body attendu par /training/paces
function buildNvPayloadFromRanks(ranksObj) {
  // ranksObj: { "1500m":{rank:"A", performance:"..." , niveau?: 68 }, ... }
  const getLevel = (evKey) => {
    const r = ranksObj?.[evKey];
    if (!r) return null;
    // priorité au champ numérique si dispo (niveau | level | nv)
    const numeric = r.niveau ?? r.level ?? r.nv ?? null;
    if (Number.isFinite(numeric)) return Number(numeric);
    // sinon fallback depuis la lettre de rang
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

// -------------------- Composant --------------------
const ProfilePage = () => {
  const { user } = useAuthStore();
  const userId = user?.id || 1;

  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'ranks'

  // Infos perso
  const [isEditing, setIsEditing] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingRanks, setSavingRanks] = useState(false);

  const [userInfo, setUserInfo] = useState({
    firstName: user?.firstName || user?.first_name || "Jimmy",
    lastName: user?.lastName || user?.last_name || "Gressier",
    age: 28,
    email: user?.email || "jimmy.gressier@kiprun.com",
    address: "Paris, France",
    sport: "Course à pied",
    eventParticipation: 12,
  });

  // Rangs affichés dans l’onglet "Infos personnelles"
  const [userRanks, setUserRanks] = useState({
    "1500m": { rank: "A", performance: "00:03:45" },
    "3000m": { rank: "A", performance: "00:08:15" },
    "5000m": { rank: "B", performance: "00:14:20" },
    "10000m": { rank: "B", performance: "00:29:30" },
    semi: { rank: "C", performance: "01:02:15" },
    marathon: { rank: "C", performance: "02:15:30" },
  });

  // Allures calculées par l’API externe
  const [paces, setPaces] = useState(null);

  // ======= Zone RANGS (iframe)
  const iframeRef = useRef(null);
  const [iframeH, setIframeH] = useState(1600);
  const [ranksDraft, setRanksDraft] = useState(null);
  const [hasRanksDraft, setHasRanksDraft] = useState(false);

  // Charger le profil depuis le backend (à la connexion)
  useEffect(() => {
    let mounted = true;
    apiFetch("/profile")
      .then((data) => {
        if (!mounted) return;
        setUserInfo((prev) => ({
          ...prev,
          firstName: data.user?.first_name ?? prev.firstName,
          lastName: data.user?.last_name ?? prev.lastName,
          email: data.user?.email ?? prev.email,
          age: data.profile?.age ?? prev.age,
          address: data.profile?.address ?? prev.address,
          sport: data.profile?.sport ?? prev.sport,
        }));
        const ranksObj = data?.ranks ? { ...data.ranks } : {};
        if (Object.keys(ranksObj).length) setUserRanks(ranksObj);
      })
      .catch((e) => console.error("load /api/profile:", e));
    return () => {
      mounted = false;
    };
  }, []);

  // Messages postMessage de l’iframe (hauteur + résultats)
  useEffect(() => {
    function onMsg(e) {
      const data = e?.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "ranks:height" && typeof data.height === "number") {
        const h = Math.max(900, Math.floor(data.height) + 60);
        setIframeH(h);
        if (iframeRef.current) iframeRef.current.style.height = `${h}px`;
      }

      // Résultats de rangs
      if (data.type === "ranks:result" && data.ranks && typeof data.ranks === "object") {
        setRanksDraft(data.ranks);
        setHasRanksDraft(true);

        // → Construire le body attendu par /training/paces
        const body = buildNvPayloadFromRanks(data.ranks);
        // nettoie les null
        Object.keys(body).forEach((k) => {
          if (body[k] == null) delete body[k];
        });

        if (Object.keys(body).length) {
          extApi("/training/paces", { method: "POST", body })
            .then((json) => {
              if (json?.success && json?.paces) {
                setPaces(json.paces); // ef / seuil / marathon
              } else {
                console.error("Réponse inattendue /training/paces", json);
                setPaces(null);
              }
            })
            .catch((err) => {
              console.error("Erreur /training/paces", err);
              setPaces(null);
            });
        } else {
          setPaces(null);
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const handleInputChange = (field, value) =>
    setUserInfo((s) => ({ ...s, [field]: value }));

  const getRankColor = (rank) => {
    const colors = { S: "#FFD700", A: "#4FC3F7", B: "#32CD32", C: "#FFA500", D: "#FF6B6B", E: "#9C27B0" };
    return colors[rank] || "#999";
  };

  // -------- SAVE: Infos perso -> backend (Laravel)
  const saveInfoToBackend = async () => {
    setSavingInfo(true);
    try {
      await apiFetch("/profile/update", {
        method: "POST",
        body: {
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          age: userInfo.age,
          address: userInfo.address,
          sport: userInfo.sport,
        },
      });
      alert("Informations sauvegardées ✅");
    } catch (e) {
      console.error(e);
      alert("Impossible d’enregistrer les informations.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveInfo = () => {
    setIsEditing(false);
    saveInfoToBackend();
  };

  // -------- SAVE: Rangs -> backend (Laravel)
  const saveRanksToBackend = async () => {
    if (!ranksDraft) return;
    setSavingRanks(true);
    try {
      await apiFetch("/ranks/update", {
        method: "POST",
        body: { ranks: ranksDraft }, // { "1500m": { rank, performance, (optionnel niveau) }, ... }
      });
      setUserRanks(ranksDraft);
      setHasRanksDraft(false);
      alert("Rangs enregistrés ✅");
      setActiveTab("info");
    } catch (e) {
      console.error(e);
      alert("Impossible d’enregistrer les rangs.");
    } finally {
      setSavingRanks(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-wrap">
        {/* Header */}
        <div className="profile-header">
          <h1>Mon Profil</h1>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab("info")}
            className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
          >
            👤 Informations personnelles
          </button>
          <button
            onClick={() => setActiveTab("ranks")}
            className={`tab-btn ${activeTab === "ranks" ? "active" : ""}`}
          >
            📊 Calcul de rangs
          </button>
        </div>

        {/* Content */}
        {activeTab === "info" ? (
          <div className="info-card">
            <div className="info-card__top">
              <h2>Mes informations</h2>
              <button
                onClick={() => (isEditing ? handleSaveInfo() : setIsEditing(true))}
                className={`save-btn ${isEditing ? "primary" : "ghost"}`}
                disabled={savingInfo}
              >
                {isEditing ? (savingInfo ? "⏳..." : "💾 Sauvegarder") : "✏️ Modifier"}
              </button>
            </div>

            {/* Form grid */}
            <div className="form-grid">
              {[
                ["Prénom", "firstName", "text"],
                ["Nom", "lastName", "text"],
                ["Âge", "age", "number"],
                ["Email", "email", "email"],
                ["Adresse", "address", "text"],
                ["Sport pratiqué", "sport", "text"],
              ].map(([label, field, type]) => (
                <div key={field} className="form-field">
                  <label className="label">{label}</label>
                  {isEditing ? (
                    <input
                      type={type}
                      value={userInfo[field] ?? (type === "number" ? "" : "")}
                      onChange={(e) =>
                        handleInputChange(
                          field,
                          type === "number" ? parseInt(e.target.value || 0, 10) : e.target.value
                        )
                      }
                      className="input"
                    />
                  ) : (
                    <div className="readonly">
                      {field === "age" && userInfo[field] != null
                        ? `${userInfo[field]} ans`
                        : userInfo[field] ?? ""}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rangs (aperçu) */}
            <div className="ranks-box">
              <h3>Mes rangs</h3>
              <div className="ranks-grid">
                {Object.entries(userRanks).map(([event, data]) => (
                  <div key={event} className="rank-card">
                    <div className="rank-event">{event}</div>
                    <div className="rank-badge" style={{ background: getRankColor(data.rank) }}>
                      {data.rank}
                    </div>
                    <div className="rank-perf">{data.performance}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="stats-box">
              <h3>Statistiques</h3>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-value">{userInfo.eventParticipation}</div>
                  <div className="stat-label">Événements participés</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{Object.keys(userRanks).length}</div>
                  <div className="stat-label">Épreuves complétées</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ----- Onglet Rangs = dashboard.jsx intégré -----
          <div className="dashboard-container">
            <section className="encadré-bienvenue">
              <h1>Bienvenue sur ton espace d’entraînement 👋</h1>
              <p>
                Renseigne tes performances pour connaître ton rang, puis génère tes allures
                et ton plan personnalisé.
              </p>
            </section>

            <div className="dashboard-shell">
              <aside className="legend-card">
                <RankLegend />
              </aside>

              <main>
                <div
                  className="rank-input-card"
                  style={{ padding: 0, borderRadius: 20, overflow: "hidden" }}
                >
                  <iframe
                    ref={iframeRef}
                    src="/Ranks/calcul-rank.html"
                    title="Calcule ton rang"
                    style={{ width: "100%", height: `${iframeH}px`, border: 0 }}
                    scrolling="no"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Affichage allures si dispo */}
                {paces && (
                  <div className="info-card" style={{ marginTop: 16 }}>
                    <h3 style={{ color: "#45DFB1" }}>Allures calculées</h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                        gap: 12,
                      }}
                    >
                      {["ef", "seuil", "marathon"].map((k) => (
                        <div
                          key={k}
                          style={{
                            background: "#E0F2F1",
                            borderRadius: 12,
                            padding: 12,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ color: "#14919B", fontWeight: 700, marginBottom: 6 }}>
                            {k.toUpperCase()}
                          </div>
                          <div style={{ color: "#213A57", fontSize: 18, fontWeight: "bold" }}>
                            {(() => {
                              const sec = paces?.[k]?.seconds ?? 0;
                              const m = Math.floor(sec / 60),
                                s = sec % 60;
                              return `${m}:${String(s).padStart(2, "0")}/km`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* barre d’enregistrement des rangs */}
                <div className="savebar">
                  <div className={`dot ${hasRanksDraft ? "ok" : ""}`} />
                  <span className="savebar-text">
                    {hasRanksDraft
                      ? "Résultats prêts à être enregistrés."
                      : "Calcule tes rangs pour activer l’enregistrement."}
                  </span>
                  <button
                    className="savebar-btn"
                    disabled={!hasRanksDraft || savingRanks}
                    onClick={saveRanksToBackend}
                  >
                    {savingRanks ? "⏳ Enregistrement..." : "💾 Enregistrer mes rangs"}
                  </button>
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
