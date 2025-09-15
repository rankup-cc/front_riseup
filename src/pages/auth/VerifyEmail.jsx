// src/pages/auth/VerifyEmail.jsx
import { useEffect, useState } from "react";
import {Navigate, useNavigate, useSearchParams} from "react-router";
import { useAuthStore } from "@/hooks/AuthStore.jsx";

import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingBtn from "@/components/Loading/LoadingBtn";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyEmail, user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("pending");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get("token");
            const email = searchParams.get("email");

            if (!token || !email) {
                setIsLoading(false);
                setStatus("error");
                setMessage("Token ou e-mail manquant dans l'URL.");
                return;
            }

            try {
                await verifyEmail(token, email);
                setIsLoading(false);
                setStatus("success");
                setMessage("Votre adresse e-mail a été vérifiée avec succès.");

            } catch (error) {
                setIsLoading(false);
                setStatus("error");
                setMessage(error.response?.data?.message || "Erreur lors de la vérification de l'e-mail.");
            }
        };
        verifyToken();
    }, []);


    return (
        <div className="grid min-h-[100dvh] place-items-center p-4 lg:py-12 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>
                        {isLoading ? "Vérification en cours..." :
                            status === "success" ? "Vérification réussie" : "Échec de la vérification"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading && (
                        <div className="flex justify-center items-center py-4">
                            <LoadingBtn />
                        </div>
                    )}
                    {status !== "pending" && (
                        <Alert variant={status === "error" ? "destructive" : "default"}>
                            {status === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircleIcon className="h-4 w-4" />}
                            <AlertTitle>{status === "success" ? "Succès" : "Erreur"}</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    {status === "success" && (
                        user ? (
                            <Button className="w-full" onClick={() => navigate("/", { replace: true })}>
                                Accéder à l'application
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={() => navigate("/auth/login")}>
                                Se connecter
                            </Button>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
