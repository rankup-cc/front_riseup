// src/pages/profile.jsx
import React, { useEffect, useRef, useState } from "react";
import "./dashboard.css";
import "./profile.css";
import { useAuthStore } from "../hooks/AuthStore.jsx";
import RankLegend from "@/components/classement/RankLegend.jsx";
import { extApi } from "@/services/externalApi.js"; // appel direct à l'API PHP
import { usePaces } from "../context/PacesContext"; // garde le même chemin partout

/* -------------------- CONFIG API LARAVEL (local/proxy) -------------------- */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://backend.react.test:8000";
const API_URL = (import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`).replace(/\/+$/, "");

// helper pour lire un cookie (XSRF-TOKEN posé par /sanctum/csrf-cookie)
function getCookie(name) {
  return document.cookie.split("; ").find((row) => row.startsWith(name + "="))?.split("=")[1];
}

// fetch JSON + cookies + XSRF header (pour ton back Laravel)
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
    console.error("API ERROR:", res.status, res.statusText, "URL:", url, "Body:", payload);
    const msg =
      (payload && payload.message) ||
      (payload && payload.error) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return isJSON ? payload : text;
}

/* -------------------- Helpers rang -> niveau -> payload -------------------- */
// Convertit une lettre (S, A+, A, A-, …) -> niveau approx
function levelFromRankLetter(rank) {
  if (!rank) return null;
  const R = String(rank).trim().toUpperCase();

  const base = { S: 90, A: 70, B: 55, C: 42, D: 32, E: 22, F: 15 };

  // gère A+, A- etc.
  const m = R.match(/^([SABCDEFX])([+-])?$/) || R.match(/^([ABCDE])\s*([+-])$/);
  if (m) {
    const letter = m[1];
    const pm = m[2];
    let val = base[letter] ?? null;
    if (val != null && pm) val += pm === "+" ? 3 : -3;
    return val;
  }

  const table = {
    "A+": 73, "A-": 67,
    "B+": 58, "B-": 52,
    "C+": 46, "C-": 38,
    "D+": 36, "D-": 30,
    "E+": 26, "E-": 18,
  };
  if (R in table) return table[R];
  return base[R] ?? null;
}

// Extraction très tolérante des niveaux depuis l’objet/array renvoyé par l’iframe
function buildNvPayloadFromRanks(ranks) {
  // 1) Normalise en liste d'entrées {key, data}
  const entries = [];
  if (Array.isArray(ranks)) {
    for (const it of ranks) {
      const k = (it?.key || it?.name || it?.epreuve || it?.event || "").toString();
      entries.push({ key: k, data: it });
    }
  } else if (ranks && typeof ranks === "object") {
    for (const k of Object.keys(ranks)) entries.push({ key: k, data: ranks[k] });
  }

  // 2) util: trouve l’entrée correspondant à une épreuve
  const findEntry = (aliases) => {
    const al = aliases.map((s) => s.toLowerCase());
    return entries.find(({ key }) => {
      const kk = (key || "").toLowerCase();
      return al.some((a) => kk.includes(a));
    })?.data;
  };

  // 3) util: extrait un niveau numérique OU une lettre
  const extractLevel = (obj) => {
    if (!obj || typeof obj !== "object") return null;

    // cherche champ numérique
    const numKeys = ["niveau", "level", "nv", "niv", "value", "score"];
    for (const k of numKeys) {
      if (k in obj) {
        const v = obj[k];
        const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
        if (Number.isFinite(n)) return n;
      }
    }
    // sinon, cherche lettre
    const letterKeys = ["rank", "rang", "grade", "letter", "classe"];
    for (const k of letterKeys) {
      if (k in obj) {
        const n = levelFromRankLetter(obj[k]);
        if (Number.isFinite(n)) return n;
      }
    }
    return null;
  };

  // 4) map d’aliases par épreuve
  const NV = {};
  NV.nv_1500     = extractLevel(findEntry(["1500", "1500m", "m1500"]));
  NV.nv_3000     = extractLevel(findEntry(["3000", "3000m", "m3000"]));
  NV.nv_5000     = extractLevel(findEntry(["5000", "5000m", "5k", "5 km"]));
  NV.nv_10000    = extractLevel(findEntry(["10000", "10k", "10 km", "10000m"]));
  NV.nv_semi     = extractLevel(findEntry(["semi", "21", "21k", "half"]));
  NV.nv_marathon = extractLevel(findEntry(["marathon", "42", "42k"]));

  // 5) nettoie
  Object.keys(NV).forEach((k) => (NV[k] == null || Number.isNaN(NV[k])) && delete NV[k]);

  return NV;
}

/* ------------------------------ Composant page ------------------------------ */
const ProfilePage = () => {
  const { user } = useAuthStore();
  const userId = user?.id || 1;

  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'ranks'

  // Infos perso
  const [isEditing, setIsEditing] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingRanks, setSavingRanks] = useState(false);
  const [computingPaces, setComputingPaces] = useState(false);

  const [userInfo, setUserInfo] = useState({
    firstName: user?.firstName || user?.first_name || "Jimmy",
    lastName: user?.lastName || user?.last_name || "Gressier",
    age: 28,
    email: user?.email || "jimmy.gressier@kiprun.com",
    address: "Paris, France",
    sport: "Course à pied",
    eventParticipation: 12,
  });

  // Rangs affichés (onglet "Infos personnelles")
  const [userRanks, setUserRanks] = useState({
    "1500m": { rank: "A", performance: "00:03:45" },
    "3000m": { rank: "A", performance: "00:08:15" },
    "5000m": { rank: "B", performance: "00:14:20" },
    "10000m": { rank: "B", performance: "00:29:30" },
    semi: { rank: "C", performance: "01:02:15" },
    marathon: { rank: "C", performance: "02:15:30" },
  });

  // Contexte global pour partager les allures (avec dashboard.jsx)
  const { paces: pacesCtx, setPaces } = usePaces();

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

      // Résultats de rangs -> on garde le brouillon
      if (data.type === "ranks:result" && data.ranks && typeof data.ranks === "object") {
        setRanksDraft(data.ranks);
        setHasRanksDraft(true);
        console.log("[ranksDraft reçu depuis l'iframe]", data.ranks);
        // ⚠️ on NE calcule plus automatiquement les allures ici
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

  // -------- CALCULER LES ALLURES (depuis les NIVEAUX) -> PacesContext
  const computeTrainingPacesFromDraft = async () => {
    if (!ranksDraft) {
      alert("Commence par calculer tes rangs.");
      return;
    }
    const body = buildNvPayloadFromRanks(ranksDraft); // privilégie niveau numérique, sinon lettre convertie
    if (!Object.keys(body).length) {
      alert("Je n’ai pas détecté de niveaux dans tes résultats. Regarde la console (F12) pour la forme exacte envoyée par l’iframe.");
      console.warn("[compute paces] ranksDraft sans niveaux détectés :", ranksDraft);
      return;
    }

    try {
      setComputingPaces(true);
      const json = await extApi("/training/paces", { method: "POST", body });
      if (!json?.success || !json?.paces) throw new Error("Réponse inattendue.");

      setPaces({
        at: Date.now(),
        input: body,
        paces: json.paces,
        intervals_5k: json.intervals_5k,
        intervals_1500: json.intervals_1500,
      });

      alert("Allures calculées ✅ — rendez-vous dans Suivi personnel !");
    } catch (e) {
      console.error(e);
      alert("Échec du calcul des allures.");
    } finally {
      setComputingPaces(false);
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

            {/* Aperçu des dernières allures + INTERVALLES si dispo */}
            {pacesCtx?.paces && (
              <div className="info-card" style={{ marginTop: 16 }}>
                <h3 style={{ color: "#45DFB1" }}>Dernières allures calculées</h3>

                {/* EF / Seuil / Marathon */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  {["ef", "seuil", "marathon"].map((k) => {
                    const sec = pacesCtx?.paces?.[k]?.seconds ?? 0;
                    const m = Math.floor(sec / 60);
                    const s = sec % 60;
                    return (
                      <div
                        key={k}
                        style={{
                          background: "#E0F2F1",
                          borderRadius: 12,
                          padding: 12,
                          textAlign: "center",
                          border: "1px solid rgba(69,223,177,.25)",
                        }}
                      >
                        <div style={{ color: "#14919B", fontWeight: 700, marginBottom: 6 }}>
                          {k.toUpperCase()}
                        </div>
                        <div style={{ color: "#213A57", fontSize: 18, fontWeight: "bold" }}>
                          {m}:{String(s).padStart(2, "0")}/km
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Intervalles 5K */}
                {pacesCtx?.intervals_5k && (
                  <>
                    <div style={{ color: "#14919B", fontWeight: 700, margin: "8px 0 6px" }}>
                      Intervalles – allure 5K{" "}
                      {pacesCtx.intervals_5k.source ? `(source: ${pacesCtx.intervals_5k.source})` : ""}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      {[
                        ["I400", pacesCtx.intervals_5k.i400],
                        ["I1000", pacesCtx.intervals_5k.i1000],
                        ["I1200", pacesCtx.intervals_5k.i1200],
                        ["I1600", pacesCtx.intervals_5k.i1600],
                      ].map(([lab, val]) => {
                        const sec = val?.seconds ?? 0;
                        const m = Math.floor(sec / 60);
                        const s = sec % 60;
                        return (
                          <div
                            key={lab}
                            style={{
                              background: "#F1F7F6",
                              borderRadius: 12,
                              padding: 10,
                              textAlign: "center",
                              border: "1px solid rgba(69,223,177,.25)",
                            }}
                          >
                            <div style={{ color: "#14919B", fontWeight: 700, marginBottom: 6 }}>{lab}</div>
                            <div style={{ color: "#213A57", fontSize: 18, fontWeight: "bold" }}>
                              {m}:{String(s).padStart(2, "0")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Intervalles 1500 */}
                {pacesCtx?.intervals_1500 && (
                  <>
                    <div style={{ color: "#14919B", fontWeight: 700, margin: "8px 0 6px" }}>
                      Intervalles – allure 1500{" "}
                      {pacesCtx.intervals_1500.source ? `(source: ${pacesCtx.intervals_1500.source})` : ""}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                        gap: 10,
                      }}
                    >
                      {[
                        ["R200", pacesCtx.intervals_1500.r200],
                        ["R300", pacesCtx.intervals_1500.r300],
                        ["R400", pacesCtx.intervals_1500.r400],
                        ["R600", pacesCtx.intervals_1500.r600],
                        ["R800", pacesCtx.intervals_1500.r800],
                      ].map(([lab, val]) => {
                        const sec = val?.seconds ?? 0;
                        const m = Math.floor(sec / 60);
                        const s = sec % 60;
                        return (
                          <div
                            key={lab}
                            style={{
                              background: "#F1F7F6",
                              borderRadius: 12,
                              padding: 10,
                              textAlign: "center",
                              border: "1px solid rgba(69,223,177,.25)",
                            }}
                          >
                            <div style={{ color: "#14919B", fontWeight: 700, marginBottom: 6 }}>{lab}</div>
                            <div style={{ color: "#213A57", fontSize: 18, fontWeight: "bold" }}>
                              {m}:{String(s).padStart(2, "0")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ----- Onglet Rangs (iframe + actions) ----- */
          <div className="dashboard-container">
            <section className="encadré-bienvenue">
              <h1>Bienvenue sur ton espace d’entraînement 👋</h1>
              <p>
                Renseigne tes performances pour connaître ton rang, puis génère tes allures et ton plan personnalisé.
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
                    style={{ width: "100%", height: `${iframeH}px`, border: 0}}
                    scrolling="no"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* barre d’actions */}
                <div className="savebar">
                  <div className={`dot ${hasRanksDraft ? "ok" : ""}`} />
                  <span className="savebar-text">
                    {hasRanksDraft
                      ? "Résultats prêts."
                      : "Calcule tes rangs pour activer les actions."}
                  </span>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="savebar-btn"
                      disabled={!hasRanksDraft || savingRanks}
                      onClick={saveRanksToBackend}
                      title="Enregistre tes rangs dans ton profil"
                    >
                      {savingRanks ? "⏳ Enregistrement..." : "💾 Enregistrer mes rangs"}
                    </button>

                    <button
                      className="savebar-btn"
                      disabled={!hasRanksDraft || computingPaces}
                      onClick={computeTrainingPacesFromDraft}
                      title="Calcule et stocke tes allures d’entraînement"
                    >
                      {computingPaces ? "⏳ Calcul..." : "⚡ Calculer mes allures"}
                    </button>
                  </div>
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

