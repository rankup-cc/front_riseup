// src/pages/dashboard.jsx
import "./dashboard.css";
import { useState } from "react";
import LeaderboardTab from "@/components/classement/SportsDashboard.jsx";
import RankLegend from "@/components/classement/RankLegend.jsx";

export default function Page() {
  const [activeTab, setActiveTab] = useState("my-ranks");
  const showSection = (tab) => setActiveTab(tab);

  return (
    <div className="dashboard-container">
      <div className="dashboard-shell">
        {/* Colonne gauche : légende (petit encadré) */}
        <aside className="legend-col">
          <div className="legend-card">
            <RankLegend />
          </div>
        </aside>

        {/* Colonne droite : contenu principal */}
        <main className="main-col">
          {/* Onglets alignés à droite */}
          <div className="nav-tabs nav-tabs--right">
            <button
              className={`nav-tab ${activeTab === "my-ranks" ? "active" : ""}`}
              onClick={() => showSection("my-ranks")}
            >
              Mes Rangs
            </button>
            <button
              className={`nav-tab ${activeTab === "leaderboard" ? "active" : ""}`}
              onClick={() => showSection("leaderboard")}
            >
              Coaching
            </button>
          </div>

          {/* ----- Onglet Mes Rangs ----- */}
          {activeTab === "my-ranks" && (
            <div id="my-ranks" className="content-section active">
              <div
                className="rank-input-card"
                style={{
                  padding: 0,
                  borderRadius: 20,
                  overflow: "hidden",
                  maxWidth: 900,
                  margin: "0 auto 32px 0", // aligné à gauche
                }}
              >
                <iframe
                  src="/Ranks/calcul-rank.html"
                  title="Calcule ton rang"
                  style={{ width: "100%", height: "1200px", border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* ----- Onglet Classements ----- */}
          {activeTab === "leaderboard" && (
            <div id="leaderboard" className="content-section">
              <LeaderboardTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
