import { useState } from "react";
import AthletePlanView from "@/components/profile/AthletePlanView.jsx";
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import { Card, CardContent } from "@/components/ui/card";
import "./athlete-plan.css";

export default function AthletePlanPage() {
    const { user } = useAuthStore();
    const [lastContact, setLastContact] = useState(null);
    const forceAccess = user?.email === "riseup.app2025@gmail.com";

    const offers = [
        {
            id: "debutant",
            title: "Débutant",
            price: "10 € / mois",
            visual: "basic",
            badge: "",
            description:
                "1er mois gratuit. Premier RDV pour fixer tes objectifs, connaître tes antécédents sportifs, plan hebdo adapté.",
            bullets: [
                "1er mois offert",
                "Plan hebdomadaire adapté",
                "Premier RDV objectifs + antécédents",
            ],
        },
        {
            id: "initie",
            title: "Initié",
            price: "40 € / mois",
            visual: "initie",
            badge: "Populaire",
            description:
                "1er mois gratuit. RDV mensuel pour ajuster la charge, outils de suivi de charge d’entraînement.",
            bullets: [
                "1er mois offert",
                "RDV mensuel pour adapter la charge",
                "Outils de suivi de charge inclus",
            ],
        },
        {
            id: "expert",
            title: "Expert",
            price: "80 € / mois",
            visual: "expert",
            badge: "Expert",
            description:
                "1er mois gratuit. RDV toutes les 2 semaines, conseils sommeil/alimentation/récup/compétition, accès événements Riseup.",
            bullets: [
                "1er mois offert",
                "RDV toutes les 2 semaines",
                "Conseils sommeil, alimentation, récup, compétition",
                "Accès aux évènements Riseup",
            ],
        },
    ];

    const API_URL =
        import.meta.env.VITE_API_URL ||
        `${(import.meta.env.VITE_BACKEND_URL || "http://backend.react.test:8000").replace(/\/$/, "")}/api`;
    const getCookie = (name) => {
        return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1];
    };

    const handleContact = (offer) => {
        const userName = `${user?.first_name ?? user?.name ?? ""} ${user?.last_name ?? ""}`.trim();
        const email = user?.email ?? "non communiqué";
        const message =
            `Nouvelle demande de RDV pour ${offer.title}\n` +
            `Nom : ${userName}\n` +
            `Email : ${email}\n` +
            "Merci de contacter l'utilisateur pour fixer un rendez-vous.\n";

        const xsrf = getCookie("XSRF-TOKEN");
        fetch(`${API_URL}/coach/contact-request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ offer: offer.title, message }),
        }).catch(() => {});

        setLastContact({ offer });
        alert("Merci ! Tu vas recevoir rapidement un mail pour fixer un rendez-vous d'inscription.");
    };

    if (!user) {
        return null;
    }

    if (!forceAccess && user?.subscription !== "plan" && user?.subscription !== "coach") {
        return (
            <main className="plan-page athlete-plan-page subscription-hero">
                <div className="subscription-hero-overlay">
                    <div className="subscription-hero-content">
                        <p className="hero-kicker">Coaching RiseUp</p>
                        <h1>
                            Améliore tes chronos <span>en sécurité</span>
                        </h1>
                        <p className="subscription-text">
                            1er mois gratuit sur toutes les formules. Choisis ton niveau d’accompagnement et lance-toi.
                        </p>
                    </div>
                </div>

                <Card className="subscription-upsell-card">
                    <CardContent>
                        <div className="subscription-options">
                            {offers.map((offer) => (
                                <article
                                    key={offer.id}
                                    className={`subscription-card ${offer.badge ? "featured" : ""} ${offer.id}`}
                                >
                                    {offer.badge && <span className="subscription-badge">{offer.badge}</span>}
                                    <div className={`subscription-visual ${offer.visual}`} />
                                    <h3>{offer.title}</h3>
                                    <p className="price">{offer.price}</p>
                                    <p className="subscription-text">{offer.description}</p>
                                    <ul>
                                        {offer.bullets.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                    <button
                                        className="subscription-btn"
                                        onClick={() => handleContact(offer)}
                                        type="button"
                                    >
                                        Je m’abonne
                                    </button>
                                </article>
                            ))}
                        </div>

                        {lastContact && (
                            <p className="coach-request-hint">
                                Votre demande pour l’offre {lastContact.offer.title} est en cours. Vous recevrez un mail pour fixer un rendez-vous d'inscription.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="plan-page athlete-plan-page">
            <AthletePlanView userId={user.id} userCreatedAt={user.created_at} />
        </main>
    );
}
