import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/AuthStore.jsx";

export default function CoachPending() {
    const { user, requestCoachVerification } = useAuthStore();
    const [status, setStatus] = useState({ type: null, message: "" });

    async function handleResend() {
        try {
            await requestCoachVerification();
            setStatus({ type: "success", message: "Email de vérification envoyé." });
        } catch (err) {
            setStatus({
                type: "error",
                message: err.response?.data?.message || "Impossible d'envoyer le mail.",
            });
        }
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Vérification coach en attente</CardTitle>
                    <CardDescription>
                        Ton compte coach doit être approuvé avant d'accéder à l'espace dédié.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Nous avons envoyé un email de confirmation à <strong>{user?.email}</strong>.
                        Clique sur le lien “Vérifier mon compte coach” pour finaliser la validation.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Une fois vérifié, tu pourras créer des groupes, ajouter tes athlètes et partager des plans.
                    </p>
                    {status.type && (
                        <Alert variant={status.type === "error" ? "destructive" : "default"}>
                            <AlertDescription>{status.message}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleResend}>Renvoyer l'email</Button>
                        <Button variant="outline" asChild>
                            <a href="/profile">Mettre à jour mes informations</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
