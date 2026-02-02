import React from "react";
import { Link } from "react-router-dom";
import "./home.css";
import { useAuthStore } from "@/hooks/AuthStore.jsx";

const featureBlocks = [
    {
        title: "Pour les athlètes",
        bullets: [
            "Suivez un cadre clair avec un coach virtuel toujours à jour.",
            "Plan d’entraînement ajusté automatiquement avec vos allures.",
            "Détail des séances, conseils et suivi des performances.",
            "Vue hebdomadaire pour planifier Matin/Soir facilement.",
        ],
    },
    {
        title: "Pour les coachs",
        bullets: [
            "Organisez vos groupes en quelques clics avec un système de pastilles et filtres.",
            "Personnalisez chaque séance (course, technique, musculation) avec fiches + photos.",
            "Suivez les statistiques d’intensité recalculées automatiquement après chaque sauvegarde.",
        ],
    },
    {
        title: "Pour la communauté",
        bullets: [
            "Comparez-vous à l’ensemble des membres grâce au classement multi-disciplines (Demi-fond, Sprint, Lancers, Sauts).",
            "Le classement se calcule automatiquement à partir des rangs enregistrés dans Mon profil.",
            "Participez aux évènements cartographiés et discutez directement sur les fils de discussion intégrés.",
        ],
    },
];

const secondaryFeatures = [
    {
        title: "Classement dynamique",
        text: "Visualisez les meilleurs athlètes de chaque catégorie, filtrez par épreuves (800m, 110m haies, javelot, etc.) et suivez l’évolution de vos points.",
    },
    {
        title: "Suivi d’événements",
        text: "Grâce à la messagerie et aux cartes interactives, organisez des sorties privées ou publiques, partagez les traces et les points de rendez-vous.",
    },
    {
        title: "Messagerie & communauté",
        text: "Chaque groupe dispose d’un chat, et les évènements communautaires favorisent l’entraide et les rencontres entre athlètes.",
    },
    {
        title: "Trouver un partenaire",
        text: "Rejoignez l’onglet « Trouver un partenaire » pour découvrir les événements sportifs créés par les membres autour de chez vous et participer à des sessions adaptées à votre niveau.",
    },
];

const styles = {
    wrapper: {
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "3rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    hero: {
        maxWidth: "1100px",
        width: "100%",
        margin: "0 auto 2.5rem",
        display: "grid",
        gap: "2rem",
        gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
        background: "#213A57",
        color: "#E0F2F1",
        padding: "2.5rem",
        borderRadius: "24px",
        boxShadow: "0 20px 40px rgba(15,23,42,0.35)",
    },
    heroEyebrow: {
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        fontSize: "0.85rem",
        color: "#8ADCC6",
        marginBottom: "0.5rem",
    },
    heroTitle: {
        fontSize: "clamp(1.9rem, 2.4vw + 1rem, 3rem)",
        lineHeight: 1.2,
        marginBottom: "1rem",
        maxWidth: "100%",
    },
    heroText: {
        fontSize: "clamp(0.95rem, 0.4vw + 0.85rem, 1.1rem)",
        lineHeight: 1.6,
        marginBottom: "1.5rem",
        color: "#C7DBE6",
    },
    heroCard: {
        background: "#fff",
        color: "#213A57",
        borderRadius: "20px",
        padding: "1.5rem",
        alignSelf: "center",
        boxShadow: "0 15px 30px rgba(13,23,45,0.15)",
    },
    grid: {
        maxWidth: "1100px",
        margin: "0 auto",
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    },
    card: {
        background: "#fff",
        borderRadius: "18px",
        padding: "1.75rem",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 12px 24px rgba(15,23,42,0.08)",
        color: "#213A57",
    },
    cardTitle: {
        fontSize: "1.4rem",
        color: "#0b2745",
        marginBottom: "0.5rem",
        fontWeight: 700,
    },
    secondary: {
        maxWidth: "1100px",
        margin: "2.5rem auto 0",
        padding: "2rem",
        background: "#213A57",
        borderRadius: "20px",
        color: "#E0F2F1",
    },
    secondaryGrid: {
        marginTop: "1.5rem",
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    },
};

export default function Accueil() {
    const { user } = useAuthStore();
    const isCoach = user && (user.role === "coach" || user.role === "admin");
    const primaryCta = isCoach
        ? { href: "/coach", label: "Accéder à l’espace coach" }
        : { href: "/mon-plan", label: "Trouver un coach" };

    return (
        <div style={styles.wrapper} className="home-wrapper">
            <section style={styles.hero} className="home-hero">
                <div>
                    <p style={styles.heroEyebrow}>RiseUp • Coaching & Performance</p>
                    <h1 style={styles.heroTitle}>
                        Planifiez, trouvez, progressez.
                    </h1>
                    <p style={styles.heroText}>
                        Coach ou athlète, tout est centralisé pour aller droit à l’essentiel.
                    </p>
                    <div className="home-cta">
                        <Link to={primaryCta.href} className="home-btn primary">
                            {primaryCta.label}
                        </Link>
                        <Link to="/classement" className="home-btn ghost">
                            Consulter le classement
                        </Link>
                        <Link to="/trouver" className="home-btn ghost">
                            Trouver un partenaire
                        </Link>
                    </div>
                </div>
            </section>

            <section style={styles.grid}>
                {featureBlocks.map((feature) => (
                    <article key={feature.title} style={styles.card}>
                        <h2 style={styles.cardTitle}>{feature.title}</h2>
                        <p>{feature.description}</p>
                        <ul className="feature-list">
                            {feature.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                            ))}
                        </ul>
                    </article>
                ))}
            </section>

            <section style={styles.secondary}>
                <h2>Fonctionnalités clés</h2>
                <div style={styles.secondaryGrid}>
                    {secondaryFeatures.map((item) => (
                        <article key={item.title}>
                            <h3>{item.title}</h3>
                            <p>{item.text}</p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
