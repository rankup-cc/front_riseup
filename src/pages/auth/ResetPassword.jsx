// Importation des dépendances nécessaires
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react"; // Ajout de useEffect
import { useNavigate, useSearchParams } from "react-router"; // useNavigate vient de react-router-dom

// Importation des composants UI de shadcn/ui
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { AlertCircleIcon, CheckCircle2 } from "lucide-react"; // Ajout de ExclamationTriangleIcon

// Importation des composants personnalisés et du store
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import LoadingBtn from "@/components/Loading/LoadingBtn.jsx";

const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;

const formSchema = z.object({
    password: z.string()
        .min(8, { message: "Le mot de passe doit faire au moins 8 caractères." })
        .refine((value) => /[a-z]/.test(value), {
            message: "Le mot de passe doit contenir au moins une lettre minuscule.",
        })
        .refine((value) => /[A-Z]/.test(value), {
            message: "Le mot de passe doit contenir au moins une lettre majuscule.",
        })
        .refine((value) => /\d/.test(value), {
            message: "Le mot de passe doit contenir au moins un chiffre.",
        })
        .refine((value) => symbolRegex.test(value), {
            message: "Le mot de passe doit contenir au moins un symbole.",
        }),
    password_confirmation: z.string()
}).refine(data => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["password_confirmation"], // Applique le message d'erreur au champ de confirmation
});


export default function ResetPassword() {
    const [isExpired, setIsExpired] = useState(false);

    // États existants
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Hooks pour la navigation et la récupération des paramètres de l'URL
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const checkToken = useAuthStore((state) => state.checkStatusTokenReset);

    // Bonne pratique : Vérifier le token dès le chargement du composant
    useEffect(() => {
        const verifyToken = async () => {
            // 2. On récupère le token et l'email de l'URL
            const token = searchParams.get("token");
            const email = searchParams.get("email");

            if (!token || !email) {
                setIsExpired(true);
                return;
            }

            try {
                await checkToken(token, email);
                setIsExpired(false)
            } catch (error) {
                console.error("La vérification du token a échoué:", error);
                setIsExpired(true);
            }
        };
        verifyToken();
    }, [searchParams, checkToken]);

    // Initialisation du formulaire
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            password_confirmation: "",
        },
    });

    // Fonction de réinitialisation du store
    const resetPassword = useAuthStore((state) => state.resetPassword);

    const onSubmit = async (values) => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token) {
            setIsExpired(true);
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            await resetPassword({
                token: token,
                email: email,
                password: values.password,
                password_confirmation: values.password_confirmation
            });

            setSuccessMessage("Votre mot de passe a été réinitialisé avec succès ! Vous allez être redirigé.");
            form.reset();

            setTimeout(() => {
                navigate("/auth/login");
            }, 3000);

        } catch (error) {
            // MODIFIÉ : Si l'API indique que le token est invalide/expiré, on met à jour l'état.
            if (error.response?.status === 401 || error.response?.data?.message.includes("token")) {
                setIsExpired(true);
            } else {
                setErrorMessage(error.response?.data?.message || "Une erreur s'est produite. Veuillez réessayer.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    const expiredLinkContent = (
        <CardContent>
            <Alert variant="destructive" className="mb-4">
                <AlertTitle>Lien invalide ou expiré</AlertTitle>
                <AlertDescription>
                    Ce lien de réinitialisation n'est plus valide. Veuillez renouveler votre demande.
                </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => navigate('/auth/forgot-password')}>
                Demander un nouveau lien
            </Button>
        </CardContent>
    );

    // Contenu original du formulaire
    const formContent = (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* ... (Champs de formulaire identiques à votre code original) ... */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <FormControl>
                                    <Input type="password" autocomplete="new-password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password_confirmation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmer le mot de passe</FormLabel>
                                <FormControl>
                                    <Input type="password" autocomplete="new-password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertCircleIcon className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert variant="default">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Succès</AlertTitle>
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}
                    <Button className="w-full" type="submit" disabled={isLoading || !!successMessage}>
                        {isLoading && <LoadingBtn />}
                        Réinitialiser le mot de passe
                    </Button>
                </form>
            </Form>
        </CardContent>
    );

    return (
        <div className="grid min-h-[100dvh] place-items-center p-4 lg:py-12 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    {/* Plus besoin de condition ici, on sait que le lien est valide */}
                    <CardTitle>
                        Réinitialiser votre mot de passe
                    </CardTitle>
                    <CardDescription>
                        Saisissez votre nouveau mot de passe ci-dessous.
                    </CardDescription>
                </CardHeader>
                {isExpired ? expiredLinkContent : formContent}
            </Card>
        </div>
    );
}