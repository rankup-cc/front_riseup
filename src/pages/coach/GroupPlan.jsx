import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { Trash2, Plus, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import "./coach.css";

const SESSION_LIBRARY_KEY = "coach-session-library";

const debugLog = (...args) => {
    if (import.meta?.env?.MODE !== "production") {
        console.log("[plan-debug]", ...args);
    }
};

const INTENSITY_OPTIONS = [
    { value: "recovery", label: "Récupération" },
    { value: "easy", label: "Facile" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "sustained", label: "Soutenue" },
    { value: "specific", label: "Spécifique" },
];

const SESSION_LABELS = {
    am: "Matin",
    pm: "Soir",
};

const SESSION_SLOTS = ["am", "pm"];

const CourseIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="4" r="2.4" fill="currentColor" />
        <path
            d="M7 21l2.8-6.2 2.7 3L18 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9.5 9.5l4 1.2-2 3.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const MusculationIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
            d="M2 12h1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            d="M9 12h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M22 12h-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const BikeIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <circle cx="6.5" cy="17.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="17.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
            d="M6.5 17.5h3l3-7 2.5 2.5h4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12.5 7.5h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
);

const SwimIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
            d="M3 16c1.5 1 3 1 4.5 0s3-1 4.5 0s3 1 4.5 0s3-1 4.5 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 12l3-2l2 1.5l3-2.5l4 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 7c1 0 1.8 .2 2.5 .7l1 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
);

const SESSION_TYPES = [
    { value: "course", label: "Course", Icon: CourseIcon },
    { value: "velo", label: "Vélo", Icon: BikeIcon },
    { value: "piscine", label: "Piscine", Icon: SwimIcon },
    { value: "musculation", label: "Musculation", Icon: MusculationIcon },
];
const DEFAULT_SESSION_TYPE = "course";

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MAX_INLINE_EXERCISES = 3;

const CHART_COLORS = {
    recovery: "#A2D6F9",
    easy: "#7BD389",
    intermediate: "#FDE68A",
    sustained: "#F59E0B",
    specific: "#F472B6",
    unassigned: "#CBD5F5",
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ENDURANCE_TYPES = ["velo", "piscine"];
const DEFAULT_BLOCK = {
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
};

function ensureDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(dateLike) {
    const date = ensureDate(dateLike) || new Date();
    const day = (date.getDay() + 6) % 7;
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - day);
    return result;
}

function addDays(base, days) {
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result;
}

function buildNormalizedBlock(block) {
    const distance = block?.distance ?? "";
    const duration = block?.duration ?? block?.time ?? "";
    const metric = block?.metric === "duration" ? "duration" : "distance";
    const type = ["recovery", "interval", "target"].includes(block?.type) ? block.type : "target";
    const reps = block?.reps ?? "";
    const recovery = block?.recovery ?? block?.recovery_between ?? "";
    const passTime = block?.passTime ?? block?.pass_time ?? "";
    const title =
        block?.title ??
        block?.content ??
        (distance ? String(distance) : duration ? String(duration) : "");
    const pace = block?.pace ?? block?.media ?? "";
    const paceValue = block?.paceValue ?? block?.pace_value ?? "";
    const mediaUrl = block?.mediaUrl ?? block?.media_url ?? "";

    return {
        ...DEFAULT_BLOCK,
        ...block,
        type,
        reps,
        recovery,
        passTime,
        distance,
        duration,
        metric,
        title,
        pace,
        paceValue,
        mediaUrl,
    };
}

function formatDateLabel(date) {
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
    });
}

function formatWeekRangeLabel(baseDate, weekIndex) {
    const startBase = ensureDate(baseDate);
    if (!startBase || !Number.isFinite(weekIndex)) return null;
    const monday = startOfWeek(startBase);
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

const PRIMARY_PACES = [
    { key: "ef", label: "Endurance fondamentale" },
    { key: "seuil", label: "Seuil" },
    { key: "marathon", label: "Allure marathon" },
];

const BASE_PACE_OPTIONS = [
    { key: "ef", label: "EF" },
    { key: "marathon", label: "Marathon" },
    { key: "seuil", label: "Seuil" },
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

const PACE_SELECT_GROUPS = [
    { label: "Allures calculées", options: BASE_PACE_OPTIONS },
    { label: "Intervalles 5K", options: INTERVALS_5K },
    { label: "Intervalles 1500m", options: INTERVALS_1500 },
];

const PACE_CATEGORIES = [
    { key: "ef", label: "Endurance fondamentale" },
    { key: "seuil", label: "Seuil" },
    { key: "marathon", label: "Allure marathon" },
    { key: "allure5k", label: "Allures 5000" },
    { key: "allure1500", label: "Allures 1500m" },
];

const PACE_CATEGORY_COLORS = {
    ef: "#45DFB1", // vert-menthe (palette app)
    seuil: "#F28C6A", // corail doux
    marathon: "#F4C95D", // doré doux
    allure5k: "#4A7BA7", // bleu pétrole clair
    allure1500: "#EF476F", // rose vif
};

const DISCIPLINE_COLORS = {
    course: "#45DFB1",
    velo: "#4DA3FF",
    piscine: "#5ED1B2",
    musculation: "#C084FC",
};

const PACE_PRIORITY = {
    ef: 1,
    marathon: 2,
    seuil: 3,
    allure5k: 4,
    allure1500: 5,
};

const TRAINING_LOAD_VIEWS = [
    { key: "day", label: "Jour" },
    { key: "week", label: "Semaine" },
    { key: "month", label: "Mois" },
];

function formatSeconds(value, suffix = "/km") {
    if (!Number.isFinite(value)) {
        return "—";
    }
    const total = Math.max(0, Math.round(value));
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, "0");
    return suffix ? `${minutes}:${seconds}${suffix}` : `${minutes}:${seconds}`;
}

function formatComputedAt(dateString) {
    if (!dateString) return "";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function buildPrimaryPaceChips(paces) {
    if (!paces) return [];
    return PRIMARY_PACES.map((item) => {
        const seconds = Number(paces?.[item.key]?.seconds);
        if (!Number.isFinite(seconds)) {
            return null;
        }
        return { ...item, seconds };
    }).filter(Boolean);
}

function buildIntervalItems(intervals, config) {
    if (!intervals) return [];
    return config
        .map((item) => {
            const seconds = Number(intervals?.[item.key]?.seconds);
            if (!Number.isFinite(seconds)) {
                return null;
            }
            return { ...item, seconds };
        })
        .filter(Boolean);
}

function getPaceCategory(key) {
    if (!key) return null;
    if (key.startsWith("r")) return "allure1500";
    if (key.startsWith("i")) return "allure5k";
    if (key === "seuil") return "seuil";
    if (key === "marathon") return "marathon";
    if (key === "ef") return "ef";
    return null;
}

function inferIntensityFromBlocks(blocks = []) {
    let best = null;
    let bestPriority = 0;
    blocks.forEach((block) => {
        const category = getPaceCategory(block.pace);
        const priority = category ? PACE_PRIORITY[category] || 0 : 0;
        if (priority > bestPriority) {
            bestPriority = priority;
            best = category;
        }
    });
    return best || "";
}

function parsePaceSeconds(paceStr) {
    if (!paceStr) return null;
    const clean = String(paceStr).replace("/km", "").trim();
    const parts = clean.split(":").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return null;
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
}

function isBasePaceKey(key) {
    return BASE_PACE_OPTIONS.some((item) => item.key === key);
}

function getSecondsForPaceKey(paceData, key) {
    if (!paceData || !key) return null;
    if (["ef", "marathon", "seuil"].includes(key)) {
        return Number(paceData.paces?.[key]?.seconds);
    }
    if (key.startsWith("i")) {
        return Number(paceData.intervals5k?.[key]?.seconds);
    }
    if (key.startsWith("r")) {
        return Number(paceData.intervals1500?.[key]?.seconds);
    }
    return null;
}

function parseDurationSeconds(durationStr) {
    if (!durationStr) return null;
    const parts = String(durationStr)
        .trim()
        .split(":")
        .map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return null;
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
}

function formatPaceValueDisplay(key, seconds) {
    if (!Number.isFinite(seconds)) return "";
    const suffix = isBasePaceKey(key) ? "/km" : "";
    return formatSeconds(seconds, suffix);
}

function sanitizePaceMessage(message) {
    if (!message) return "";
    if (typeof message !== "string") return String(message);
    if (message.toLowerCase().includes("malformed utf-8")) {
        return "Allures indisponibles pour cet athlète (encodage invalide).";
    }
    return message;
}

function parseDistanceKm(value) {
    if (value === null || value === undefined) return 0;
    const str = String(value).trim().toLowerCase();
    if (!str) return 0;
    const numeric = parseFloat(str.replace(/[^0-9.,]/g, "").replace(",", "."));
    if (Number.isFinite(numeric)) return Math.max(numeric, 0);
    const parts = str.split(":").map((p) => parseFloat(p.replace(",", ".")));
    if (parts.length === 2 && parts.every(Number.isFinite)) {
        const km = parts[0];
        const meters = parts[1] / 1000;
        return Math.max(km + meters, 0);
    }
    return 0;
}

function paceToCategory(paceKey) {
    if (!paceKey) return null;
    const key = String(paceKey).toLowerCase();
    if (key === "ef") return "ef";
    if (key === "seuil") return "seuil";
    if (key === "marathon") return "marathon";
    if (key.startsWith("i")) return "allure5k";
    if (key.startsWith("r")) return "allure1500";
    return null;
}

function categoryLabel(categoryKey) {
    return (
        PACE_CATEGORIES.find((c) => c.key === categoryKey)?.label ||
        "Non défini"
    );
}

function sanitizeWeekClone(week, targetIndex) {
    const cloned = JSON.parse(JSON.stringify(week));
    const normalizedDays = (cloned.days || []).map((day, dayIdx) => ({
        ...day,
        day_of_week: Number.isFinite(day.day_of_week) ? day.day_of_week : dayIdx,
        sessions: (day.sessions || []).map((session) => ({
            ...session,
            session_slot: SESSION_SLOTS.includes(session.session_slot) ? session.session_slot : "am",
            payload: normalizeSessionPayload(session.payload),
        })),
    }));

    return {
        ...cloned,
        week_index: targetIndex,
        days: normalizedDays,
    };
}

function emptyPayload() {
    return {
        blocks: [{ ...DEFAULT_BLOCK }],
    };
}

function normalizeSessionPayload(payload) {
    if (!payload) {
        return emptyPayload();
    }
    let normalizedPayload = payload;
    if (typeof payload === "string") {
        try {
            normalizedPayload = JSON.parse(payload);
        } catch {
            return emptyPayload();
        }
    }
    if (typeof normalizedPayload !== "object") {
        return emptyPayload();
    }
    const blocks = Array.isArray(normalizedPayload.blocks) && normalizedPayload.blocks.length
        ? normalizedPayload.blocks.map((block) => buildNormalizedBlock(block))
        : [
              buildNormalizedBlock({
                  distance: normalizedPayload?.distance || "",
                  duration: normalizedPayload?.duration || "",
                  title:
                      normalizedPayload?.title ||
                      normalizedPayload?.content ||
                      (normalizedPayload?.distance
                          ? String(normalizedPayload.distance)
                          : normalizedPayload?.duration
                            ? String(normalizedPayload.duration)
                            : ""),
                  mediaUrl: normalizedPayload?.mediaUrl || normalizedPayload?.media_url || "",
              }),
          ];
    return {
        blocks,
    };
}

function sanitizeBlocksForSave(payload) {
    const normalized = normalizeSessionPayload(payload);
    return {
        blocks: (normalized.blocks || []).map((block) => ({
            type: block?.type ?? "target",
            reps: block?.reps ?? "",
            recovery: block?.recovery ?? "",
            distance: block?.distance ?? "",
            duration: block?.duration ?? "",
            metric: block?.metric === "duration" ? "duration" : "distance",
            title: block?.title || block?.distance || block?.duration
                ? String(block?.title || block?.distance || block?.duration)
                : "",
            content: block?.title || block?.distance || block?.duration
                ? String(block?.title || block?.distance || block?.duration)
                : "",
            pace: block?.pace ?? "",
            paceValue: block?.paceValue ?? "",
            mediaUrl: block?.mediaUrl ?? block?.media_url ?? "",
            pass_time: block?.passTime ?? block?.pass_time ?? "",
            recovery_between: block?.recovery ?? block?.recovery_between ?? "",
        })),
    };
}

function buildDisabledSlots(weeks = []) {
    const disabled = [];
    weeks.forEach((week) => {
        const wIndex = Number(week.week_index) || 0;
        (week.days || []).forEach((day) => {
            const dIndex = Number(day.day_of_week) || 0;
            (day.sessions || []).forEach((session) => {
                if (session.disabled) {
                    disabled.push({
                        week_index: wIndex,
                        day_of_week: dIndex,
                        session_slot: session.session_slot === "pm" ? "pm" : "am",
                    });
                }
            });
        });
    });
    return disabled;
}

function flattenWeeksToSessions(weeks = []) {
    const sessions = [];
    weeks.forEach((week) => {
        const wIndex = Number(week.week_index) || 0;
        (week.days || []).forEach((day) => {
            const dIndex = Number(day.day_of_week) || 0;
            (day.sessions || []).forEach((session) => {
                if (session.disabled) return;
                sessions.push({
                    week_index: wIndex,
                    day_index: wIndex * 7 + dIndex,
                    day_of_week: dIndex,
                    session_slot: SESSION_SLOTS.includes(session.session_slot) ? session.session_slot : "am",
                    title: session.title || null,
                    intensity: session.intensity || null,
                    primary_focus: session.primary_focus || null,
                    secondary_focus: session.secondary_focus || null,
                    notes: session.notes || null,
                    payload: sanitizeBlocksForSave(session.payload),
                });
            });
        });
    });
    return sessions;
}

function createEmptySession(slot) {
    return {
        session_slot: slot,
        title: "",
        intensity: "",
        primary_focus: DEFAULT_SESSION_TYPE,
        secondary_focus: "",
        notes: "",
        disabled: false,
        payload: emptyPayload(),
    };
}

function createEmptyWeek(weekIndex, disabledSessions = []) {
    const disabledSet = new Set(
        (disabledSessions || []).map((session) =>
            buildSessionKey(session.week_index ?? weekIndex, session.day_of_week ?? 0, session.session_slot ?? "am")
        )
    );

    return {
        week_index: weekIndex,
        days: Array.from({ length: 7 }, (_, dayIndex) => ({
            day_of_week: dayIndex,
            sessions: SESSION_SLOTS.map((slot) => ({
                ...createEmptySession(slot),
                disabled: disabledSet.has(buildSessionKey(weekIndex, dayIndex, slot)),
            })),
        })),
    };
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
            sessions: SESSION_SLOTS.map((slot) => ({
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

        const normalizedPayload = normalizeSessionPayload(session.payload);
        const inferredIntensity = inferIntensityFromBlocks(normalizedPayload.blocks);

        targetDay.sessions[sessionIndex] = {
            ...targetDay.sessions[sessionIndex],
            ...session,
            disabled: false,
            payload: normalizedPayload,
            intensity: session.intensity || inferredIntensity || "",
        };
    });

    return weeks;
}

export default function GroupPlan() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [planTitle, setPlanTitle] = useState("");
    const [planDescription, setPlanDescription] = useState("");
    const [weeks, setWeeks] = useState(buildEmptyWeeks());
    const [summary, setSummary] = useState(null);
    const [historyFilter, setHistoryFilter] = useState("all");
    const [chartFocus, setChartFocus] = useState("course"); // "course" | "other"
    const [loading, setLoading] = useState(true);
    const [savingWeek, setSavingWeek] = useState(null);
    const [error, setError] = useState("");
    const [selectedAthletes, setSelectedAthletes] = useState([]);
    const [planContext, setPlanContext] = useState({ scope: "group", athleteId: null });
    const [modalSession, setModalSession] = useState(null);
    const [planStartDate, setPlanStartDate] = useState(null);
    const planStartDateRef = useRef(null);
    const groupRef = useRef(null);
    const [athletePacesMap, setAthletePacesMap] = useState({});
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [copiedWeek, setCopiedWeek] = useState(null);
    // Large cap to allow navigating far in the future; earliest week is index 0
    const MAX_WEEKS = 200;
    const hasSelectedAthlete = selectedAthletes.length === 1;
    const [sessionLibrary, setSessionLibrary] = useState({ course: [], velo: [], piscine: [] });
    const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
    const hasFetchedGroupPlanRef = useRef(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState("");
    const [loadView, setLoadView] = useState("week");
    const currentWeekSetRef = useRef(false);

    const fetchPlanAndSummary = useCallback(
        async (athleteId = null, groupContext = null) => {
            const cacheKey = `plan-cache-${groupId}-${athleteId || "group"}`;
            try {
                const query = athleteId ? `?athlete_id=${athleteId}` : "";
                const [planRes, summaryRes] = await Promise.all([
                    api.get(`/coach/groups/${groupId}/plan${query}`),
                    api.get(`/coach/groups/${groupId}/plan/summary${query}`),
                ]);

                let planData = planRes.data || {};
                debugLog("GET plan", { athleteId, sessions: planData.sessions?.length, sample: planData.sessions?.[0]?.payload });

                // Si le backend renvoie des sessions vides mais qu'on a un cache local, on réutilise le cache
                if ((!planData.sessions || planData.sessions.length === 0) && typeof localStorage !== "undefined") {
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        try {
                            planData = JSON.parse(cached);
                        } catch {
                            /* ignore */
                        }
                    }
                }

                const contextGroup = groupContext || groupRef.current;
                const inferredStart =
                    planData.start_date ||
                    planData.metadata?.start_date ||
                    contextGroup?.created_at ||
                    planStartDateRef.current ||
                    new Date().toISOString();
                const weeksCount = computeTotalWeeks(planData, inferredStart);
                setPlanStartDate(inferredStart);
                planStartDateRef.current = inferredStart;
                const disabledSlots = planData.metadata?.disabled_sessions ?? [];
                setPlanTitle(planData.title ?? "");
                setPlanDescription(planData.description ?? "");
                setWeeks(
                    mergeSessionsIntoGrid(planData.sessions, buildEmptyWeeks(weeksCount, disabledSlots))
                );
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem(cacheKey, JSON.stringify(planData));
                }
                setSummary(summaryRes.data || null);
                setHistoryFilter("all");
                setPlanContext({
                    scope: athleteId ? "athlete" : "group",
                    athleteId,
                });
                setError("");
            } catch (err) {
                setError(err.response?.data?.message || "Impossible de charger le plan.");
            }
        },
        [groupId]
    );

    const fetchFeedbacks = useCallback(
        async (athleteId = null, weekIndex = null) => {
            if (!groupId) return;
            setFeedbackLoading(true);
            setFeedbackError("");
            try {
                const res = await api.get("/coach/athlete-feedback", {
                    params: {
                        group_id: groupId,
                        athlete_id: athleteId || undefined,
                        week_index: Number.isFinite(weekIndex) ? weekIndex : undefined,
                    },
                });
                setFeedbacks(res.data || []);
            } catch (err) {
                setFeedbackError(err.response?.data?.message || "Impossible de charger les retours athlètes.");
            } finally {
                setFeedbackLoading(false);
            }
        },
        [groupId]
    );

    const fetchAthletePaces = useCallback(
        async (athleteId) => {
            if (!athleteId) return;

            setAthletePacesMap((prev) => ({
                ...prev,
                [athleteId]: {
                    status: "loading",
                    data: null,
                    message: null,
                },
            }));

            try {
                const res = await api.get(
                    `/coach/groups/${groupId}/athletes/${athleteId}/paces`
                );
                const payload = res.data;
                if (!payload?.paces) {
                    setAthletePacesMap((prev) => ({
                        ...prev,
                        [athleteId]: {
                            status: "empty",
                            data: null,
                            message: "Cet athlète n'a pas encore calculé ses allures.",
                        },
                    }));
                    return;
                }

                setAthletePacesMap((prev) => ({
                    ...prev,
                    [athleteId]: {
                        status: "ready",
                        data: {
                            computedAt: payload.computed_at,
                            paces: payload.paces,
                            intervals5k: payload.intervals_5k,
                            intervals1500: payload.intervals_1500,
                        },
                        message: null,
                    },
                }));
            } catch (err) {
                const rawMessage = err?.response?.data;
                const readableMessage =
                    typeof rawMessage === "string"
                        ? rawMessage
                        : rawMessage?.message || "Impossible de charger les allures.";

                setAthletePacesMap((prev) => ({
                    ...prev,
                    [athleteId]: {
                        status: "error",
                        data: null,
                        message: readableMessage,
                    },
                }));
            }
        },
        [groupId]
    );

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const groupRes = await api.get(`/coach/groups/${groupId}`);
            setGroup(groupRes.data);
            groupRef.current = groupRes.data;
            // Ne charger le plan groupe qu'une fois au premier chargement
            if (!hasFetchedGroupPlanRef.current) {
                hasFetchedGroupPlanRef.current = true;
                await fetchPlanAndSummary(undefined, groupRes.data);
            }
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Impossible de charger le plan.");
        } finally {
            setLoading(false);
        }
    }, [fetchPlanAndSummary, groupId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        groupRef.current = group;
    }, [group]);

    useEffect(() => {
        setSelectedAthletes([]);
        setPlanContext({ scope: "group", athleteId: null });
    }, [groupId]);

    useEffect(() => {
        setAthletePacesMap((prev) => {
            const next = {};
            selectedAthletes.forEach((athleteId) => {
                if (prev[athleteId]) {
                    next[athleteId] = prev[athleteId];
                }
            });
            return next;
        });
    }, [selectedAthletes]);

    useEffect(() => {
        selectedAthletes.forEach((athleteId) => {
            if (!athletePacesMap[athleteId]) {
                fetchAthletePaces(athleteId);
            }
        });
    }, [selectedAthletes, athletePacesMap, fetchAthletePaces]);

    useEffect(() => {
        if (!hasSelectedAthlete) return;
        const target = selectedAthletes[0];
        fetchPlanAndSummary(target);
        fetchFeedbacks(target, currentWeekIndex);
    }, [hasSelectedAthlete, selectedAthletes, fetchPlanAndSummary, fetchFeedbacks, currentWeekIndex]);

    useEffect(() => {
        const target = selectedAthletes.length === 1 ? selectedAthletes[0] : null;
        fetchPlanAndSummary(target);
        fetchFeedbacks(target, currentWeekIndex);
    }, [selectedAthletes, fetchPlanAndSummary, fetchFeedbacks, currentWeekIndex]);

    const openSessionModal = (weekIndex, dayOfWeek, slot) => {
        setModalSession({ weekIndex, dayOfWeek, slot });
    };

    const closeSessionModal = () => setModalSession(null);

    const getSessionEntry = useCallback(
        (weekIndex, dayOfWeek, slot) => {
            const weekData = weeks.find((week) => week.week_index === weekIndex);
            const dayData = weekData?.days?.find((day) => day.day_of_week === dayOfWeek);
            const sessionData = dayData?.sessions?.find((session) => session.session_slot === slot);
            return { week: weekData, day: dayData, session: sessionData };
        },
        [weeks]
    );

    const modalEntry = useMemo(() => {
        if (!modalSession) return null;
        return getSessionEntry(modalSession.weekIndex, modalSession.dayOfWeek, modalSession.slot);
    }, [modalSession, getSessionEntry]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SESSION_LIBRARY_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setSessionLibrary({
                    course: parsed.course || [],
                    velo: parsed.velo || [],
                    piscine: parsed.piscine || [],
                });
            }
        } catch {
            setSessionLibrary({ course: [], velo: [], piscine: [] });
        }
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
                });
            }
        } catch {
            setSessionLibrary({ course: [], velo: [], piscine: [] });
        }
    }, []);

    const handleSessionChange = (weekIndex, dayOfWeek, slot, field, value) => {
        setWeeks((prev) =>
            prev.map((week) => {
                if (week.week_index !== weekIndex) return week;
                return {
                    ...week,
                    days: week.days.map((day) => {
                        if (day.day_of_week !== dayOfWeek) return day;
                        return {
                            ...day,
                            sessions: day.sessions.map((session) => {
                                if (session.session_slot !== slot) {
                                    return session;
                                }
                                if (session.disabled) {
                                    return session;
                                }
                                return {
                                    ...session,
                                    [field]: value,
                                };
                            }),
                        };
                    }),
                };
            })
        );
    };

    const handleToggleSessionSlot = (weekIndex, dayOfWeek, slot, shouldDisable) => {
        setWeeks((prev) =>
            prev.map((week) => {
                if (week.week_index !== weekIndex) return week;
                return {
                    ...week,
                    days: week.days.map((day) => {
                        if (day.day_of_week !== dayOfWeek) return day;
                        return {
                            ...day,
                            sessions: day.sessions.map((session) => {
                                if (session.session_slot !== slot) return session;
                                if (shouldDisable) {
                                    return {
                                        ...createEmptySession(slot),
                                        disabled: true,
                                    };
                                }
                                return {
                                    ...createEmptySession(slot),
                                    disabled: false,
                                };
                            }),
                        };
                    }),
                };
            })
        );
    };

    const toggleSessionDetail = (weekIndex, dayOfWeek, slot) => {
        const key = buildSessionKey(weekIndex, dayOfWeek, slot);
        setExpandedSessions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSaveWeek = async (weekIndex) => {
        if (selectedAthletes.length === 0) {
            setError("Sélectionnez un athlète avant de sauvegarder un plan personnalisé.");
            return;
        }
        setSavingWeek(weekIndex);
        setError("");
        try {
            const targetAthlete =
                selectedAthletes.length === 1 ? selectedAthletes[0] : null;
            const flattenedSessions = flattenWeeksToSessions(weeks);

            const payload = {
                title: planTitle || (group ? `Plan - ${group.name}` : undefined),
                description: planDescription || null,
                start_date: planStartDate || null,
                weeks: weeks.map((week) => ({
                    week_index: week.week_index,
                    days: week.days.map((day) => ({
                        day_of_week: day.day_of_week,
                        sessions: day.sessions.map((session) => ({
                            session_slot: session.session_slot,
                            title: session.title || null,
                            intensity: session.intensity || null,
                            primary_focus: session.primary_focus || null,
                            secondary_focus: session.secondary_focus || null,
                            notes: session.notes || null,
                            disabled: Boolean(session.disabled),
                            payload: sanitizeBlocksForSave(session.payload),
                        })),
                    })),
                })),
            };
            if (targetAthlete) {
                payload.athlete_ids = [targetAthlete];
            }

            debugLog("PUT plan payload", payload);
            const res = await api.put(`/coach/groups/${groupId}/plan`, payload);
            debugLog("PUT plan response", res?.data);

            // Stocke un cache local du plan envoyé pour cet athlète (ou groupe) pour réafficher après reload
            if (typeof localStorage !== "undefined") {
                const cacheKey = `plan-cache-${groupId}-${targetAthlete || "group"}`;
                const cachedPlan = {
                    title: planTitle,
                    description: planDescription,
                    metadata: {
                        disabled_sessions: buildDisabledSlots(weeks),
                        start_date: planStartDate,
                    },
                    sessions: res?.data?.sessions || flattenedSessions,
                };
                localStorage.setItem(cacheKey, JSON.stringify(cachedPlan));
            }

            // Rafraîchir le résumé pour le contexte courant (athlète ou groupe)
            try {
                const summaryQuery = targetAthlete ? `?athlete_id=${targetAthlete}` : "";
                const summaryRes = await api.get(
                    `/coach/groups/${groupId}/plan/summary${summaryQuery}`
                );
                setSummary(summaryRes.data || null);
            } catch {
                /* ignore */
            }
        } catch (err) {
            setError(err.response?.data?.message || "Sauvegarde impossible.");
        } finally {
            setSavingWeek(null);
        }
    };

    const activeAthlete = useMemo(() => {
        if (!planContext.athleteId || !group?.members) return null;
        const member = group.members.find(
            (m) => (m.athlete_id ?? m.athlete?.id) === planContext.athleteId
        );
        return member?.athlete ?? null;
    }, [group, planContext]);

    const chartStats = useMemo(() => {
        const targetWeeks =
            historyFilter === "all"
                ? weeks
                : weeks.filter((w) => String(w.week_index) === String(historyFilter));
        const paceData =
            activeAthlete && athletePacesMap[activeAthlete.id]?.status === "ready"
                ? athletePacesMap[activeAthlete.id]?.data
                : null;

        const resolvePaceSeconds = (block) => {
            return (
                parsePaceSeconds(block.pace) ||
                getSecondsForPaceKey(paceData, String(block.pace || block.paceValue || "").toLowerCase())
            );
        };

        const computeBlockKm = (block) => {
            const reps = Number(block.reps) || 0;
            const paceSec = resolvePaceSeconds(block);
            const distanceKm = parseDistanceKm(block.distance);
            const durationSec = parseDurationSeconds(block.duration || block.passTime || block.pass_time);
            let km = distanceKm;

            // Si pas de distance, on déduit via la durée + allure
            if ((!km || km <= 0) && durationSec && paceSec) {
                km = durationSec / paceSec;
            }

            // Applique les répétitions si renseignées
            if (reps > 0) {
                km = km * reps;
            }

            return Number.isFinite(km) && km > 0 ? km : 0;
        };

        if (chartFocus === "course") {
            const counts = PACE_CATEGORIES.reduce((acc, cat) => {
                acc[cat.key] = 0;
                return acc;
            }, {});
            let totalKm = 0;

            targetWeeks.forEach((week) => {
                (week.days || []).forEach((day) => {
                    (day.sessions || []).forEach((session) => {
                        if (session.disabled) return;
                        const focus = session.primary_focus || DEFAULT_SESSION_TYPE;
                        if (focus !== "course") return;
                        const blocks = normalizeSessionPayload(session.payload).blocks || [];
                        blocks.forEach((block) => {
                            const category = paceToCategory(block.pace);
                            if (!category) return;
                            const km = computeBlockKm(block);
                            counts[category] = (counts[category] || 0) + km;
                            totalKm += km;
                        });
                    });
                });
            });

            const data = PACE_CATEGORIES.map((cat) => ({
                key: cat.key,
                name: cat.label,
                value: counts[cat.key] || 0,
                percentage: totalKm > 0 ? Math.round(((counts[cat.key] || 0) / totalKm) * 100) : 0,
            })).filter((item) => item.value > 0);

            return { mode: "course", data, total: totalKm };
        }

        // Répartition par nombre de séances pour vélo/natation/muscu
        const focusKeys = ["velo", "piscine", "musculation"];
        const counts = focusKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        let totalSessions = 0;

        targetWeeks.forEach((week) => {
            (week.days || []).forEach((day) => {
                (day.sessions || []).forEach((session) => {
                    if (session.disabled) return;
                    const focus = session.primary_focus || DEFAULT_SESSION_TYPE;
                    if (!focusKeys.includes(focus)) return;
                    counts[focus] = (counts[focus] || 0) + 1;
                    totalSessions += 1;
                });
            });
        });

        const data = focusKeys
            .map((key) => ({
                key,
                name: key === "velo" ? "Vélo" : key === "piscine" ? "Natation" : "Musculation",
                value: counts[key] || 0,
                percentage: totalSessions > 0 ? Math.round(((counts[key] || 0) / totalSessions) * 100) : 0,
            }))
            .filter((item) => item.value > 0);

        return { mode: "discipline", data, total: totalSessions };
    }, [weeks, historyFilter, chartFocus]);

    const historyOptions = useMemo(() => {
        if (!weeks?.length) return [];
        return weeks
            .slice()
            .sort((a, b) => a.week_index - b.week_index)
            .map((week) => ({
                value: String(week.week_index),
                label: `Semaine ${Number(week.week_index) + 1}`,
            }));
    }, [weeks]);

    // Positionne la vue directement sur la semaine en cours (relative à la date de début du plan),
    // tout en conservant les données des semaines précédentes.
    useEffect(() => {
        if (!weeks?.length || currentWeekSetRef.current) return;
        const start = ensureDate(planStartDate || planStartDateRef.current);
        if (!start) return;
        const idx = Math.min(Math.max(weeksBetween(start, new Date()), 0), weeks.length - 1);
        setCurrentWeekIndex(idx);
        currentWeekSetRef.current = true;
    }, [weeks, planStartDate]);

    const loadEntries = useMemo(() => {
        if (!feedbacks.length) return [];
        return feedbacks.map((fb) => {
            const paceSec = parsePaceSeconds(fb.pace);
            const distance = Number(fb.distance);
            let durationSec = 0;
            if (Number.isFinite(distance) && distance > 0 && Number.isFinite(paceSec)) {
                durationSec = distance * paceSec;
            }
            const rpe = Number(fb.rpe) || 0;
            const load = rpe * durationSec;
            const date = fb.created_at ? new Date(fb.created_at) : null;
            return {
                ...fb,
                durationSec,
                load,
                date,
            };
        });
    }, [feedbacks]);

    const feedbackByDay = useMemo(() => {
        const base = Array.from({ length: 7 }, (_, day) => ({
            day,
            am: [],
            pm: [],
        }));
        feedbacks.forEach((fb) => {
            if (Number(fb.week_index) !== currentWeekIndex) return;
            const dayIdx = Number.isFinite(Number(fb.day_of_week)) ? Number(fb.day_of_week) : 0;
            const slot = fb.session_slot === "pm" ? "pm" : "am";
            base[dayIdx][slot].push(fb);
        });
        return base;
    }, [feedbacks, currentWeekIndex]);

    const visibleLoadData = useMemo(() => {
        const baseDate = ensureDate(planStartDate);

        const byDay = {};
        feedbackByDay.forEach((day) => {
            ["am", "pm"].forEach((slot) => {
                (day[slot] || []).forEach((fb) => {
                    const paceSec = parsePaceSeconds(fb.pace);
                    const distance = Number(fb.distance);
                    let durationSec = 0;
                    if (Number.isFinite(distance) && distance > 0 && Number.isFinite(paceSec)) {
                        durationSec = distance * paceSec;
                    }
                    const rpe = Number(fb.rpe) || 0;
                    const load = rpe * durationSec;

                    // Positionne la charge sur le jour de séance (planifié), pas sur le jour d’envoi
                    let dayDate = null;
                    if (baseDate && Number.isFinite(fb.week_index)) {
                        const weekStart = addDays(startOfWeek(baseDate), Number(fb.week_index) * 7);
                        dayDate = addDays(weekStart, Number(fb.day_of_week) || 0);
                    }
                    if (!dayDate || Number.isNaN(dayDate.getTime())) return;

                    const key = dayDate.toISOString().slice(0, 10);
                    byDay[key] = (byDay[key] || 0) + load;
                });
            });
        });

        return Object.entries(byDay)
            .map(([date, load]) => ({ date, load: Math.round(load) }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [feedbackByDay, loadView, planStartDate]);

    const resolveAthlete = useCallback(
        (athleteId) => {
            if (!group?.members) return null;
            const member = group.members.find(
                (m) => (m.athlete_id ?? m.athlete?.id) === athleteId
            );
            return member?.athlete ?? null;
        },
        [group]
    );

    const pacePanelSubtitle = useMemo(() => {
        if (selectedAthletes.length === 0) {
            return "Sélectionnez un athlète pour obtenir ses allures.";
        }
        return "Allures personnalisées";
    }, [selectedAthletes]);

    const selectedAthleteEntries = useMemo(() => {
        return selectedAthletes.map((athleteId) => ({
            athleteId,
            athlete: resolveAthlete(athleteId),
            entry: athletePacesMap[athleteId],
        }));
    }, [selectedAthletes, resolveAthlete, athletePacesMap]);
    const referencePaceData = useMemo(
        () => selectedAthleteEntries[0]?.entry?.data || null,
        [selectedAthleteEntries]
    );

    const updateSessionPayload = (weekIndex, dayOfWeek, slot, updater) => {
        setWeeks((prev) =>
            prev.map((week) => {
                if (week.week_index !== weekIndex) return week;
                return {
                    ...week,
                    days: week.days.map((day) => {
                        if (day.day_of_week !== dayOfWeek) return day;
                        return {
                            ...day,
                            sessions: day.sessions.map((session) => {
                                if (session.session_slot !== slot) return session;
                                const payload = normalizeSessionPayload(session.payload);
                                const nextPayload = updater(payload);
                                return {
                                    ...session,
                                    payload: nextPayload,
                                    intensity: inferIntensityFromBlocks(nextPayload.blocks) || "",
                                };
                            }),
                        };
                    }),
                };
            })
        );
    };

    const getDefaultPaceValue = useCallback(
        (paceKey) => {
            const seconds = getSecondsForPaceKey(referencePaceData, paceKey);
            if (!Number.isFinite(seconds)) return "";
            return formatPaceValueDisplay(paceKey, seconds);
        },
        [referencePaceData]
    );

    const handlePayloadBlockChange = (weekIndex, dayOfWeek, slot, blockIndex, field, value) => {
        updateSessionPayload(weekIndex, dayOfWeek, slot, (payload) => {
            const blocks = [...payload.blocks];
            blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
            return { blocks };
        });
    };

    const handleExercisePaceSelect = (
        weekIndex,
        dayOfWeek,
        slot,
        blockIndex,
        paceKey
    ) => {
        updateSessionPayload(weekIndex, dayOfWeek, slot, (payload) => {
            const blocks = [...payload.blocks];
            const defaultValue = getDefaultPaceValue(paceKey);
            blocks[blockIndex] = {
                ...blocks[blockIndex],
                pace: paceKey,
                paceValue: defaultValue || blocks[blockIndex].paceValue || "",
            };
            return { blocks };
        });
    };

    const handleAddPayloadBlock = (weekIndex, dayOfWeek, slot, type = "target") => {
        updateSessionPayload(weekIndex, dayOfWeek, slot, (payload) => {
            const preset =
                type === "recovery"
                    ? { metric: "duration", duration: "" }
                    : type === "interval"
                        ? { metric: "distance", reps: "", passTime: "" }
                        : {};
            return {
                blocks: [...payload.blocks, { ...DEFAULT_BLOCK, type, ...preset }],
            };
        });
    };

    const handleRemovePayloadBlock = (weekIndex, dayOfWeek, slot, blockIndex) => {
        updateSessionPayload(weekIndex, dayOfWeek, slot, (payload) => {
            if (payload.blocks.length <= 1) {
                return { blocks: [{ ...DEFAULT_BLOCK }] };
            }
            const blocks = payload.blocks.filter((_, idx) => idx !== blockIndex);
            return {
                blocks: blocks.length
                    ? blocks
                    : [{ ...DEFAULT_BLOCK }],
            };
        });
    };

    const handleAthleteToggle = (athleteId) => {
        setSelectedAthletes((prev) => {
            if (prev.includes(athleteId)) {
                return [];
            }
            return [athleteId];
        });
    };

    const ensureWeekExists = (index) => {
        setWeeks((prev) => {
            if (index < prev.length) return prev;
            const nextWeek = createEmptyWeek(index);
            return [...prev, nextWeek];
        });
    };

    const handleWeekNavigation = async (direction) => {
        const next = Math.max(currentWeekIndex + direction, 0);
        if (next === currentWeekIndex) return;

        // Sauvegarde automatique de la semaine courante pour la conserver
        if (hasSelectedAthlete && !savingWeek) {
            try {
                await handleSaveWeek(currentWeekIndex);
            } catch {
                /* ignore auto-save errors here */
            }
        }

        ensureWeekExists(next);
        setCurrentWeekIndex(next);
    };

    const upsertLibrary = (next) => {
        setSessionLibrary(next);
        try {
            localStorage.setItem(SESSION_LIBRARY_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    };

    const saveCurrentSessionToLibrary = () => {
        if (!modalEntry?.session) return;
        const session = modalEntry.session;
        const focus = session.primary_focus || DEFAULT_SESSION_TYPE;
        if (!["course", "velo", "piscine"].includes(focus)) return;

        const entry = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: session.title || "Séance sans titre",
            payload: sanitizeBlocksForSave(session.payload),
            primary_focus: focus,
            created_at: new Date().toISOString(),
        };

        setSessionLibrary((prev) => {
            const bucket = prev[focus] || [];
            const nextBucket = [entry, ...bucket].slice(0, 50);
            const next = { ...prev, [focus]: nextBucket };
            upsertLibrary(next);
            return next;
        });
    };

    const importLibraryEntry = (entry) => {
        if (!modalSession || !entry) return;
        const { weekIndex, dayOfWeek, slot } = modalSession;
        setWeeks((prev) =>
            prev.map((week) => {
                if (week.week_index !== weekIndex) return week;
                return {
                    ...week,
                    days: week.days.map((day) => {
                        if (day.day_of_week !== dayOfWeek) return day;
                        return {
                            ...day,
                            sessions: day.sessions.map((session) => {
                                if (session.session_slot !== slot) return session;
                                return {
                                    ...session,
                                    title: entry.title,
                                    primary_focus: entry.primary_focus,
                                    payload: normalizeSessionPayload(entry.payload),
                                };
                            }),
                        };
                    }),
                };
            })
        );
    };

    const handleCopyWeek = () => {
        const week = weeks[currentWeekIndex];
        if (!week) return;
        const snapshot = sanitizeWeekClone(week, currentWeekIndex);
        setCopiedWeek({ source: currentWeekIndex, data: snapshot });
    };

    const handlePasteWeek = () => {
        if (!copiedWeek) return;
        const targetIndex = currentWeekIndex;
        const cloned = sanitizeWeekClone(copiedWeek.data, targetIndex);
        setWeeks((prev) =>
            prev.map((week) => (week.week_index === targetIndex ? cloned : week))
        );
    };

    const modalSelectedType = modalEntry?.session?.primary_focus || DEFAULT_SESSION_TYPE;
    const modalBlocks = useMemo(() => {
        if (!modalEntry?.session) return [];
        return normalizeSessionPayload(modalEntry.session.payload).blocks;
    }, [modalEntry]);
    const modalSlotLabel = modalEntry?.session
        ? SESSION_LABELS[modalEntry.session.session_slot] || modalEntry.session.session_slot
        : "";
    const modalDayLabel = modalSession ? DAY_LABELS[modalSession.dayOfWeek] : "";
    const currentWeek = weeks[currentWeekIndex] || null;
    const isFirstWeek = currentWeekIndex <= 0;
    const isLastWeek = currentWeekIndex >= MAX_WEEKS - 1;
    const hasCopy = Boolean(copiedWeek);
    const copyReady = hasCopy && copiedWeek.source === currentWeekIndex;
    const canPasteHere = hasCopy && copiedWeek.source !== currentWeekIndex;

    useEffect(() => {
        setCurrentWeekIndex((prev) => {
            const upperBound = weeks.length === 0 ? 0 : Math.min(weeks.length - 1, MAX_WEEKS - 1);
            return Math.min(Math.max(prev, 0), upperBound);
        });
    }, [weeks.length, MAX_WEEKS]);

    if (loading) {
        return (
            <section className="plan-page">
                <p>Chargement du plan...</p>
            </section>
        );
    }

    return (
        <section className="plan-page">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="plan-meta-card">
                <CardHeader className="plan-meta-header">
                    <CardTitle>Informations générales</CardTitle>
                    <div className="retour-groupe">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Retour aux groupes
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="plan-meta-form">
                    <Input
                        placeholder="Titre du plan"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                    />
                    <Textarea
                        placeholder="Description"
                        value={planDescription}
                        onChange={(e) => setPlanDescription(e.target.value)}
                    />
                    <div className="plan-member-select">
                        <p className="plan-scope-label">
                            Plan affiché :{" "}
                            {planContext.scope === "group"
                                ? "Plan du groupe"
                                : `${activeAthlete?.first_name ?? ""} ${activeAthlete?.last_name ?? ""}`}
                        </p>
                        <p className="plan-member-hint">
                            Sélectionnez un athlète pour personnaliser son plan. Si aucun athlète n'est sélectionné, la sauvegarde est désactivée.
                        </p>
                        <div className="athlete-select-grid">
                            {(group?.members || []).map((member) => {
                                const athleteId = member.athlete_id ?? member.athlete?.id;
                                if (!athleteId) return null;
                                const first = member.athlete?.first_name?.[0] || "";
                                const last = member.athlete?.last_name?.[0] || "";
                                const badge = `${first}${last}`.trim().toUpperCase() || "?";
                                const label = `${member.athlete?.first_name ?? ""} ${
                                    member.athlete?.last_name ?? ""
                                }`.trim() || member.athlete?.email;
                                const checked = selectedAthletes.includes(athleteId);
                                return (
                                    <button
                                        type="button"
                                        key={athleteId}
                                        className={`athlete-pill${checked ? " selected" : ""}`}
                                        title={label}
                                        onClick={() => handleAthleteToggle(athleteId)}
                                    >
                                        <span>{badge}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="athlete-paces-panel">
                <div className="athlete-paces-header">
                    <div>
                        <p className="athlete-paces-title">Allures d'entraînement</p>
                        <p className="athlete-paces-subtitle">{pacePanelSubtitle}</p>
                </div>
            </div>
            {selectedAthletes.length === 0 && (
                <p className="athlete-paces-message">
                    Sélectionnez un athlète pour afficher ses allures mesurées dans son profil.
                </p>
            )}
            {selectedAthletes.length > 0 && (
                <div className="athlete-paces-list">
                    {selectedAthleteEntries.map(({ athleteId, athlete, entry }) => {
                        const fullName =
                            `${athlete?.first_name ?? ""} ${athlete?.last_name ?? ""}`.trim() ||
                            `Athlète #${athleteId}`;
                        const chips = buildPrimaryPaceChips(entry?.data?.paces);
                        const intervals5k = buildIntervalItems(
                            entry?.data?.intervals5k,
                            INTERVALS_5K
                        );
                        const intervals1500 = buildIntervalItems(
                            entry?.data?.intervals1500,
                            INTERVALS_1500
                        );
                        return (
                            <div className="athlete-pace-card" key={athleteId}>
                                <div className="athlete-pace-card-header">
                                    <div>
                                        <p className="athlete-pace-name">{fullName}</p>
                                        {athlete?.email && (
                                            <p className="athlete-pace-meta">{athlete.email}</p>
                                        )}
                                    </div>
                                    {entry?.data?.computedAt && (
                                        <span className="athlete-paces-date small">
                                            {formatComputedAt(entry.data.computedAt)}
                                        </span>
                                    )}
                                </div>
                                {(!entry || entry.status === "loading") && (
                                    <p className="athlete-paces-message">
                                        Chargement des allures...
                                    </p>
                                )}
                                {entry?.status !== "ready" && entry?.message && (
                                    <p className="athlete-paces-message">
                                        {sanitizePaceMessage(entry.message)}
                                    </p>
                                )}
                                {entry?.status === "ready" && (
                                    <>
                                        {chips.length > 0 && (
                                            <div className="pace-chip-grid">
                                                {chips.map((chip) => (
                                                    <div className="pace-chip" key={chip.key}>
                                                        <span className="pace-chip-label">
                                                            {chip.label}
                                                        </span>
                                                        <span className="pace-chip-value">
                                                            {formatSeconds(chip.seconds)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {intervals5k.length > 0 && (
                                            <div className="pace-intervals">
                                                <div className="pace-intervals-title">
                                                    Intervalles 5K
                                                </div>
                                                <div className="pace-intervals-grid">
                                                    {intervals5k.map((item) => (
                                                        <div className="pace-chip small" key={item.key}>
                                                            <span className="pace-chip-label">
                                                                {item.label}
                                                            </span>
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
                                                <div className="pace-intervals-title">
                                                    Intervalles 1500 m
                                                </div>
                                                <div className="pace-intervals-grid">
                                                    {intervals1500.map((item) => (
                                                        <div className="pace-chip small" key={item.key}>
                                                            <span className="pace-chip-label">
                                                                {item.label}
                                                            </span>
                                                            <span className="pace-chip-value">
                                                                {formatSeconds(item.seconds, "")}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

            <div className="plan-week-grid">
            {!hasSelectedAthlete ? (
                <Card className="plan-week-card">
                    <CardContent>
                        <p className="text-muted-foreground">
                            Sélectionnez un athlète pour afficher et modifier son plan.
                        </p>
                    </CardContent>
                </Card>
            ) : !currentWeek ? (
                <Card className="plan-week-card">
                    <CardContent>
                        <p className="text-muted-foreground">Aucune semaine planifiée.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="plan-week-card" key={currentWeek.week_index}>
                    <CardHeader className="plan-week-header">
                        <div className="week-header-top">
                            <div className="week-switcher">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="week-nav-btn"
                                    onClick={() => handleWeekNavigation(-1)}
                                    disabled={isFirstWeek || !hasSelectedAthlete}
                                    aria-label="Semaine précédente"
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                <CardTitle className="date-semaine">
                                    {formatWeekRangeLabel(planStartDate, currentWeek.week_index) ||
                                        `Semaine ${currentWeekIndex + 1}`}
                                </CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="week-nav-btn"
                                    onClick={() => handleWeekNavigation(1)}
                                    disabled={isLastWeek || !hasSelectedAthlete}
                                    aria-label="Semaine suivante"
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                            <div className="plan-week-actions">
                                {canPasteHere ? (
                                    <Button
                                        variant="outline"
                                        onClick={handlePasteWeek}
                                        disabled={!currentWeek}
                                    >
                                        Coller la semaine copiée
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={handleCopyWeek} disabled={!currentWeek}>
                                        Copier cette semaine
                                    </Button>
                                )}
                                <Button
                                    onClick={() => handleSaveWeek(currentWeek.week_index)}
                                    disabled={savingWeek === currentWeek.week_index || !hasSelectedAthlete}
                                    className="save-week-btn"
                                >
                                    {savingWeek === currentWeek.week_index
                                        ? "Sauvegarde..."
                                        : "Sauvegarder la semaine"}
                                </Button>
                            </div>
                        </div>
                        {copyReady && (
                            <p className="copy-week-hint">
                                Semaine copiée – naviguez vers une autre semaine pour la coller.
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="plan-days-grid">
                            {(currentWeek.days || []).map((day) => (
                                <div
                                    className="plan-day-card"
                                    key={`${currentWeek.week_index}-${day.day_of_week}`}
                                >
                                    <h3>{DAY_LABELS[day.day_of_week]}</h3>
                                    <div className="day-session-list">
                                        {(day.sessions || [])
                                            .slice()
                                            .sort((a, b) =>
                                                (a.session_slot === "am" ? 0 : 1) -
                                                (b.session_slot === "am" ? 0 : 1)
                                            )
                                            .map((session) => {
                                                const label =
                                                    SESSION_LABELS[session.session_slot] || session.session_slot;
                                                const selectedType = session.primary_focus || DEFAULT_SESSION_TYPE;
                                                const isCourseSession = selectedType === "course";
                                                const isEnduranceSession = ENDURANCE_TYPES.includes(selectedType);
                                                const isEnduranceDiscipline = isCourseSession || isEnduranceSession;
                                                return (
                                                <div className="session-slot" key={`${session.session_slot}-${day.day_of_week}`}>
                                                    <span className="session-slot-label">{label}</span>
                                                    <div
                                                        className={`session-block${
                                                            session.disabled ? " session-block-disabled" : ""
                                                        }`}
                                                    >
                                                        {session.disabled ? (
                                                            <button
                                                                type="button"
                                                                className="session-add-button"
                                                                onClick={() =>
                                                                    handleToggleSessionSlot(
                                                                        currentWeek.week_index,
                                                                        day.day_of_week,
                                                                        session.session_slot,
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                <Plus size={16} />
                                                                <span>
                                                                    Ajouter la séance du {label.toLowerCase()}
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <div className="session-block-header">
                                                                    <div className="session-type-selector">
                                                                        {SESSION_TYPES.map((type) => {
                                                                            const Icon = type.Icon;
                                                                            return (
                                                                                <button
                                                                                    key={type.value}
                                                                                    type="button"
                                                                                    className={`session-type-option session-type-${type.value}${
                                                                                        selectedType === type.value
                                                                                            ? " active"
                                                                                            : ""
                                                                                    }`}
                                                                                    onClick={() =>
                                                                                        handleSessionChange(
                                                                                            currentWeek.week_index,
                                                                                            day.day_of_week,
                                                                                            session.session_slot,
                                                                                            "primary_focus",
                                                                                            type.value
                                                                                        )
                                                                                    }
                                                                                    aria-label={type.label}
                                                                                    title={type.label}
                                                                                >
                                                                                    <Icon />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="session-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="session-delete-button"
                                                                            onClick={() =>
                                                                                handleToggleSessionSlot(
                                                                                    currentWeek.week_index,
                                                                                    day.day_of_week,
                                                                                    session.session_slot,
                                                                                    true
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const payloadBlocks = normalizeSessionPayload(
                                                                        session.payload
                                                                    ).blocks;
                                                                    const visibleBlocks = payloadBlocks.slice(
                                                                        0,
                                                                        MAX_INLINE_EXERCISES
                                                                    );
                                                                    const showExpandButton =
                                                                        payloadBlocks.length >= MAX_INLINE_EXERCISES;
                                                                    return (
                                                                        <>
                                                                            {session.title && (
                                                                                <div className="session-title-chip">
                                                                                    {session.title}
                                                                                </div>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                className="session-add-block"
                                                                                onClick={() =>
                                                                                    openSessionModal(
                                                                                        currentWeek.week_index,
                                                                                        day.day_of_week,
                                                                                        session.session_slot
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Plus size={14} />
                                                                                Créer / modifier la séance
                                                                            </button>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="plan-summary-layout">
                <Card className="plan-summary-card">
                    <CardHeader className="plan-summary-header">
                        <div>
                            <CardTitle>Répartition des intensités</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Visualisez la charge globale ou par semaine.
                            </p>
                        </div>
                        <div className="plan-summary-filters">
                            <select
                                className="history-select"
                                value={chartFocus}
                                onChange={(e) => setChartFocus(e.target.value)}
                            >
                                <option value="course">Course</option>
                                <option value="other">Natation / Vélo / Musculation</option>
                            </select>
                            {historyOptions.length > 0 && (
                                <select
                                    className="history-select"
                                    value={historyFilter}
                                    onChange={(e) => setHistoryFilter(e.target.value)}
                                >
                                    <option value="all">Toutes les semaines</option>
                                    {historyOptions.map((option) => (
                                        <option value={option.value} key={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="plan-summary-content">
                        {chartStats.data.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {chartFocus === "course"
                                    ? "Aucune distance renseignée dans les séances de course."
                                    : "Aucune séance enregistrée pour ce filtre."}
                            </p>
                        ) : (
                            <div className="plan-chart-wrapper">
                                <p className="text-sm text-muted-foreground">
                                    Total semaine sélectionnée :{" "}
                                    <strong>
                                        {chartStats.mode === "course"
                                            ? `${chartStats.total.toFixed(1)} km`
                                            : `${chartStats.total} séances`}
                                    </strong>
                                </p>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={chartStats.data}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={90}
                                        >
                                            {chartStats.data.map((entry) => (
                                                <Cell
                                                    key={entry.key}
                                                    fill={
                                                        chartStats.mode === "course"
                                                            ? PACE_CATEGORY_COLORS[entry.key] || "#CBD5F5"
                                                            : DISCIPLINE_COLORS[entry.key] || "#CBD5F5"
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <ul className="intensity-breakdown">
                                    {chartStats.data.map((entry) => (
                                        <li key={entry.key}>
                                            <span
                                                className="legend-dot"
                                                style={{
                                                    background:
                                                        chartStats.mode === "course"
                                                            ? PACE_CATEGORY_COLORS[entry.key] || "#CBD5F5"
                                                            : DISCIPLINE_COLORS[entry.key] || "#CBD5F5",
                                                }}
                                            />
                                            <span>{entry.name}</span>
                                            <strong>
                                                {chartStats.mode === "course"
                                                    ? `${entry.value.toFixed(1)} km`
                                                    : `${entry.value} séances`}{" "}
                                                ({entry.percentage ?? 0}%)
                                            </strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="plan-summary-card">
                    <CardHeader className="plan-summary-header">
                        <div>
                            <CardTitle>Charge d’entraînement (RPE)</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Charge = RPE × durée des blocs envoyés par l’athlète.
                            </p>
                        </div>
                        <div className="plan-summary-filters">
                            <select
                                className="history-select"
                                value={loadView}
                                onChange={(e) => setLoadView(e.target.value)}
                            >
                                {TRAINING_LOAD_VIEWS.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="plan-summary-content">
                        {feedbackLoading ? (
                            <p className="text-sm text-muted-foreground">Chargement de la charge...</p>
                        ) : feedbackError ? (
                            <Alert variant="destructive">
                                <AlertDescription>{feedbackError}</AlertDescription>
                            </Alert>
                        ) : visibleLoadData.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune charge calculée pour cette période.</p>
                        ) : (
                            <div className="plan-chart-wrapper">
                                <p className="text-sm text-muted-foreground">
                                    Charge par jour (semaine affichée)
                                </p>
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={visibleLoadData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="load" stroke="#14919B" strokeWidth={2} dot />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
        </div>

            {modalEntry?.session && (
                <div className="session-modal-backdrop">
                    <div className="session-modal">
                        <div className="session-modal-header">
                            <div>
                                <p className="session-modal-subtitle">
                                    {modalDayLabel} · {modalSlotLabel}
                                </p>
                                <h2>{group?.name}</h2>
                            </div>
                            <button className="session-modal-close" onClick={closeSessionModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="session-modal-body">
                            <div className="session-modal-title-field">
                                <label>Titre de la séance</label>
                                <Input
                                    placeholder="Ex: Sortie vallonnée, PPG, Fractionné 10x400..."
                                    value={modalEntry?.session?.title || ""}
                                    className="fond-blanc"
                                    onChange={(e) =>
                                        handleSessionChange(
                                            modalSession.weekIndex,
                                            modalSession.dayOfWeek,
                                            modalSession.slot,
                                            "title",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                            <div className="session-type-selector session-type-selector--modal">
                                {SESSION_TYPES.map((type) => {
                                    const Icon = type.Icon;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            className={`session-type-option session-type-${type.value}${
                                                modalSelectedType === type.value ? " active" : ""
                                            }`}
                                            onClick={() =>
                                                handleSessionChange(
                                                    modalSession.weekIndex,
                                                    modalSession.dayOfWeek,
                                                    modalSession.slot,
                                                    "primary_focus",
                                                    type.value
                                                )
                                            }
                                            aria-label={type.label}
                                            title={type.label}
                                        >
                                            <Icon />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="session-library-actions">
                                <button
                                    type="button"
                                    className="session-add-block"
                                    onClick={saveCurrentSessionToLibrary}
                                >
                                    Enregistrer la séance
                                </button>
                                <button
                                    type="button"
                                    className="session-add-block"
                                    onClick={() => setLibraryPickerOpen(true)}
                                >
                                    Importer une séance
                                </button>
                            </div>
                            <div className="session-modal-structure">
                                {modalBlocks.map((block, idx) => {
                                    const isCourseModal = modalSelectedType === "course";
                                    const isEnduranceModal =
                                        modalSelectedType === "course" || ENDURANCE_TYPES.includes(modalSelectedType);
                                    const metricValue = block.metric === "duration" ? "duration" : "distance";
                                    const blockType = block.type || "target";
                                    return (
                                    <div className="session-modal-row" key={idx}>
                                        <div className="session-modal-column">
                                            <label className="encadré-exercice">
                                                {blockType === "recovery"
                                                    ? "Récupération"
                                                    : blockType === "interval"
                                                        ? "Fractionné"
                                                        : isCourseModal
                                                            ? "Distance (km)"
                                                            : isEnduranceModal
                                                                ? "Distance ou temps"
                                                                : `Exercice ${idx + 1}`}
                                            </label>
                                            {(!isCourseModal && !isEnduranceModal) ? (
                                                <Input
                                                    placeholder="Intitulé de l'exercice"
                                                    value={block.title}
                                                    className="fond-blanc-musculation"
                                                    onChange={(e) =>
                                                        handlePayloadBlockChange(
                                                            modalSession.weekIndex,
                                                            modalSession.dayOfWeek,
                                                            modalSession.slot,
                                                            idx,
                                                            "title",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : blockType === "recovery" ? (
                                                <Input
                                                    placeholder="Durée (mm:ss)"
                                                    className = "session-exercise-title"
                                                    value={block.duration}
                                                    onChange={(e) =>
                                                        handlePayloadBlockChange(
                                                            modalSession.weekIndex,
                                                            modalSession.dayOfWeek,
                                                            modalSession.slot,
                                                            idx,
                                                            "duration",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : blockType === "interval" ? (
                                                <>
                                                    <div className="interval-grid-row interval-grid-row--labels">
                                                        <div className="interval-label">Répétitions</div>
                                                        <select
                                                            className="session-exercise-select"
                                                            value={metricValue}
                                                            onChange={(e) =>
                                                                handlePayloadBlockChange(
                                                                    modalSession.weekIndex,
                                                                    modalSession.dayOfWeek,
                                                                    modalSession.slot,
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
                                                        ) : isCourseModal ? (
                                                            <select
                                                                className="session-exercise-select"
                                                                value={block.pace || ""}
                                                                onChange={(e) =>
                                                                    handleExercisePaceSelect(
                                                                        modalSession.weekIndex,
                                                                        modalSession.dayOfWeek,
                                                                        modalSession.slot,
                                                                        idx,
                                                                        e.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="">Allures calculées</option>
                                                                {PACE_SELECT_GROUPS.map((group) => (
                                                                    <optgroup label={group.label} key={group.label}>
                                                                        {group.options.map((opt) => (
                                                                            <option value={opt.key} key={opt.key}>
                                                                                {opt.label}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="interval-label">Allures</div>
                                                        )}
                                                        <div className="interval-label">Récup / rep</div>
                                                    </div>
                                                    <div className="interval-grid-row interval-grid-row--values">
                                                        <Input
                                                            placeholder="Nombre"
                                                            value={block.reps}
                                                            className="session-exercise-select"
                                                            onChange={(e) =>
                                                                handlePayloadBlockChange(
                                                                    modalSession.weekIndex,
                                                                    modalSession.dayOfWeek,
                                                                    modalSession.slot,
                                                                    idx,
                                                                    "reps",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            placeholder={metricValue === "duration" ? "mm:ss" : "Distance (km)"}
                                                            value={metricValue === "duration" ? block.duration : block.distance}
                                                            className="session-exercise-title "
                                                            onChange={(e) =>
                                                                handlePayloadBlockChange(
                                                                    modalSession.weekIndex,
                                                                    modalSession.dayOfWeek,
                                                                    modalSession.slot,
                                                                    idx,
                                                                    metricValue === "duration" ? "duration" : "distance",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                        {metricValue === "distance" ? (
                                                            <Input
                                                                className="session-pace-value"
                                                                placeholder="mm:ss"
                                                                value={block.passTime || ""}
                                                                onChange={(e) =>
                                                                    handlePayloadBlockChange(
                                                                        modalSession.weekIndex,
                                                                        modalSession.dayOfWeek,
                                                                        modalSession.slot,
                                                                        idx,
                                                                        "passTime",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            <Input
                                                                className="session-pace-value"
                                                                placeholder="Allure (mm:ss)"
                                                                value={
                                                                    isCourseModal
                                                                        ? block.paceValue || getDefaultPaceValue(block.pace)
                                                                        : block.paceValue || ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePayloadBlockChange(
                                                                        modalSession.weekIndex,
                                                                        modalSession.dayOfWeek,
                                                                        modalSession.slot,
                                                                        idx,
                                                                        "paceValue",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                        <Input
                                                            className="session-pace-value"
                                                            placeholder="mm:ss"
                                                            value={block.recovery || ""}
                                                            onChange={(e) =>
                                                                handlePayloadBlockChange(
                                                                    modalSession.weekIndex,
                                                                    modalSession.dayOfWeek,
                                                                    modalSession.slot,
                                                                    idx,
                                                                    "recovery",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </>
                                            ) : isCourseModal ? (
                                                <Input
                                                    className="session-modal-distance"
                                                    placeholder="Distance (km)"
                                                    value={block.distance}
                                                    onChange={(e) =>
                                                        handlePayloadBlockChange(
                                                            modalSession.weekIndex,
                                                            modalSession.dayOfWeek,
                                                            modalSession.slot,
                                                            idx,
                                                            "distance",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <div className="session-distance-mode">
                                                    <select
                                                        className="session-exercise-select"
                                                        value={metricValue}
                                                        onChange={(e) =>
                                                            handlePayloadBlockChange(
                                                                modalSession.weekIndex,
                                                                modalSession.dayOfWeek,
                                                                modalSession.slot,
                                                                idx,
                                                                "metric",
                                                                e.target.value === "duration" ? "duration" : "distance"
                                                            )
                                                        }
                                                    >
                                                        <option value="distance">Distance</option>
                                                        <option value="duration">Temps</option>
                                                    </select>
                                                    <Input
                                                        placeholder={metricValue === "duration" ? "Temps (mm:ss)" : "Distance (km)"}
                                                        value={metricValue === "duration" ? block.duration : block.distance}
                                                        className="fond-blanc"
                                                        onChange={(e) =>
                                                            handlePayloadBlockChange(
                                                                modalSession.weekIndex,
                                                                modalSession.dayOfWeek,
                                                                modalSession.slot,
                                                                idx,
                                                                metricValue === "duration" ? "duration" : "distance",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="session-modal-column">
                                            {blockType === "interval" ? (
                                                <div />
                                            ) : blockType === "recovery" ? (
                                                <div />
                                            ) : (
                                                <>
                                                    <label>
                                                        {(!isCourseModal && !isEnduranceModal)
                                                            ? "Lien photo ou vidéo"
                                                            : "Allure (mm:ss)"}
                                                    </label>
                                                    {(!isCourseModal && !isEnduranceModal) ? (
                                                        <div className="session-media-link">
                                                            <Input
                                                                className="lien-photo-video"
                                                                placeholder="Lien photo ou vidéo"
                                                                value={block.mediaUrl || ""}
                                                                onChange={(e) =>
                                                                    handlePayloadBlockChange(
                                                                        modalSession.weekIndex,
                                                                        modalSession.dayOfWeek,
                                                                        modalSession.slot,
                                                                        idx,
                                                                        "mediaUrl",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            {block.mediaUrl && (
                                                                <a
                                                                    href={block.mediaUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="session-media-anchor"
                                                                >
                                                                    Ouvrir
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : blockType !== "interval" && isCourseModal ? (
                                                        <>
                                                            <select
                                                                className="session-exercise-select interval-pace-select"
                                                                value={block.pace || ""}
                                                                onChange={(e) =>
                                                                    handleExercisePaceSelect(
                                                                        modalSession.weekIndex,
                                                                        modalSession.dayOfWeek,
                                                                        modalSession.slot,
                                                                        idx,
                                                                        e.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="">Allures calculées</option>
                                                                {PACE_SELECT_GROUPS.map((group) => (
                                                                    <optgroup label={group.label} key={group.label}>
                                                                        {group.options.map((opt) => (
                                                                            <option value={opt.key} key={opt.key}>
                                                                                {opt.label}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                ))}
                                                            </select>
                                                            <Input
                                                                className="session-pace-value"
                                                                placeholder="Allure (mm:ss)"
                                                                value={block.paceValue || getDefaultPaceValue(block.pace)}
                                                                onChange={(e) =>
                                                                    handlePayloadBlockChange(
                                                                        modalSession.weekIndex,
                                                                        modalSession.dayOfWeek,
                                                                        modalSession.slot,
                                                                        idx,
                                                                        "paceValue",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </>
                                                    ) : (
                                                        <Input
                                                            className="session-pace-value"
                                                            placeholder="Allure (mm:ss)"
                                                            value={block.paceValue || ""}
                                                            onChange={(e) =>
                                                                handlePayloadBlockChange(
                                                                    modalSession.weekIndex,
                                                                    modalSession.dayOfWeek,
                                                                    modalSession.slot,
                                                                    idx,
                                                                    "paceValue",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="session-modal-delete-block"
                                            onClick={() =>
                                                handleRemovePayloadBlock(
                                                    modalSession.weekIndex,
                                                    modalSession.dayOfWeek,
                                                    modalSession.slot,
                                                    idx
                                                )
                                            }
                                            disabled={modalBlocks.length <= 1}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                    );
                                })}
                                {modalSelectedType === "course" || ENDURANCE_TYPES.includes(modalSelectedType) ? (
                                    <div className="session-exercise-type-actions">
                                        <button
                                            type="button"
                                            className="session-type-chip"
                                            onClick={() =>
                                                handleAddPayloadBlock(
                                                    modalSession.weekIndex,
                                                    modalSession.dayOfWeek,
                                                    modalSession.slot,
                                                    "recovery"
                                                )
                                            }
                                        >
                                            Récupération
                                        </button>
                                        <button
                                            type="button"
                                            className="session-type-chip"
                                            onClick={() =>
                                                handleAddPayloadBlock(
                                                    modalSession.weekIndex,
                                                    modalSession.dayOfWeek,
                                                    modalSession.slot,
                                                    "interval"
                                                )
                                            }
                                        >
                                            Fractionné
                                        </button>
                                        <button
                                            type="button"
                                            className="session-type-chip"
                                            onClick={() =>
                                                handleAddPayloadBlock(
                                                    modalSession.weekIndex,
                                                    modalSession.dayOfWeek,
                                                    modalSession.slot,
                                                    "target"
                                                )
                                            }
                                        >
                                            Exercice ciblé
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="session-modal-add-block"
                                        onClick={() =>
                                            handleAddPayloadBlock(
                                                modalSession.weekIndex,
                                                modalSession.dayOfWeek,
                                                modalSession.slot
                                            )
                                        }
                                    >
                                        <Plus size={14} />
                                        Ajouter un exercice
                                    </button>
                                )}

                                {libraryPickerOpen && (
                                    <div className="library-picker">
                                        <div className="library-picker-header">
                                            <p>Séances enregistrées</p>
                                            <button className="session-modal-close" onClick={() => setLibraryPickerOpen(false)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="library-picker-body">
                                            {["course", "velo", "piscine"].map((key) => {
                                                const list = sessionLibrary[key] || [];
                                                if (!list.length) return null;
                                                return (
                                                    <div className="library-section" key={key}>
                                                        <h4 className="library-title">
                                                            {key === "course" ? "Course à pied" : key === "velo" ? "Vélo" : "Natation"}
                                                        </h4>
                                                        <div className="library-items">
                                                            {list.map((entry) => (
                                                                <div className="library-item" key={entry.id}>
                                                                    <div>
                                                                        <p className="library-item-title">{entry.title}</p>
                                                                        <p className="library-item-meta">
                                                                            {new Date(entry.created_at).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="library-import-btn"
                                                                        onClick={() => {
                                                                            importLibraryEntry(entry);
                                                                            setLibraryPickerOpen(false);
                                                                        }}
                                                                    >
                                                                        Importer
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!sessionLibrary.course.length &&
                                                !sessionLibrary.velo.length &&
                                                !sessionLibrary.piscine.length) && (
                                                <p className="text-sm text-muted-foreground">Aucune séance enregistrée.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
