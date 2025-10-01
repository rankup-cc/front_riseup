import { useState, useMemo } from "react";
import "./sportsDashboard.css";

/* -------------------- Données -------------------- */
const EVENTS = {
  "1500m": {
    name: "1500m",
    rank: 1025,
    change: -7,
    icon: "⚡",
    color: "#FFD700",
    bestTime: "00:03:45",
    recentPerformances: [
      { date: "15 sept. 2025", time: "00:03:45", rank: 1025, change: -7 },
      { date: "8 sept. 2025",  time: "00:03:42", rank: 1032, change: +12 },
      { date: "1 sept. 2025",  time: "00:03:48", rank: 1020, change: -5 },
      { date: "25 août 2025",  time: "00:03:44", rank: 1025, change: +8 },
      { date: "18 août 2025",  time: "00:03:50", rank: 1017, change: -3 }
    ],
    rankHistory: [
      { date: "7 juil. 2025", rank: 1100 },
      { date: "21 juil. 2025", rank: 1080 },
      { date: "4 août 2025",   rank: 1050 },
      { date: "18 août 2025",  rank: 1040 },
      { date: "1 sept. 2025",  rank: 1030 },
      { date: "15 sept. 2025", rank: 1025 }
    ]
  },
  "5000m": {
    name: "5000m",
    rank: 698,
    change: +16,
    icon: "🚀",
    color: "#FF8C00",
    bestTime: "00:14:15",
    recentPerformances: [
      { date: "12 sept. 2025", time: "00:14:15", rank: 698, change: +16 },
      { date: "5 sept. 2025",  time: "00:14:22", rank: 682, change: +8 },
      { date: "29 août 2025",  time: "00:14:18", rank: 674, change: +12 },
      { date: "22 août 2025",  time: "00:14:25", rank: 662, change: -4 },
      { date: "15 août 2025",  time: "00:14:20", rank: 666, change: +7 }
    ],
    rankHistory: [
      { date: "7 juil. 2025", rank: 750 },
      { date: "21 juil. 2025", rank: 735 },
      { date: "4 août 2025",   rank: 720 },
      { date: "18 août 2025",  rank: 705 },
      { date: "1 sept. 2025",  rank: 690 },
      { date: "15 sept. 2025", rank: 698 }
    ]
  },
  "10km": {
    name: "10km",
    rank: 877,
    change: +19,
    icon: "⏱️",
    color: "#32CD32",
    bestTime: "00:29:30",
    recentPerformances: [
      { date: "10 sept. 2025", time: "00:29:30", rank: 877, change: +19 },
      { date: "3 sept. 2025",  time: "00:29:45", rank: 858, change: +11 },
      { date: "27 août 2025",  time: "00:29:38", rank: 847, change: +15 },
      { date: "20 août 2025",  time: "00:29:52", rank: 832, change: -6 },
      { date: "13 août 2025",  time: "00:29:41", rank: 838, change: +9 }
    ],
    rankHistory: [
      { date: "7 juil. 2025", rank: 950 },
      { date: "21 juil. 2025", rank: 920 },
      { date: "4 août 2025",   rank: 900 },
      { date: "18 août 2025",  rank: 885 },
      { date: "1 sept. 2025",  rank: 870 },
      { date: "15 sept. 2025", rank: 877 }
    ]
  }
};

/* -------------------- Utils -------------------- */
// "HH:MM:SS" ou "MM:SS" -> secondes
function timeToSeconds(t) {
  const parts = t.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(t) || 0;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Score de régularité (0-100) à partir de la dispersion des temps récents
function regularityScore(recent) {
  const arr = recent.map(r => timeToSeconds(r.time));
  if (arr.length < 2) return 100;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (arr.length - 1);
  const sd = Math.sqrt(variance);
  const cv = sd / mean; // coefficient de variation
  const score = 100 * (1 - clamp(cv, 0, 0.2) / 0.2); // cv=0 => 100, cv>=0.2 => 0
  return Math.round(score);
}

// Transforme le rang en série montante: value = maxRank - rank
function risingSeries(rankHistory) {
  const ranks = rankHistory.map(p => p.rank);
  const maxR = Math.max(...ranks);
  return rankHistory.map((p, i) => ({
    x: i / Math.max(1, rankHistory.length - 1),
    y: maxR - p.rank
  }));
}

/** Courbe lissée monotone (type d3.curveMonotoneX) -> chemin SVG Bézier */
function monotoneBezierPath(points) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M ${points[0][0]} ${points[0][1]}`;

  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);

  // pentes secantes m[i] entre i et i+1
  const m = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    m[i] = dy / (dx || 1e-9);
  }

  // tangentes t[i] (Fritsch–Carlson)
  const t = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0; // cassure/plateau → évite l'overshoot
    } else {
      const w1 = 1 + (xs[i] - xs[i - 1]) / (xs[i + 1] - xs[i]);
      const w2 = 1 + (xs[i + 1] - xs[i]) / (xs[i] - xs[i - 1]);
      t[i] = (w1 + w2) > 0 ? (w1 + w2) / ((w1 / m[i - 1]) + (w2 / m[i])) : 0;
    }
  }

  // clamp des tangentes pour rester monotone (Barry–Goldman)
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    if (dy === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const slope = dy / dx;
    const a = t[i] / slope;
    const b = t[i + 1] / slope;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i]   = tau * a * slope;
      t[i + 1] = tau * b * slope;
    }
  }

  // segments Bézier cubiques
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const x1 = xs[i] + dx / 3;
    const y1 = ys[i] + t[i] * dx / 3;
    const x2 = xs[i + 1] - dx / 3;
    const y2 = ys[i + 1] - t[i + 1] * dx / 3;
    d += ` C ${x1} ${y1}, ${x2} ${y2}, ${xs[i + 1]} ${ys[i + 1]}`;
  }
  return d;
}

function secondsToMMSS(s) {
  const sign = s < 0 ? "-" : "";
  s = Math.abs(Math.round(s));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${sign}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Génère un texte coach motivant, personnalisé avec la régularité et la progression */
function buildCoachText(ev, regScore) {
  const recent = ev.recentPerformances || [];
  const hasComparables = recent.length >= 2;

  // Amélioration chrono récente (sur la fenêtre des recentPerformances)
  let deltaSec = 0;
  if (hasComparables) {
    const oldest = timeToSeconds(recent[recent.length - 1].time);
    const latest = timeToSeconds(recent[0].time);
    deltaSec = oldest - latest; // > 0 => plus rapide
  }

  // Amélioration de rang globale (depuis le 1er point d'historique)
  let deltaRank = 0;
  if (ev.rankHistory?.length >= 2) {
    const firstRank = ev.rankHistory[0].rank;
    const lastRank  = ev.rankHistory[ev.rankHistory.length - 1].rank;
    deltaRank = firstRank - lastRank; // > 0 => mieux classé
  }

  // Cible réaliste : ~2–3s de mieux que la meilleure perf actuelle
  const bestSec = timeToSeconds(ev.bestTime || "00:00");
  const targetSec = Math.max(1, bestSec - 3);
  const target = secondsToMMSS(targetSec);

  // Qualificatif selon la régularité
  let regQualif = "en progrès";
  if (regScore >= 85) regQualif = "exemplaire";
  else if (regScore >= 70) regQualif = "très solide";
  else if (regScore >= 55) regQualif = "en bonne voie";

  const deltaTimeTxt =
    hasComparables && Math.abs(deltaSec) >= 1
      ? `soit ${deltaSec > 0 ? "-" : "+"}${Math.abs(Math.round(deltaSec))} s sur vos chronos récents`
      : "avec une tendance positive";

  const deltaRankTxt =
    deltaRank > 0 ? `et un gain d’environ ${deltaRank} places au classement` : "";

  return (
    <>
      <p>
        Depuis ces six derniers mois, vous avez <strong>nettement progressé</strong> sur le{" "}
        <strong>{ev.name}</strong>. Votre meilleure performance actuelle est de{" "}
        <strong>{ev.bestTime}</strong>, {deltaTimeTxt} {deltaRankTxt}.
      </p>
      <p>
        Votre <strong>score de régularité</strong> est de <strong>{regScore}/100</strong> — une
        régularité <strong>{regQualif}</strong> qui montre que vos habitudes d’entraînement s’installent.
        Gardez ce cap : la constance fait la différence.
      </p>
      <p>
        Objectif atteignable à court terme : viser <strong>{target}</strong>. Pour y arriver,
        continuez à <em>structurer</em> vos séances (endurance confortable, allure spécifique,
        vitesse/technique), <em>récupérer</em> correctement (sommeil, hydratation) et <em>suivre</em> vos sensations.
        Vous avez mis en place les bons réflexes : <strong>bravo</strong>, et
        poursuivez cet élan — chaque sortie compte !
      </p>
    </>
  );
}

/* -------------------- Composant -------------------- */
export default function SportsDashboard() {
  const [selectedEvent, setSelectedEvent] = useState("1500m");
  const ev = EVENTS[selectedEvent];

  // Score de régularité
  const regScore = useMemo(() => regularityScore(ev.recentPerformances), [ev]);

  // Série pour une courbe montante + normalisation [0..1]
  const normSeries = useMemo(() => {
    const series = risingSeries(ev.rankHistory);
    const ys = series.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = Math.max(1e-6, maxY - minY);
    return series.map(p => ({
      x: p.x,                      // 0..1
      y: (p.y - minY) / span       // 0..1 croissant
    }));
  }, [ev]);

  // SVG path lissé + polygon pour l’aire
  const { linePath, areaPoints } = useMemo(() => {
    const pts = normSeries.map(p => [p.x * 100, (1 - p.y) * 100]); // coords SVG (y inversé)
    const path = monotoneBezierPath(pts);
    const poly = `0,100 ${pts.map(([x, y]) => `${x},${y}`).join(" ")} 100,100`;
    return { linePath: path, areaPoints: poly };
  }, [normSeries]);

  // Texte coach (long) dynamique
  const coachText = useMemo(() => buildCoachText(ev, regScore), [ev, regScore]);

  return (
    <div className="lb-container" style={{ "--accent": ev.color }}>
      {/* Tabs */}
      <div className="lb-tabs">
        {Object.entries(EVENTS).map(([key, e]) => {
          const isActive = selectedEvent === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedEvent(key)}
              className={`lb-tabButton ${isActive ? "lb-tabButton--active" : ""}`}
              aria-pressed={isActive}
            >
              <span className="lb-tabIcon">{e.icon}</span>
              {e.name}
            </button>
          );
        })}
      </div>

      {/* Stats (Score de régularité à la place de Classement) */}
      <div className="lb-statsGrid">
        <div>
          <div className="lb-rankRow">{regScore}</div>
          <div className="lb-muted">Score de régularité (0–100)</div>
        </div>
        <div>
          <div className="lb-chip">Amis (235)</div>
          <div className="lb-chipValue">#1</div>
        </div>
        <div>
          <div className="lb-chip">Classement National</div>
          <div className="lb-chipValue">58</div>
        </div>
      </div>

      {/* Graph (plus lisse et croissant) */}
      <div className="lb-chartCard">
        <svg viewBox="0 0 100 100" width="100%" height="260" preserveAspectRatio="none" className="lb-svg">
          {[0, 25, 50, 75, 100].map((g) => (
            <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="#2a2a2a" strokeWidth="0.5" />
          ))}
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Zone sous la courbe */}
          <polygon points={areaPoints} fill="url(#area)" opacity="0.45" />

          {/* Courbe lissée (monotone) */}
          <path
            d={linePath}
            fill="none"
            stroke="#4A9EFF"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Points discrets (optionnels) */}
          {normSeries.map((p, i) => {
            const cx = p.x * 100;
            const cy = (1 - p.y) * 100;
            return <circle key={i} cx={cx} cy={cy} r="1.2" fill="#4A9EFF" opacity="0.85" />;
          })}
        </svg>

        <div className="lb-chartLabels">
          {ev.rankHistory.map((p, i) => (i % 2 === 0 ? <span key={i}>{p.date}</span> : <span key={i} />))}
        </div>
      </div>

      {/* Meilleure performance */}
      <div className="lb-best">
        <div className="lb-muted lb-mb6">Meilleure performance sur la distance</div>
        <div className="lb-bestValue">{ev.bestTime}</div>
      </div>

      {/* Texte motivation/coach (long) */}
      <div className="lb-coachNote">
        {coachText}
      </div>

      {/* Performances récentes */}
      <div className="lb-perfsCard">
        <h4 className="lb-title">Performances récentes</h4>
        {ev.recentPerformances.map((perf, i) => (
          <div
            key={i}
            className={`lb-perfRow ${i < ev.recentPerformances.length - 1 ? "withBorder" : ""}`}
          >
            <div>{perf.date}</div>
            <div className="lb-perfTime">{perf.time}</div>
            <div />
            <div className={`lb-perfChange ${perf.change > 0 ? "pos" : "neg"}`}>
              {perf.change > 0 ? "+" : ""}{perf.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
