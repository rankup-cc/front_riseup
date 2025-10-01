import React, { useState } from "react";
import { useAuthStore } from "../hooks/AuthStore.jsx";
import marcheImg from "../assets/marche.png";
import feuImg from "../assets/feu.png";
import ActivityMap from "../components/ActivityMap/ActivityMap.jsx"; // (pas utilisé ici, tu peux le garder)

const vincennesRoute = [
  [48.8355, 2.4145],
  [48.8368, 2.4205],
  [48.8379, 2.4268],
  [48.8367, 2.4330],
  [48.8340, 2.4385],
  [48.8310, 2.4440],
  [48.8290, 2.4520],
  [48.8335, 2.4590],
  [48.8385, 2.4620],
  [48.8430, 2.4570],
  [48.8450, 2.4480],
  [48.8440, 2.4390],
  [48.8415, 2.4330],
  [48.8385, 2.4270],
  [48.8360, 2.4200],
  [48.8355, 2.4145]
];

/* Icônes */
const StepsImage = ({ imageSrc = marcheImg, alt = "Pas", size = 120 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <img src={imageSrc} alt={alt} style={{ width: size, height: size, objectFit: "contain", marginBottom: 10 }} />
  </div>
);
const StepsImage2 = ({ imageSrc = feuImg, alt = "Feu", size = 120 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <img src={imageSrc} alt={alt} style={{ width: size, height: size, objectFit: "contain", marginBottom: 10 }} />
  </div>
);

export default function Accueil() {
  const { user } = useAuthStore();

  /* Données semaine */
  const [weeklyData] = useState({
    steps: 45230,
    stepsGoal: 70000,
    calories: 3420,
    caloriesGoal: 4500,
  });

  /* Activités (exemples) */
  const [activities] = useState([
    { id: 1, type: "Course", date: "2024-01-15", time: "07:30", duration: "45:23", distance: "8.5 km", avgSpeed: "11.2 km/h", maxSpeed: "16.8 km/h", avgBPM: 148, efficiency: "Excellent", location: "Parc de Vincennes" },
    { id: 2, type: "Course", date: "2024-01-13", time: "18:45", duration: "32:15", distance: "6.2 km", avgSpeed: "11.5 km/h", maxSpeed: "15.3 km/h", avgBPM: 142, efficiency: "Très bon", location: "barcelona" },
    { id: 3, type: "Course", date: "2024-01-10", time: "09:30", duration: "55:23", distance: "15.5 km", avgSpeed: "12.2 km/h", maxSpeed: "17.8 km/h", avgBPM: 138, efficiency: "Moyen", location: "paris" },
    { id: 4, type: "Course", date: "2024-01-8",  time: "17:45", duration: "42:15", distance: "13.2 km", avgSpeed: "13.5 km/h", maxSpeed: "14.3 km/h", avgBPM: 112, efficiency: "Bon",    location: "berlin" },
  ]);

  /* ✅ Place le calcul ICI, après activities */
  const distanceGoal = 50; // objectif en km
  const totalDistance = activities.reduce((sum, a) => {
    const raw = typeof a.distance === "string" ? a.distance.replace(",", ".") : a.distance;
    const km = parseFloat(String(raw).replace(/[^0-9.\-]/g, "")); // enlève " km"
    return sum + (Number.isFinite(km) ? km : 0);
  }, 0);

  /* Helpers */
  const getPercentage = (current, goal) => Math.min((current / goal) * 100, 100);
  const getEfficiencyColor = (efficiency) => {
    switch (efficiency) {
      case "Excellent": return "#14919B";
      case "Très bon": return "#14919B";
      case "Bon": return "#14919B";
      default: return "#14919B";
    }
  };

  /* Cercle progress */
  const CircularProgress = ({ percentage, size = 100, strokeWidth = 8, color = "#45DFB1" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const dash = `${(percentage / 100) * circumference} ${circumference}`;
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#213A57" strokeWidth={strokeWidth} fill="none" opacity="0.3" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={dash} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease-in-out" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

 return (
  <div
    style={{
      backgroundColor: "#FFFFFF",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}
  >
    <div style={{ width: "1200px", margin: "0 auto", padding: 10 }}>
      {/* GRID 2 colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 30 }}>
          {/* Encadré données de la semaine */}
          <div style={{
            background: '#213A57',
            width: "1180px",
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(69, 223, 177, 0.2)'
          }}>
            <h3 style={{
              color: '#E0F2F1',
              fontSize: '22px',
              marginBottom: '25px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Bienvenue Clément regardons où vous en êtes dans votre entraînement cette semaine!
            </h3>

            {/* 3 colonnes, pas d'encadrés internes */}
            <div style={{
              display: 'grid',
              marginRight: 30,
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              alignItems: 'center',
            }}>
              {/* Pas effectués */}
              <div style={{ textAlign: 'center' }}>
                <StepsImage />
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#45DFB1', fontSize: 14, fontWeight: 600 }}>Pas effectués</div>
                  <div style={{ color: '#E0F2F1', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                    {weeklyData.steps.toLocaleString()} / {weeklyData.stepsGoal.toLocaleString()}
                  </div>
                  <div style={{ color: '#8ADCC6', fontSize: 12, marginTop: 4 }}>
                    {Math.round((weeklyData.steps / weeklyData.stepsGoal) * 100)}%
                  </div>
                </div>
              </div>

              {/* Kilomètres (avec cercle) */}
              <div style={{ textAlign: 'center' }}>
                <CircularProgress
                  percentage={Math.min((totalDistance / distanceGoal) * 100, 100)}
                  size={100}
                  color="#45DFB1"
                />
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#45DFB1', fontSize: 14, fontWeight: 600 }}>Kilomètres parcourus</div>
                  <div style={{ color: '#E0F2F1', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                    {totalDistance.toFixed(1)} km / {distanceGoal} km
                  </div>
                  <div style={{ color: '#8ADCC6', fontSize: 12, marginTop: 4 }}>
                    {Math.round((totalDistance / distanceGoal) * 100)}%
                  </div>
                </div>
              </div>

              {/* Calories consommées */}
              <div style={{ textAlign: 'center' }}>
                <StepsImage2 />
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#45DFB1', fontSize: 14, fontWeight: 600 }}>Calories consommées</div>
                  <div style={{ color: '#E0F2F1', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                    {weeklyData.calories.toLocaleString()} / {weeklyData.caloriesGoal.toLocaleString()}
                  </div>
                  <div style={{ color: '#8ADCC6', fontSize: 12, marginTop: 4 }}>
                    {Math.round((weeklyData.calories / weeklyData.caloriesGoal) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>{/* fin grid */}

        {/* Section des derniers entraînements */}
        <div style={{
          background: '#213A57',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(69, 223, 177, 0.2)'
        }}>
          <h3 style={{ color: '#E0F2F1', fontSize: '24px', marginBottom: '25px', fontWeight: '600' }}>
            Derniers entraînements
          </h3>

          <div style={{ display: 'grid', gap: '25px' }}>
  {activities.map((activity, index) => {
  // Choix du fichier HTML de la carte
  const mapSrc =
    /paris/i.test(activity.location) ? "/map/paris.html?v=2" :
    /barcelone|barcelona/i.test(activity.location) ? "/map/barcelona.html?v=2" :
    /berlin/i.test(activity.location) ? "/map/berlin.html?v=2" :
    "/map/maps.html?v=2"; // défaut
  

  return (
    <div
      key={activity.id}
      style={{
        background: '#F1F1F1',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid rgba(69, 223, 177, 0.35)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}
    >
      {/* Map (HTML depuis /public/map/*.html) */}
      <div
        style={{
          width: '100%',
          height: 500,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 15
        }}
      >
        <iframe
          src={mapSrc}                 // ← seule ligne “variable”
          title={`map-${activity.id}`}
          style={{ width: '100%', height: '100%', border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* En-tête de l'activité */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(69, 223, 177, 0.3)'
        }}
      >
        <div>
          <h4
            style={{
              color: '#213A57',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '4px'
            }}
          >
            {activity.type} • {activity.location}
          </h4>
          <div style={{ color: '#213A57', fontSize: '14px' }}>
            {activity.date} à {activity.time}
          </div>
        </div>
        <div
          style={{
            background: getEfficiencyColor(activity.efficiency),
            color: activity.efficiency === 'Bon' ? '#213A57' : '#E0F2F1',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {activity.efficiency}
        </div>
      </div>

      {/* Statistiques */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#213A57',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {activity.duration}
          </div>
          <div style={{ color: '#14919B', fontSize: '12px', fontWeight: '500' }}>
            DURÉE
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#213A57',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {activity.distance}
          </div>
          <div style={{ color: '#14919B', fontSize: '12px', fontWeight: '500' }}>
            DISTANCE
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#213A57',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {activity.avgSpeed}
          </div>
          <div style={{ color: '#14919B', fontSize: '12px', fontWeight: '500' }}>
            VITESSE MOY.
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#213A57',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {activity.maxSpeed}
          </div>
          <div style={{ color: '#14919B', fontSize: '12px', fontWeight: '500' }}>
            VITESSE MAX
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#213A57',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {activity.avgBPM}
          </div>
          <div style={{ color: '#14919B', fontSize: '12px', fontWeight: '500' }}>
            BPM MOY.
          </div>
        </div>
      </div>
    </div>
  );
})}
</div>
        </div>{/* fin section entraînements */}
    </div>
  </div>
);
}
    