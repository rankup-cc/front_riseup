import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { Bike, Dumbbell, Footprints, Waves, Maximize2, X } from "lucide-react";
import "@/pages/coach/coach.css";
import "./AthletePlanView.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePaces } from "@/context/PacesContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SESSION_LABELS = {
    am: "Matin",
    pm: "Soir",
};

const SESSION_TYPES = {
    course: "Course",
    technique: "Technique",
    musculation: "Musculation",
};

const INTENSITY_LABELS = {
    ef: "Endurance fondamentale",
    marathon: "Allure marathon",
    seuil: "Seuil",
    allure5k: "Allure 5K",
    allure1500: "Allure 1500m",
};

const INTENSITY_OPTIONS = [
    { value: "recovery", label: "Récupération" },
    { value: "easy", label: "Facile" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "sustained", label: "Soutenue" },
    { value: "specific", label: "Spécifique" },
];

const DEFAULT_SESSION_TYPE = "course";
const STRUCTURED_TYPES = ["technique", "musculation"];
const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PRIMARY_PACES = [
    { key: "ef", label: "Endurance fondamentale" },
    { key: "seuil", label: "Seuil" },
    { key: "marathon", label: "Allure marathon" },
];
const INTERVALS_5K = [
    { key: "i400", label: "400m" },
    { key: "i1000", label: "1000m" },
    { key: "i1200", label: "1200m" },
    { key: "i1600", label: "1600m" },
];
const INTERVALS_1500 = [
    { key: "r200", label: "200m" },
    { key: "r300", label: "300m" },
    { key: "r400", label: "400m" },
    { key: "r600", label: "600m" },
    { key: "r800", label: "800m" },
];

function ensureDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(dateLike) {
    const date = ensureDate(dateLike) || new Date();
    const day = (date.getDay() + 6) % 7;
    const res = new Date(date);
    res.setHours(0, 0, 0, 0);
    res.setDate(res.getDate() - day);
    return res;
}

function addDays(base, days) {
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDateLabel(date) {
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
    });
}

function formatWeekRangeLabel(baseDate, weekIndex) {
    const base = ensureDate(baseDate);
    if (!base || !Number.isFinite(weekIndex)) return null;
    const monday = startOfWeek(base);
    const weekStart = addDays(monday, weekIndex * 7);
    const weekEnd = addDays(weekStart, 6);
    return `${formatDateLabel(weekStart)} - ${formatDateLabel(weekEnd)}`;
}

function weeksBetween(startDate, endDate = new Date()) {
    const start = startOfWeek(startDate);
    const end = startOfWeek(endDate);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.floor(diff / (7 * DAY_IN_MS));
}

function computeTotalWeeks(planData, startDate) {
    const metadataWeeks = Number(planData?.metadata?.weeks) || 2;
    const sessions = Array.isArray(planData?.sessions) ? planData.sessions : [];
    const maxWeekIndex = sessions.reduce((max, session) => {
        const idx = Number(session?.week_index);
        return Number.isFinite(idx) ? Math.max(max, idx) : max;
    }, 0);
    const sessionWeeks = sessions.length ? maxWeekIndex + 1 : 0;
    const historyWeeks = startDate ? weeksBetween(startDate) + 1 : metadataWeeks;
    return Math.max(metadataWeeks, sessionWeeks, historyWeeks, 2);
}

function formatSeconds(value, suffix = "/km") {
    if (!Number.isFinite(value)) return "—";
    const total = Math.max(0, Math.round(value));
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, "0");
    return suffix ? `${minutes}:${seconds}${suffix}` : `${minutes}:${seconds}`;
}

function buildPrimaryPaces(paces) {
    if (!paces) return [];
    return PRIMARY_PACES.map((item) => {
        const seconds = Number(paces?.[item.key]?.seconds);
        if (!Number.isFinite(seconds)) return null;
        return { ...item, seconds };
    }).filter(Boolean);
}

function buildIntervals(intervals, config) {
    if (!intervals) return [];
    return config
        .map((item) => {
            const seconds = Number(intervals?.[item.key]?.seconds);
            if (!Number.isFinite(seconds)) return null;
            return { ...item, seconds };
        })
        .filter(Boolean);
}

function createEmptySession(slot) {
    return {
        session_slot: slot,
        title: "",
        intensity: "",
        consigne: "",
        primary_focus: "",
        secondary_focus: "",
        notes: "",
        disabled: false,
    };
}

function normalizeBlocks(payload) {
    if (!payload) {
        return [];
    }
    let normalizedPayload = payload;
    if (typeof payload === "string") {
        try {
            normalizedPayload = JSON.parse(payload);
        } catch {
            return [];
        }
    }

    const baseBlock = {
        title: "",
        media: "",
        pace: "",
        paceValue: "",
        passTime: "",
        metric: "distance",
        distance: "",
        duration: "",
        recovery: "",
        reps: "",
        type: "target",
    };

    const blocksArray = Array.isArray(normalizedPayload?.blocks) ? normalizedPayload.blocks : [];
    const blocks = blocksArray.length
        ? blocksArray
        : normalizedPayload
            ? [
                  {
                      title: normalizedPayload?.title || normalizedPayload?.content || "",
                      media: normalizedPayload?.mediaUrl || normalizedPayload?.media || "",
                      pace: normalizedPayload?.pace || "",
                      paceValue: normalizedPayload?.paceValue || "",
                      distance: normalizedPayload?.distance || "",
                      duration: normalizedPayload?.duration || "",
                      type: normalizedPayload?.type || "target",
                  },
              ]
            : [];

    return blocks.map((block) => ({
        ...baseBlock,
        ...block,
        media: block?.mediaUrl || block?.media || "",
        metric: block?.metric === "duration" ? "duration" : "distance",
    }));
}

function buildSessionKey(weekIndex, dayOfWeek, slot) {
    return `${weekIndex}-${dayOfWeek}-${slot}`;
}

function buildEmptyWeeks(count = 2, disabledSessions = []) {
    const disabledSet = new Set(
        (disabledSessions || []).map((session) =>
            buildSessionKey(session.week_index ?? 0, session.day_of_week ?? 0, session.session_slot ?? "am")
        )
    );

    return Array.from({ length: count }, (_, weekIndex) => ({
        week_index: weekIndex,
        days: Array.from({ length: 7 }, (_, dayIndex) => ({
            day_of_week: dayIndex,
            sessions: ["am", "pm"].map((slot) => ({
                ...createEmptySession(slot),
                disabled: disabledSet.has(buildSessionKey(weekIndex, dayIndex, slot)),
            })),
        })),
    }));
}

function mergeSessionsIntoGrid(sessions = [], baseWeeks = []) {
    const weeks = baseWeeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
            ...day,
            sessions: day.sessions.map((session) => ({ ...session })),
        })),
    }));

    sessions.forEach((session) => {
        const weekIndex = Number.isFinite(session.week_index) ? session.week_index : 0;
        const dayIndex = Number.isFinite(session.day_of_week)
            ? session.day_of_week
            : (session.day_index ?? 0) % 7;
        const slot = session.session_slot === "pm" ? "pm" : "am";

        const targetWeek = weeks.find((week) => week.week_index === weekIndex);
        if (!targetWeek) {
            return;
        }

        const targetDay = targetWeek.days.find((day) => day.day_of_week === dayIndex);
        if (!targetDay) {
            return;
        }

        const sessionIndex = targetDay.sessions.findIndex((s) => s.session_slot === slot);
        if (sessionIndex === -1) {
            return;
        }

        targetDay.sessions[sessionIndex] = {
            ...targetDay.sessions[sessionIndex],
            ...session,
            disabled: Boolean(session.disabled),
        };
    });

    return weeks;
}

export default function AthletePlanView({ userId, userCreatedAt }) {
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [weeks, setWeeks] = useState(buildEmptyWeeks());
    const [plan, setPlan] = useState(null);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [planLoading, setPlanLoading] = useState(false);
    const [error, setError] = useState("");
    const [modalSession, setModalSession] = useState(null);
    const [planStartDate, setPlanStartDate] = useState(null);
    const { paces: pacesCtx } = usePaces();

    useEffect(() => {
        let mounted = true;
        setLoadingGroups(true);
        api.get("/groups/my")
            .then((res) => {
                if (!mounted) return;
                const data = Array.isArray(res.data) ? res.data : [];
                const accessible = data.filter((group) => {
                    if (group.coach_id === userId) return true;
                    return (group.members || []).some(
                        (member) => (member.athlete_id ?? member.athlete?.id) === userId
                    );
                });
                setGroups(accessible);
                setSelectedGroupId((prev) => prev ?? accessible[0]?.id ?? null);
            })
            .catch((err) => {
                console.error(err);
                if (mounted) setError("Impossible de charger vos groupes.");
            })
            .finally(() => mounted && setLoadingGroups(false));

        return () => {
            mounted = false;
        };
    }, [userId]);

    const fetchPlan = useCallback(
        async (groupId) => {
            if (!groupId) return;
            setPlanLoading(true);
            setError("");
            try {
                const res = await api.get(`/athlete/groups/${groupId}/plan`);
                const planData = res.data || {};
                const contextGroup = groups.find((g) => g.id === groupId);
                const inferredStart =
                    planData.start_date ||
                    planData.metadata?.start_date ||
                    contextGroup?.created_at ||
                    userCreatedAt ||
                    planStartDate ||
                    new Date().toISOString();
                const weeksCount = computeTotalWeeks(planData, inferredStart);
                const disabledSlots = planData.metadata?.disabled_sessions ?? [];
                setPlan(planData);
                setPlanStartDate(inferredStart);
                setWeeks(
                    mergeSessionsIntoGrid(planData.sessions, buildEmptyWeeks(weeksCount, disabledSlots))
                );
            } catch (err) {
                console.error(err);
                setPlan(null);
                setWeeks(buildEmptyWeeks());
                setError(err.response?.data?.message || "Impossible de charger le plan.");
            } finally {
                setPlanLoading(false);
            }
        },
        [groups, planStartDate, userCreatedAt]
    );

    useEffect(() => {
        if (selectedGroupId) {
            fetchPlan(selectedGroupId);
        }
    }, [selectedGroupId, fetchPlan]);

    const selectedGroup = useMemo(
        () => groups.find((group) => group.id === selectedGroupId),
        [groups, selectedGroupId]
    );

    const activeAthlete = useMemo(() => {
        if (!plan?.athlete_id) return null;
        return selectedGroup?.members?.find(
            (member) => (member.athlete_id ?? member.athlete?.id) === plan.athlete_id
        )?.athlete;
    }, [plan, selectedGroup]);

    const paceChips = useMemo(
        () => buildPrimaryPaces(pacesCtx?.paces),
        [pacesCtx?.paces]
    );
    const intervals5k = useMemo(
        () => buildIntervals(pacesCtx?.intervals_5k, INTERVALS_5K),
        [pacesCtx?.intervals_5k]
    );
    const intervals1500 = useMemo(
        () => buildIntervals(pacesCtx?.intervals_1500, INTERVALS_1500),
        [pacesCtx?.intervals_1500]
    );
    const hasPaces = Boolean(paceChips.length || intervals5k.length || intervals1500.length);
    const paceComputedAt = pacesCtx?.at || pacesCtx?.computed_at;
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [sessionFeedback, setSessionFeedback] = useState({});

    const openModal = (session, dayLabel, slotLabel) => {
        setModalSession({
            session,
            dayLabel,
            slotLabel,
            groupName: selectedGroup?.name || "",
            type: session.primary_focus || DEFAULT_SESSION_TYPE,
        });
    };

    const closeModal = () => setModalSession(null);

    const modalSelectedType = modalSession?.session?.primary_focus || DEFAULT_SESSION_TYPE;
    const modalBlocks = useMemo(() => {
        if (!modalSession?.session) return [];
        return normalizeBlocks(modalSession.session.payload);
    }, [modalSession]);
    const modalRequiresStructure =
        STRUCTURED_TYPES.includes(modalSelectedType) ||
        (modalBlocks.length > 0 &&
            modalBlocks.some(
                (b) =>
                    b.title ||
                    b.distance ||
                    b.duration ||
                    b.reps ||
                    b.recovery ||
                    b.paceValue ||
                    b.passTime
            ));

    useEffect(() => {
        setCurrentWeekIndex((prev) => {
            if (!weeks.length) return 0;
            return Math.min(Math.max(prev, 0), weeks.length - 1);
        });
    }, [weeks.length]);

    const currentWeek = weeks[currentWeekIndex] || null;
    const isFirstWeek = currentWeekIndex <= 0;
    const isLastWeek = weeks.length === 0 ? true : currentWeekIndex >= weeks.length - 1;
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    const getSessionKey = (weekIndex, dayIndex, slot) => buildSessionKey(weekIndex, dayIndex, slot);

    const getCurrentWeekFeedback = () => {
        const entries = [];
        Object.entries(sessionFeedback || {}).forEach(([key, list]) => {
            if (!list || !list.length) return;
            const [week, day, slot] = key.split("-");
            if (Number(week) !== currentWeekIndex) return;
            entries.push({
                week_index: Number(week),
                day_of_week: Number(day),
                session_slot: slot,
                feedback: list,
            });
        });
        return entries;
    };

    const sendWeekFeedback = async () => {
        const entries = getCurrentWeekFeedback();
        if (!entries.length) {
            setFeedbackMessage("Aucun retour à envoyer pour cette semaine.");
            return;
        }
        setIsSendingFeedback(true);
        setFeedbackMessage("");
        try {
            await api.post("/athlete/feedback", {
                group_id: selectedGroupId,
                week_index: currentWeekIndex,
                entries,
            });
            setFeedbackMessage("Retours envoyés au coach.");
        } catch (e) {
            setFeedbackMessage("Échec de l'envoi des retours.");
        } finally {
            setIsSendingFeedback(false);
        }
    };

    const addFeedbackEntry = (key) => {
        setSessionFeedback((prev) => {
            const list = prev[key] || [];
            return {
                ...prev,
                [key]: [...list, { distance: "", pace: "", rpe: 5 }],
            };
        });
    };

    const updateFeedbackEntry = (key, idx, field, value) => {
        setSessionFeedback((prev) => {
            const list = prev[key] || [];
            const next = list.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
            return { ...prev, [key]: next };
        });
    };

    const deleteFeedbackEntry = (key, idx) => {
        setSessionFeedback((prev) => {
            const list = prev[key] || [];
            const next = list.filter((_, i) => i !== idx);
            return { ...prev, [key]: next };
        });
    };

    const handleWeekNavigation = (direction) => {
        setCurrentWeekIndex((prev) => {
            if (weeks.length === 0) return 0;
            const next = Math.min(Math.max(prev + direction, 0), weeks.length - 1);
            return next;
        });
    };

    if (loadingGroups) {
        return <div className="plan-page"><p>Chargement de vos groupes...</p></div>;
    }

    if (!groups.length) {
        return (
            <div className="plan-page">
                <p>Vous ne faites partie d’aucun groupe pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="athlete-plan-view plan-page">
            <div className="plan-header">
                <div className="bloc présentation">
                    <p className="text-sm text-muted-foreground">Suivi d’entraînement</p>
                    <h1 className="text-3xl font-semibold">{selectedGroup?.name}</h1>
                    <p className="text-muted-foreground">
                        {plan?.athlete_id && activeAthlete
                            ? `Plan personnalisé préparé pour ${activeAthlete.first_name} ${activeAthlete.last_name}.`
                            : "Plan partagé par votre coach pour l’ensemble du groupe."}
                    </p>
                </div>
                <select
                    className="history-select"
                    value={selectedGroupId ?? ""}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value) || null)}
                >
                    {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                            {group.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {planLoading ? (
                <p>Chargement du plan…</p>
            ) : (
                <>
                    <div className="athlete-paces-summary">
                        <div className="athlete-paces-summary-header">
                            <div>
                                <p className="text-sm text-muted-foreground">Allures personnelles</p>
                                <h2>Vos allures calculées</h2>
                            </div>
                            {paceComputedAt && (
                                <span className="athlete-paces-date small">
                                    {new Date(paceComputedAt).toLocaleDateString("fr-FR")}
                                </span>
                            )}
                        </div>
                        {hasPaces ? (
                            <>
                                {paceChips.length > 0 && (
                                    <div className="pace-chip-grid">
                                        {paceChips.map((chip) => (
                                            <div className="pace-chip" key={chip.key}>
                                                <span className="pace-chip-label">{chip.label}</span>
                                                <span className="pace-chip-value">
                                                    {formatSeconds(chip.seconds)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {intervals5k.length > 0 && (
                                    <div className="pace-intervals">
                                        <div className="pace-intervals-title">Intervalles 5K</div>
                                        <div className="pace-intervals-grid">
                                            {intervals5k.map((item) => (
                                                <div className="pace-chip small" key={item.key}>
                                                    <span className="pace-chip-label">{item.label}</span>
                                                    <span className="pace-chip-value">
                                                        {formatSeconds(item.seconds, "")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {intervals1500.length > 0 && (
                                    <div className="pace-intervals">
                                        <div className="pace-intervals-title">Intervalles 1500 m</div>
                                        <div className="pace-intervals-grid">
                                            {intervals1500.map((item) => (
                                                <div className="pace-chip small" key={item.key}>
                                                    <span className="pace-chip-label">{item.label}</span>
                                                    <span className="pace-chip-value">
                                                        {formatSeconds(item.seconds, "")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="athlete-paces-message">
                                Aucune allure enregistrée pour le moment. Calculez vos allures dans l’onglet
                                « Calcul de rangs » pour personnaliser vos séances.
                            </p>
                        )}
                    </div>
            <div className="plan-week-grid">
                {currentWeek ? (
                    <div className="plan-week-card" key={currentWeek.week_index}>
                        <div className="plan-week-header">
                            <div className="week-header-top">
                                        <div className="week-switcher">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="week-nav-btn"
                                                onClick={() => handleWeekNavigation(-1)}
                                                disabled={isFirstWeek}
                                                aria-label="Semaine précédente"
                                            >
                                                <span aria-hidden="true">←</span>
                                            </Button>
                                            <p className="week-date-range">
                                                {formatWeekRangeLabel(planStartDate, currentWeek.week_index) ||
                                                    `Semaine ${currentWeekIndex + 1}`}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="week-nav-btn"
                                                onClick={() => handleWeekNavigation(1)}
                                                disabled={isLastWeek}
                                                aria-label="Semaine suivante"
                                            >
                                            <span aria-hidden="true">→</span>
                                        </Button>
                                    </div>
                                    <div className="week-number-subtitle">Semaine {currentWeekIndex + 1}</div>
                                </div>
                                <div className="week-actions">
                                    <Button
                                        onClick={sendWeekFeedback}
                                        disabled={isSendingFeedback}
                                        variant="default"
                                        size="sm"
                                        className="week-send-btn"
                                    >
                                        {isSendingFeedback ? "Envoi en cours..." : "Envoyer les retours de la semaine"}
                                    </Button>
                                    {feedbackMessage && (
                                        <span className="feedback-status">{feedbackMessage}</span>
                                    )}
                                </div>
                            </div>
                                <div className="plan-days-grid">
                                    {(currentWeek.days || []).map((day) => (
                                        <div className="plan-day-card" key={`${currentWeek.week_index}-${day.day_of_week}`}>
                                            <h3>{DAY_LABELS[day.day_of_week]}</h3>
                                            <div className="day-session-list">
                                                {[...(day.sessions || [])]
                                                    .sort((a, b) =>
                                                        (a.session_slot === "am" ? 0 : 1) -
                                                        (b.session_slot === "am" ? 0 : 1)
                                                    )
                                                    .map((session) => {
                                                        const label =
                                                            SESSION_LABELS[session.session_slot] ||
                                                            session.session_slot;
                                                        const selectedType =
                                                            session.primary_focus || DEFAULT_SESSION_TYPE;
                                                        const sessionKey = getSessionKey(
                                                            currentWeekIndex,
                                                            day.day_of_week,
                                                            session.session_slot
                                                        );
                                                        const hasContent =
                                                            session.title ||
                                                            session.consigne ||
                                                            session.intensity;
                                                        const intensityValue = session.intensity || "";
                                                        const intensityLabel =
                                                            INTENSITY_LABELS[intensityValue] ||
                                                            INTENSITY_OPTIONS.find((opt) => opt.value === intensityValue)?.label ||
                                                            (intensityValue ? intensityValue : "Non définie");

                                                        if (session.disabled) {
                                                            return null;
                                                        }

                                                        return (
                                                            <div className="session-slot" key={session.session_slot}>
                                                                <span className="session-slot-label">{label}</span>
                                                                <div
                                                                    className={`session-block${
                                                                        session.disabled ? " session-block-disabled" : ""
                                                                    }`}
                                                                >
                                                                    <>
                                                                            <div className="session-type-selector session-type-selector--single">
                                                                                <div
                                                                                    className={`session-type-option readonly active session-type-${selectedType}`}
                                                                                    aria-label={SESSION_TYPES[selectedType]}
                                                                                >
                                                                                    {selectedType === "velo" ? (
                                                                                        <Bike size={18} />
                                                                                    ) : selectedType === "piscine" ? (
                                                                                        <Waves size={18} />
                                                                                    ) : selectedType === "musculation" ? (
                                                                                        <Dumbbell size={18} />
                                                                                    ) : (
                                                                                        <Footprints size={18} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="session-intensity-wrapper">
                                                                                <label>Intensité</label>
                                                                                <div
                                                                                    className={cn(
                                                                                        "session-intensity-chip",
                                                                                        intensityValue
                                                                                            ? `intensity-${intensityValue}`
                                                                                            : "intensity-undefined"
                                                                                    )}
                                                                                >
                                                                                    {intensityLabel}
                                                                                </div>
                                                                            </div>
                                                                            <div className="session-readonly-field">
                                                                                <strong>
                                                                                    {session.title || "Pas de titre"}
                                                                                </strong>
                                                                                {session.consigne ? (
                                                                                    <span>{session.consigne}</span>
                                                                                ) : null}
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="session-expand-btn"
                                                                                onClick={() =>
                                                                                    openModal(
                                                                                        session,
                                                                                        DAY_LABELS[day.day_of_week],
                                                                                        label
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Maximize2 size={14} />
                                                                                Agrandir
                                                                            </button>
                                                                            <div className="session-feedback">
                                                                                <div className="session-feedback-header">
                                                                                    <strong>Retour athlète</strong>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="session-add-feedback"
                                                                                        onClick={() => addFeedbackEntry(sessionKey)}
                                                                                    >
                                                                                        + Ajouter un retour
                                                                                    </button>
                                                                                </div>
                                                                                {(sessionFeedback[sessionKey] || []).map(
                                                                                    (fb, idx) => {
                                                                                        const pct =
                                                                                            ((Number(fb.rpe || 1) - 1) / 9) *
                                                                                            100;
                                                                                        const gradient = `linear-gradient(90deg, #34d399 0%, #f59e0b ${Math.max(
                                                                                            0,
                                                                                            pct - 10
                                                                                        )}%, #f43f5e ${pct}%, #e5e7eb ${pct}%)`;
                                                                                        return (
                                                                                            <div
                                                                                                className="session-feedback-row"
                                                                                                key={`${sessionKey}-${idx}`}
                                                                                            >
                                                                                                <label>
                                                                                                    Km réalisés
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min="0"
                                                                                                        step="0.1"
                                                                                                        value={fb.distance}
                                                                                                        onChange={(e) =>
                                                                                                            updateFeedbackEntry(
                                                                                                                sessionKey,
                                                                                                                idx,
                                                                                                                "distance",
                                                                                                                e.target.value
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                </label>
                                                                                                <label>
                                                                                                    Allure réalisée (mm:ss)
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={fb.pace}
                                                                                                        onChange={(e) =>
                                                                                                            updateFeedbackEntry(
                                                                                                                sessionKey,
                                                                                                                idx,
                                                                                                                "pace",
                                                                                                                e.target.value
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                </label>
                                                                                                <label className="rpe-group">
                                                                                                    RPE (1 facile · 10 intense)
                                                                                                    <div className="rpe-input">
                                                                                                        <input
                                                                                                            type="range"
                                                                                                            min="1"
                                                                                                            max="10"
                                                                                                            value={fb.rpe || 1}
                                                                                                            onChange={(e) =>
                                                                                                                updateFeedbackEntry(
                                                                                                                    sessionKey,
                                                                                                                    idx,
                                                                                                                    "rpe",
                                                                                                                    Number(
                                                                                                                        e.target
                                                                                                                            .value
                                                                                                                    )
                                                                                                                )
                                                                                                            }
                                                                                                            style={{
                                                                                                                background: gradient,
                                                                                                            }}
                                                                                                        />
                                                                                                        <span className="rpe-value">
                                                                                                            {fb.rpe || 1}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                 </label>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="session-feedback-delete"
                                                                                                    onClick={() =>
                                                                                                        deleteFeedbackEntry(sessionKey, idx)
                                                                                                    }
                                                                                                >
                                                                                                    Supprimer
                                                                                                </button>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    
                                                                    </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Aucune semaine disponible.</p>
                        )}
                    </div>
                </>
            )}

            {modalSession && (
                <div className="session-modal-backdrop">
                    <div className="session-modal">
                        <div className="session-modal-header">
                            <div>
                                <p className="session-modal-subtitle">
                                    {modalSession.dayLabel} · {modalSession.slotLabel}
                                </p>
                                <h2>{modalSession.groupName}</h2>
                            </div>
                            <button className="session-modal-close" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="session-modal-body">
                            <div className="session-readonly-field">
                                <strong>Type de séance</strong>
                                <span>{SESSION_TYPES[modalSelectedType] || "Course"}</span>
                            </div>
                            <div className="session-readonly-field">
                                <strong>Intensité</strong>
                                <span>
                                    {modalSession.session.intensity
                                        ? INTENSITY_OPTIONS.find(
                                              (opt) => opt.value === modalSession.session.intensity
                                          )?.label || modalSession.session.intensity
                                        : "Non définie"}
                                </span>
                            </div>
                            {modalRequiresStructure ? (
                                <div className="session-modal-structure">
                                    {modalBlocks.length === 0 && (
                                        <div className="session-readonly-field">
                                            <span>Pas de blocs détaillés pour cette séance.</span>
                                        </div>
                                    )}
                                    {modalBlocks.map((block, idx) => {
                                        const typeLabel =
                                            block.type === "recovery"
                                                ? "Récupération"
                                                : block.type === "interval"
                                                    ? "Fractionné"
                                                    : "Exercice";
                                        const typeClass =
                                            block.type === "recovery"
                                                ? "session-row-recovery"
                                                : block.type === "interval"
                                                    ? "session-row-interval"
                                                    : "session-row-target";
                                        const metricLabel = block.metric === "duration" ? "Durée" : "Distance";
                                        const metricValue =
                                            block.metric === "duration"
                                                ? block.duration || "—"
                                                : block.distance || "—";
                                        const details = [];
                                        if (block.reps) details.push(`Répétitions: ${block.reps}`);
                                        if (metricValue) details.push(`${metricLabel}: ${metricValue}`);
                                        const paceLabel = block.pace || block.paceValue;
                                        if (paceLabel) details.push(`Allure: ${paceLabel}`);
                                        if (block.passTime) details.push(`Temps de passage: ${block.passTime}`);
                                        if (block.recovery) details.push(`Récup: ${block.recovery}`);
                                        const hideMedia = ["course", "velo", "piscine"].includes(modalSelectedType);

                                        return (
                                            <div
                                                className={cn(
                                                    "session-modal-row",
                                                    typeClass,
                                                    hideMedia && "session-modal-row--single"
                                                )}
                                                key={idx}
                                            >
                                                <div className="session-modal-column">
                                                    <label>{typeLabel}</label>
                                                    <div className="session-readonly-field">
                                                        <strong>{block.title || `${typeLabel} ${idx + 1}`}</strong>
                                                        <span className="session-block-details">
                                                            {details.length ? details.join(" • ") : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!hideMedia && (
                                                    <div className="session-modal-media">
                                                        <label>Lien photo / vidéo</label>
                                                        {block.media ? (
                                                            <a
                                                                className="session-media-anchor"
                                                                href={block.media}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Ouvrir
                                                            </a>
                                                        ) : (
                                                            <p className="session-disabled-text">Pas de lien.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="session-readonly-field">
                                    <strong>Contenu</strong>
                                    <span>
                                        {modalSession.session.consigne ||
                                            "Aucune consigne détaillée pour cette séance."}
                                    </span>
                                </div>
                            )}
                            {!modalRequiresStructure && modalSession.session.notes && (
                                <div className="session-expanded-media">
                                    <label>Illustration</label>
                                    <div className="session-photo-preview">
                                        <img
                                            src={modalSession.session.notes}
                                            alt="Illustration de la séance"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                        />
                                        <p>{modalSession.session.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
