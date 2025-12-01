import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.jsx";
import {useAuthStore} from "@/hooks/AuthStore.jsx";
import {useState} from "react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.jsx";
import {AlertCircleIcon} from "lucide-react";
import LoadingBtn from "@/components/Loading/LoadingBtn.jsx";
import {Navigate} from "react-router";
import {Checkbox} from "@/components/ui/checkbox.jsx";
const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
const formSchema = z.object({
    email: z.string().email({
        message: "Veuillez saisir une adresse e-mail valide.",
    }),
    password: z.string()
        .min(8, { message: "Le mot de passe doit faire au moins 8 caractères." })
        .refine((value) => /[a-z]/.test(value), {
            message: "Le mot de passe doit contenir au moins une minuscule.",
        })
        .refine((value) => /[A-Z]/.test(value), {
            message: "Le mot de passe doit contenir au moins une majuscule.",
        })
        .refine((value) => /\d/.test(value), {
            message: "Le mot de passe doit contenir au moins un chiffre.",
        })
        .refine((value) => symbolRegex.test(value), {
            message: "Le mot de passe doit contenir au moins un symbole.",
        }),
    password_confirmation: z.string(),
    isCoach: z.boolean().default(false).optional()
}).refine(data => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["password_confirmation"], // Affiche l'erreur sur le champ de confirmation
});

export default function Register() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            password_confirmation: "",
            isCoach: false,
        },
    });

    const register = useAuthStore((state) => state.register);

    const onSubmit = async (values) => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            await register({
                name: values.name,
                email: values.email,
                password: values.password,
                password_confirmation: values.password_confirmation,
                is_coach: values.isCoach,
                role: values.isCoach ? "coach" : "user",
            })
            setIsLoading(false);
            return <Navigate to="/" replace />;
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Une erreur s'est produite.");
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
            <div className="grid min-h-[100dvh] place-items-center p-4 lg:py-12 lg:px-8">
                <Card className="mx-auto w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Inscription à RiseUP</CardTitle>
                        <CardDescription>Créez votre compte pour accéder à toutes les fonctionnalités de RiseUP.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" autoComplete="email" placeholder="jimmy.gressier@kiprun.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" autoComplete="new-password" placeholder="********" {...field} />
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
                                                <Input type="password" autoComplete="new-password" placeholder="********" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isCoach"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-muted px-3 py-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => field.onChange(checked === true)}
                                                    id="isCoach"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <label htmlFor="isCoach" className="cursor-pointer text-sm font-medium">
                                                    Je suis coach / entraîneur
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    Nous activerons ton espace coach après vérification de ton email.
                                                </p>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {errorMessage && (
                                    <Alert variant="destructive">
                                        <AlertCircleIcon className="h-4 w-4" />
                                        <AlertTitle>Erreur lors de l'inscription</AlertTitle>
                                        <AlertDescription>{errorMessage}</AlertDescription>
                                    </Alert>
                                )}
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading && <LoadingBtn />}
                                    S'inscrire
                                </Button>
                            </form>
                        </Form>
                        <p className="mt-4 text-center text-sm">
                            Déjà inscrit ?{" "}
                            <a href="/auth/login">
                                <Button type="button" variant="link" className="p-0">Connectez-vous</Button>
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="hidden bg-muted lg:block">
                <img
                    src="https://images.unsplash.com/photo-1534185372994-55f9e64235c4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Image de fond représentant le sport"
                    className="h-full w-full object-cover dark:brightness-[0.8]"
                />
            </div>
        </div>
    );
}
