import { useEffect, useState, useMemo } from "react";
import api from "@/services/api";
import "./coach.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import { cn } from "@/lib/utils";
import { Plus, Trash, X } from "lucide-react";

const SESSION_LIBRARY_KEY = "coach-session-library";

export default function CoachDashboard() {
    const [groups, setGroups] = useState([]);
    const [plans, setPlans] = useState([]);
    const [sessionLibrary, setSessionLibrary] = useState({ course: [], velo: [], piscine: [], musculation: [] });
    const [editingSession, setEditingSession] = useState(null); // {key, entry}
    const [saveNotice, setSaveNotice] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        let isMounted = true;
        async function load() {
            try {
                const [groupsRes, plansRes] = await Promise.all([
                    api.get("/coach/groups"),
                    api.get("/coach/training-plans"),
                ]);
                if (isMounted) {
                    setGroups(groupsRes.data || []);
                    setPlans(plansRes.data || []);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        load();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SESSION_LIBRARY_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setSessionLibrary({
                    course: parsed.course || [],
                    velo: parsed.velo || [],
                    piscine: parsed.piscine || [],
                    musculation: parsed.musculation || [],
                });
            }
        } catch {
            /* ignore */
        }
    }, []);

    const athletes = groups.reduce((acc, group) => acc + (group.members?.length || 0), 0);

    const DEFAULT_BLOCK = useMemo(
        () => ({
            type: "target", // target | recovery | interval
            reps: "",
            recovery: "",
            distance: "",
            duration: "",
            metric: "distance",
            passTime: "",
            title: "",
            pace: "",
            paceValue: "",
            mediaUrl: "",
        }),
        []
    );

    const normalizePayload = (payload) => {
        if (!payload) return { blocks: [{ ...DEFAULT_BLOCK }] };
        let normalized = payload;
        if (typeof payload === "string") {
            try {
                normalized = JSON.parse(payload);
            } catch {
                return { blocks: [{ ...DEFAULT_BLOCK }] };
            }
        }
        const blocks = Array.isArray(normalized.blocks) && normalized.blocks.length
            ? normalized.blocks.map((block) => ({
                ...DEFAULT_BLOCK,
                ...block,
                metric: block.metric === "duration" ? "duration" : "distance",
            }))
            : [{ ...DEFAULT_BLOCK }];
        return { blocks };
    };

    const openSessionEditor = (key, entry) => {
        const normalized = normalizePayload(entry.payload);
        setEditingSession({
            key,
            entry: {
                ...entry,
                payload: normalized,
            },
        });
        setSaveNotice("");
    };

    const persistLibrary = (next) => {
        setSessionLibrary(next);
        try {
            localStorage.setItem(SESSION_LIBRARY_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    };

    const updateEditingBlocks = (updater) => {
        setEditingSession((prev) => {
            if (!prev) return prev;
            const blocks = updater(prev.entry.payload.blocks || []);
            return {
                ...prev,
                entry: {
                    ...prev.entry,
                    payload: { blocks },
                },
            };
        });
    };

    const handleBlockFieldChange = (idx, field, value) => {
        updateEditingBlocks((blocks) => blocks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
    };

    const addBlockOfType = (type) => {
        const base = { ...DEFAULT_BLOCK, type };
        if (type === "interval") {
            base.metric = "distance";
        }
        updateEditingBlocks((blocks) => [...blocks, base]);
    };

    const saveEditingSession = () => {
        if (!editingSession) return;
        const { key, entry } = editingSession;
        const list = sessionLibrary[key] || [];
        const nextList = list.map((item) => (item.id === entry.id ? { ...entry, payload: entry.payload } : item));
        persistLibrary({ ...sessionLibrary, [key]: nextList });
        const labels = { course: "Course", velo: "Vélo", piscine: "Natation", musculation: "Musculation" };
        setSaveNotice(`Séance enregistrée dans la bibliothèque ${labels[key] || key}.`);
    };

    const deleteEditingSession = () => {
        if (!editingSession) return;
        const { key, entry } = editingSession;
        const nextList = (sessionLibrary[key] || []).filter((item) => item.id !== entry.id);
        persistLibrary({ ...sessionLibrary, [key]: nextList });
        setEditingSession(null);
    };

    return (
        <section>
            <div className="bienvenue-message">
                <p className="texte-bienvenue">Bienvenue</p>
                <h1 className="text-3xl font-semibold">
                    {user?.name || user?.email}
                </h1>
                <p className="texte-bienvenue">
                    Gérez vos groupes, ajoutez vos athlètes et partagez vos plans d'entraînement.
                </p>
            </div>

            <div className="infos-cards">
                <StatCard label="Groupes" value={groups.length} className="stat-card groupes" />
                <StatCard label="Athlètes suivis" value={athletes} className="stat-card athletes" />
                <StatCard label="Plans d'entraînement" value={plans.length} className="stat-card plans" />
                <StatCard
                    label="Statut"
                    value={user?.coach_status === "approved" ? "Coach vérifié" : "En attente"}
                    className="stat-card statut"
                />
            </div>

            <Card className= "actions-rapides">
                <CardHeader>
                    <CardTitle>Bibliothèque de séances</CardTitle>
                </CardHeader>
                <CardContent className="library-dashboard">
                    <div className="library-tabs">
                        {["course", "velo", "piscine", "musculation"].map((key) => (
                            <div key={key} className="library-tab">
                                <span className="library-tab-icon">{key === "course" ? "🏃" : key === "velo" ? "🚴" : key === "piscine" ? "🏊" : "🏋"}</span>
                                <span className="library-tab-label">
                                    {key === "course"
                                        ? "Course"
                                        : key === "velo"
                                            ? "Vélo"
                                            : key === "piscine"
                                                ? "Natation"
                                                : "Musculation"}
                                </span>
                                <div className="library-tab-list">
                                    {(sessionLibrary[key] || []).slice(0, 5).map((entry) => (
                                        <div className="library-tab-item" key={entry.id}>
                                            <div>
                                                <p className="library-item-title">{entry.title}</p>
                                                <p className="library-item-meta">
                                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ""}
                                                </p>
                                            </div>
                                            <div className="library-item-actions">
                                                <Button size="sm" variant="secondary" onClick={() => openSessionEditor(key, entry)}>
                                                    Ouvrir
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        persistLibrary({
                                                            ...sessionLibrary,
                                                            [key]: (sessionLibrary[key] || []).filter((item) => item.id !== entry.id),
                                                        })
                                                    }
                                                >
                                                    <Trash size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(sessionLibrary[key] || []).length === 0 && (
                                        <p className="text-sm text-muted-foreground">Aucune séance</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {!loading && groups.length === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Commencez avec les groupes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="groupe-advice">
                            Créez votre premier groupe pour y rattacher vos athlètes et partager vos plans.
                        </p>
                        <Button asChild >
                            <a href="/coach/groups">Créer mon premier groupe</a>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {editingSession && (
                <div className="session-modal-backdrop">
                    <div className="session-modal">
                        <div className="session-modal-header">
                            <div>
                                <p className="session-modal-subtitle">Édition de la séance enregistrée</p>
                                <h2>{editingSession.entry.title}</h2>
                            </div>
                            <button className="session-modal-close" onClick={() => setEditingSession(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="session-modal-body">
                            <div className="session-modal-title-field">
                                <label>Titre de la séance</label>
                                <Input
                                    placeholder="Titre"
                                    value={editingSession.entry.title}
                                    className="fond-blanc"
                                    onChange={(e) =>
                                        setEditingSession((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      entry: { ...prev.entry, title: e.target.value },
                                                  }
                                                : prev
                                        )
                                    }
                                />
                            </div>
                            <div className="session-modal-structure">
                                {(editingSession.entry.payload.blocks || []).map((block, idx) => {
                                    const metricValue = block.metric === "duration" ? "duration" : "distance";
                                    const blockType = block.type || "target";
                                    const rowClass = cn(
                                        "session-modal-row",
                                        blockType === "target" && "session-modal-row--target",
                                        blockType === "recovery" && "session-modal-row--recovery"
                                    );
                                    return (
                                        <div className={rowClass} key={idx}>
                                            <div className="session-modal-column">
                                                <label className="encadré-exercice">
                                                    {blockType === "recovery"
                                                        ? "Récupération"
                                                        : blockType === "interval"
                                                            ? "Fractionné"
                                                            : "Exercice ciblé"}
                                                </label>

                                                {blockType === "recovery" ? (
                                                    <div className="session-recovery-inline">
                                                        <Input
                                                            placeholder="Temps de récupération (mm:ss)"
                                                            value={block.duration}
                                                            onChange={(e) => handleBlockFieldChange(idx, "duration", e.target.value)}
                                                        />
                                                    </div>
                                                ) : blockType === "interval" ? (
                                                    <>
                                                        <div className="interval-grid-row interval-grid-row--labels">
                                                            <div className="interval-label">Répétitions</div>
                                                            <select
                                                                className="session-exercise-select"
                                                                value={metricValue}
                                                                onChange={(e) =>
                                                                    handleBlockFieldChange(
                                                                        idx,
                                                                        "metric",
                                                                        e.target.value === "duration" ? "duration" : "distance"
                                                                    )
                                                                }
                                                            >
                                                                <option value="distance">Distance</option>
                                                                <option value="duration">Durée</option>
                                                            </select>
                                                            {metricValue === "distance" ? (
                                                                <div className="interval-label">Temps de passage</div>
                                                            ) : (
                                                                <div className="interval-label">Allure</div>
                                                            )}
                                                            <div className="interval-label">Récup / rep</div>
                                                        </div>
                                                        <div className="interval-grid-row interval-grid-row--values">
                                                            <Input
                                                                placeholder="Nombre"
                                                                value={block.reps}
                                                                className="fond-blanc"
                                                                onChange={(e) => handleBlockFieldChange(idx, "reps", e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder={metricValue === "duration" ? "Durée (mm:ss)" : "Distance (km)"}
                                                                value={metricValue === "duration" ? block.duration : block.distance}
                                                                className="fond-blanc"
                                                                onChange={(e) =>
                                                                    handleBlockFieldChange(
                                                                        idx,
                                                                        metricValue === "duration" ? "duration" : "distance",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <Input
                                                                className="session-pace-value"
                                                                placeholder={metricValue === "duration" ? "Allure (mm:ss)" : "Temps passage"}
                                                                value={metricValue === "duration" ? block.paceValue || "" : block.passTime || ""}
                                                                onChange={(e) =>
                                                                    handleBlockFieldChange(
                                                                        idx,
                                                                        metricValue === "duration" ? "paceValue" : "passTime",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <Input
                                                                className="session-pace-value"
                                                                placeholder="Récup (mm:ss)"
                                                                value={block.recovery || ""}
                                                                onChange={(e) => handleBlockFieldChange(idx, "recovery", e.target.value)}
                                                            />
                                                        </div>
                                                </>
                                            ) : (
                                                    <div className="session-target-inline">
                                                        <select
                                                            className="session-exercise-select"
                                                            value={metricValue}
                                                            onChange={(e) =>
                                                                handleBlockFieldChange(
                                                                    idx,
                                                                    "metric",
                                                                    e.target.value === "duration" ? "duration" : "distance"
                                                                )
                                                            }
                                                        >
                                                            <option value="distance">Distance</option>
                                                            <option value="duration">Durée</option>
                                                        </select>
                                                        <Input
                                                            placeholder={metricValue === "duration" ? "Durée (mm:ss)" : "Distance (km)"}
                                                            value={metricValue === "duration" ? block.duration : block.distance}
                                                            className="fond-blanc"
                                                            onChange={(e) =>
                                                                handleBlockFieldChange(
                                                                    idx,
                                                                    metricValue === "duration" ? "duration" : "distance",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            className="session-pace-value"
                                                            placeholder="Allure / info"
                                                            value={block.paceValue || ""}
                                                            onChange={(e) => handleBlockFieldChange(idx, "paceValue", e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className="session-modal-delete-block"
                                                onClick={() =>
                                                    updateEditingBlocks((blocks) =>
                                                        blocks.filter((_, i) => i !== idx).length
                                                            ? blocks.filter((_, i) => i !== idx)
                                                            : blocks
                                                    )
                                                }
                                                disabled={(editingSession.entry.payload.blocks || []).length <= 1}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    );
                                })}
                                <div className="session-add-buttons-row">
                                    <button
                                        type="button"
                                        className="session-modal-add-block"
                                        onClick={() => addBlockOfType("recovery")}
                                    >
                                        <Plus size={14} />
                                        Ajouter une récupération
                                    </button>
                                    <button
                                        type="button"
                                        className="session-modal-add-block"
                                        onClick={() => addBlockOfType("interval")}
                                    >
                                        <Plus size={14} />
                                        Ajouter un fractionné
                                    </button>
                                    <button
                                        type="button"
                                        className="session-modal-add-block"
                                        onClick={() => addBlockOfType("target")}
                                    >
                                        <Plus size={14} />
                                        Ajouter un exercice ciblé
                                    </button>
                                </div>
                            </div>
                            <div className="session-library-actions">
                                <button className="session-add-block" onClick={saveEditingSession}>
                                    Enregistrer
                                </button>
                                <button className="session-add-block" onClick={deleteEditingSession}>
                                    Supprimer de la bibliothèque
                                </button>
                            </div>
                            {saveNotice && (
                                <p className="session-save-notice">{saveNotice}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function StatCard({ label, value, className }) {
    return (
        <Card className={cn("stat-card-base", className)}>
            <CardHeader>
                <CardTitle className="stat-label">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
