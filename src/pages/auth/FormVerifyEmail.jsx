// src/pages/auth/ResendVerification.jsx
import {useState} from "react";
import { useAuthStore } from "@/hooks/AuthStore.jsx";

import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingBtn from "@/components/Loading/LoadingBtn";
import { Navigate } from "react-router";
export default function ResendVerification() {
    const { user, resendVerification } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    const handleResend = async () => {
        setIsLoading(true);
        setMessage("");
        setStatus("idle");
        try {
            await resendVerification();
            setStatus("success");
            setMessage("Un nouveau lien de vérification a été envoyé à votre adresse. Vérifiez vos spams.");
        } catch (error) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Erreur lors de l'envoi du lien.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid min-h-[100dvh] place-items-center p-4 lg:py-12 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Vérifiez votre e-mail</CardTitle>
                    <CardDescription>
                        Un lien a été envoyé à <span className="font-semibold">{user?.email || "votre e-mail"}</span>. Cliquez ci-dessous pour renvoyer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert variant={status === "error" ? "destructive" : "default"}>
                            {status === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircleIcon className="h-4 w-4" />}
                            <AlertTitle>{status === "success" ? "Envoyé" : "Erreur"}</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    <Button className="w-full" onClick={handleResend} disabled={isLoading}>
                        {isLoading && <LoadingBtn />}
                        Renvoyer le lien
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
