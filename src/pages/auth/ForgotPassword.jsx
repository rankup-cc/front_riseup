// Importation des dépendances nécessaires
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

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
import { AlertCircleIcon, CheckCircle2 } from "lucide-react";

// Importation des composants personnalisés et du store
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import LoadingBtn from "@/components/Loading/LoadingBtn.jsx";

/**
 * Définition du schéma de validation avec Zod.
 * - On s'assure que le champ 'email' est une chaîne de caractères.
 * - On vérifie que l'email est dans un format valide.
 * - Le message d'erreur est personnalisé en français.
 */
const formSchema = z.object({
    email: z.string().email({
        message: "Veuillez saisir une adresse e-mail valide.",
    }),
});

export default function ForgotPassword() {
    // États pour gérer le chargement, les messages d'erreur et de succès
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Initialisation du formulaire avec react-hook-form et le resolver Zod
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    // Récupération de la fonction de demande de réinitialisation depuis le store
    // (Cette fonction devra être implémentée dans votre AuthStore)
    const forgotPassword = useAuthStore((state) => state.forgotPassword);
    const onSubmit = async (values) => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            setSuccessMessage("");
            await forgotPassword({
                email: values.email,
            });

            setSuccessMessage("Si un compte est associé à cet e-mail, un lien de réinitialisation a été envoyé.");
            form.reset();

        } catch (error) {
            // En cas d'erreur, on affiche le message renvoyé par l'API
            setErrorMessage(error.response?.data?.message || "Une erreur s'est produite lors de la demande.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid min-h-[100dvh] place-items-center p-4 lg:py-12 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Mot de passe oublié ?</CardTitle>
                    <CardDescription>
                        Pas de souci. Saisissez votre e-mail et nous vous enverrons un lien pour le réinitialiser.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Champ de formulaire pour l'e-mail */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input autocomplete="email" placeholder="jimmy.gressier@kiprun.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Alerte d'erreur (conditionnelle) */}
                            {errorMessage && (
                                <Alert variant="destructive">
                                    <AlertCircleIcon className="h-4 w-4" />
                                    <AlertTitle>Erreur</AlertTitle>
                                    <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                            )}

                            {/* Alerte de succès (conditionnelle) */}
                            {successMessage && (
                                <Alert variant="default">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>Succès</AlertTitle>
                                    <AlertDescription>{successMessage}</AlertDescription>
                                </Alert>
                            )}

                            {/* Bouton de soumission avec état de chargement */}
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading && <LoadingBtn />}
                                Demander la réinitialisation
                            </Button>
                        </form>
                    </Form>
                    {/* Lien pour retourner à la page de connexion */}
                    <p className="mt-4 text-center text-sm">
                        Vous vous souvenez de votre mot de passe ?{" "}
                        <a href="/auth/login">
                            <Button type="button" variant="link" className="p-0">Connectez-vous</Button>
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}