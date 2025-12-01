import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import "./leaderboard.css";

const CATEGORY_LABELS = {
    "": "Tous les groupes",
    "demi-fond": "Demi-fond",
    sprint: "Sprint",
    lancers: "Lancers",
    sauts: "Sauts",
};

const EVENT_OPTIONS = {
    "demi-fond": ["800m", "1500m", "3000m", "5000m", "10000m", "semi-marathon", "marathon"],
    sprint: ["50m", "60m", "100m", "200m", "400m", "110m haies", "400m haies"],
    lancers: ["poids", "javelot", "marteau"],
    sauts: ["saut en hauteur", "saut en longueur", "perche", "triple saut"],
};

export default function Leaderboard() {
    const [category, setCategory] = useState("");
    const [event, setEvent] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const eventChoices = useMemo(() => {
        if (!category || !EVENT_OPTIONS[category]) {
            return [];
        }
        return EVENT_OPTIONS[category];
    }, [category]);

    useEffect(() => {
        if (event && !eventChoices.includes(event)) {
            setEvent("");
        }
    }, [eventChoices, event]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError("");
                const params = new URLSearchParams();
                if (category) params.set("category", category);
                if (event) params.set("event", event);
                const res = await api.get(`/leaderboard${params.toString() ? `?${params.toString()}` : ""}`);
                setRows(res.data?.items || []);
            } catch (err) {
                setError(err.response?.data?.message || "Impossible de charger le classement.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [category, event]);

    return (
        <section className="leaderboard-section">
            <header className="leaderboard-header">
                <h1>Classement RiseUp</h1>
                <p>Sélectionnez une discipline pour filtrer les performances de la communauté.</p>
            </header>

            <div className="leaderboard-filters">
                <div className="category-pills">
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <button
                            key={value || "all"}
                            className={`category-pill${category === value ? " active" : ""}`}
                            onClick={() => setCategory((prev) => (prev === value ? "" : value))}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {category && eventChoices.length > 0 && (
                    <div className="event-select">
                        <label>Épreuve</label>
                        <select value={event} onChange={(e) => setEvent(e.target.value)}>
                            <option value="">Toutes les épreuves</option>
                            {eventChoices.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="leaderboard-placeholder">Chargement du classement...</div>
            ) : error ? (
                <div className="leaderboard-placeholder error">{error}</div>
            ) : rows.length === 0 ? (
                <div className="leaderboard-placeholder">Aucune performance enregistrée pour ce filtre.</div>
            ) : (
                <div className="leaderboard-table-wrapper">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Athlète</th>
                                <th>Épreuve</th>
                                <th>Points</th>
                                <th>Rang</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row.user_id}-${row.event}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>{row.name}</td>
                                    <td>{row.event ?? row.best_event}</td>
                                    <td className="points">{row.points}</td>
                                    <td>{row.rank ?? row.best_rank ?? "—"}</td>
                                    <td>{row.performance || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
