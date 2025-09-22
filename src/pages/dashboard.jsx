import "./dashboard.css";
import { useState } from "react";

export default function Page() {
  const [activeTab, setActiveTab] = useState("my-ranks");

  // Formulaire des chronos
  const [formValues, setFormValues] = useState({
    chrono_1500: "",
    chrono_3000: "",
    chrono_5000: "",
    chrono_10000: "",
    chrono_semi: "",
    chrono_marathon: "",
  });

  // Résultats calculés
  const [ranks, setRanks] = useState([]);

  // Leaderboard simulé
  const [leaderboardData] = useState([
    { rank: 1, user: "Marc Dupont", initial: "M", discipline: "100m", location: "Paris", performance: "10.23s" },
    { rank: 2, user: "Sophie Martin", initial: "S", discipline: "100m", location: "Lyon", performance: "11.45s" },
    { rank: 3, user: "Jimmy Gressier", initial: "J", discipline: "100m", location: "Paris", performance: "12.15s" },
  ]);

  // Onglets
  const showSection = (tab) => {
    setActiveTab(tab);
  };

  // Gère les champs
  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.id]: e.target.value });
  };

  // Simule un calcul de rangs
  const calculateRanks = (e) => {
    e.preventDefault();
    const results = Object.entries(formValues)
      .filter(([_, v]) => v !== "")
      .map(([key, value], index) => ({
        event: key.replace("chrono_", ""),
        time: value,
        rank: Math.floor(Math.random() * 100) + 1, // simulation
      }));
    setRanks(results);
  };

  return (
    <div className="dashboard-container">

      {/* Navigation */}
      <div className="nav-tabs">
        <button className={`nav-tab ${activeTab === "my-ranks" ? "active" : ""}`} onClick={() => showSection("my-ranks")}>
          Mes Rangs
        </button>
        <button className={`nav-tab ${activeTab === "leaderboard" ? "active" : ""}`} onClick={() => showSection("leaderboard")}>
          Classements
        </button>
        <button className={`nav-tab ${activeTab === "map" ? "active" : ""}`} onClick={() => showSection("map")}>
          Carte
        </button>
      </div>

      {/* Section Mes Rangs */}
      {activeTab === "my-ranks" && (
        <div id="my-ranks" className="content-section active">
          <div className="rank-input-card">
            <h3>📊 Calcule ton rang</h3>
            <form className="calculator-form" onSubmit={calculateRanks}>
              <div className="form-grid">
                {Object.keys(formValues).map((field) => (
                  <div className="form-group" key={field}>
                    <label htmlFor={field}>{field.replace("chrono_", "").toUpperCase()} (hh:mm:ss)</label>
                    <input
                      type="text"
                      id={field}
                      value={formValues[field]}
                      onChange={handleChange}
                      className="form-input time-input"
                      placeholder="00:00:00"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="calculate-btn">
                Calculer son rang
              </button>
            </form>
          </div>

          <div className="results-header">
            <h3>Tes rangs</h3>
            <p>Analyse de performance pour chaque épreuve</p>
          </div>
          <div className="rank-grid">
            {ranks.length === 0 ? (
              <p className="empty-state">Entre tes performances et calcule ton rang</p>
            ) : (
              ranks.map((r, i) => (
                <div key={i} className="rank-card">
                  <h4>{r.event}</h4>
                  <p>Temps : {r.time}</p>
                  <p>Rang estimé : #{r.rank}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Section Classements */}
      {activeTab === "leaderboard" && (
        <div id="leaderboard" className="content-section">
          <h3>Classements 🏅</h3>
          <div className="leaderboard-table">
            <div className="table-header">
              <div>Rang</div>
              <div>Utilisateur</div>
              <div>Épreuve</div>
              <div>Localisation</div>
              <div>Performance</div>
            </div>
            {leaderboardData.map((row) => (
              <div className="table-row" key={row.rank}>
                <div className="rank-position">#{row.rank}</div>
                <div className="user-info-table">
                  <div className="user-avatar-small">{row.initial}</div>
                  <span>{row.user}</span>
                </div>
                <div>{row.discipline}</div>
                <div>{row.location}</div>
                <div>{row.performance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Map */}
      {activeTab === "map" && (
        <div id="map" className="content-section">
          <div className="map-container">
            <div className="map-placeholder">
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🗺️</div>
              <div>Carte interactive des utilisateurs</div>
              <div style={{ fontSize: "14px", marginTop: "10px", opacity: 0.7 }}>
                Intégration Google Maps / Leaflet à venir
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
