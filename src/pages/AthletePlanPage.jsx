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
            id: "plan",
            title: "Plan personnalisé",
            price: "10 € / mois",
            visual: "basic",
            description:
                "Un plan recalculé chaque semaine selon vos allures et vos objectifs, accès complet au suivi RiseUp.",
            bullets: [
                "Plan ajusté automatiquement avec vos allures calculées.",
                "Vue calendrier + détail des séances Matin/Soir.",
                "Messagerie de groupe et suivi des classements.",
            ],
        },
        {
            id: "coach",
            title: "Coaching Premium",
            price: "25 € / mois",
            visual: "premium",
            description:
                "Un coach certifié vous suit, planifie une visio hebdomadaire et ajuste vos séances en temps réel.",
            bullets: [
                "Visio hebdo + debrief complet après chaque séance.",
                "Plan modifié en direct selon vos retours.",
                "Support illimité (chat, audio, vidéo) + analyses personnalisées.",
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
            <main className="plan-page athlete-plan-page">
                <Card className="subscription-upsell-card">
                    <CardContent>
                        <h2>Choisissez votre accompagnement</h2>
                        <div className="subscription-options">
                            {offers.map((offer) => (
                                <article key={offer.id}>
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
                                        className={offer.id === "plan" ? "subscription-btn" : "subscription-btn secondary"}
                                        onClick={() =>
                                            offer.id === "plan" ? handleContact(offer) : handleContact(offer)
                                        }
                                        type="button"
                                    >
                                        Contacter
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
