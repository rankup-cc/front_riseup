import "./trouver.css";
import MapTrouver from "../components/ActivityMap/maptrouver.jsx";
import ActivityFeed from "../components/ActivityMap/activityfeed.jsx";

export default function Trouver() {
  return (
    <section className="trouver-page">
      {/* Carte en haut */}
      <div className="trouver-map">
        <MapTrouver />
      </div>

      {/* Feed en dessous */}
      <div className="trouver-feed">
        <ActivityFeed />
      </div>
    </section>
  );
}
