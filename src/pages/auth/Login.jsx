import {useAuthStore} from "../../hooks/AuthStore.jsx";
import {useState} from "react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.jsx";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.jsx";
import {Input} from "@/components/ui/input.jsx";
import {Button} from "@/components/ui/button.jsx";
import {Checkbox} from "@/components/ui/checkbox.jsx";
import {AlertCircleIcon} from "lucide-react";
import LoadingBtn from "@/components/Loading/LoadingBtn.jsx";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.jsx";

const formSchema = z.object({
    email: z.string().email({
        message: "Veuillez saisir une adresse e-mail valide.",
    }),
    password: z.string().min(1, {
        message: "Le mot de passe ne peut pas être vide.",
    }),
    remember: z.boolean().default(false).optional(),
});

export default function Login() {
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    });

    const onSubmit = async (values) => {
        setIsLoading(true);
        setErrorMessage("");
        await login({ email: values.email, password: values.password, remember: values.remember })
            .catch((error) => {
                setErrorMessage(error.response?.data?.message || "Une erreur s'est produite.");
            });
        setIsLoading(false);
    };

    return (
        // Conteneur principal qui applique une grille à 2 colonnes sur les grands écrans (lg)
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-white">
            <div
                className="hidden lg:flex items-center justify-center p-6"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 20% 20%, rgba(33,150,156,0.25), transparent 40%), radial-gradient(circle at 80% 30%, rgba(15,111,138,0.25), transparent 35%), radial-gradient(circle at 40% 70%, rgba(25,82,115,0.35), transparent 45%), linear-gradient(135deg, #0b2640, #0f5a6b 50%, #0b2640)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
                aria-label="RiseUp cover"
            >
                <div className="flex items-center gap-6 text-white">
                    <div
                        style={{
                            width: "190px",
                            height: "190px",
                            borderRadius: "50%",
                            backgroundImage: "url('/logoriseup2.jpg')",
                            backgroundSize: "110%",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            outline: "4px solid transparent",
                        }}
                    />
                    <div>
                        <p className="text-5xl font-extrabold leading-tight drop-shadow-md">RiseUp</p>
                        <p className="text-lg opacity-90">Compete, have fun, and improve</p>
                    </div>
                </div>
            </div>

            <div className="grid min-h-[100dvh] place-items-center p-4 lg:py-12 lg:px-8">
                <Card className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Connexion à RiseUP</CardTitle>
                        <CardDescription>Saisissez votre email et votre mot de passe pour vous connecter à votre compte.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Mot de passe</FormLabel>
                                                <a href="/auth/forgot-password">
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="p-0 h-auto text-sm font-normal"
                                                    >
                                                        Mot de passe oublié ?
                                                    </Button>
                                                </a>
                                            </div>
                                            <FormControl>
                                                <Input type="password" placeholder="********" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="remember"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    id="remember"
                                                />
                                            </FormControl>
                                            <label
                                                htmlFor="remember"
                                                className="cursor-pointer text-sm font-medium leading-none"
                                            >
                                                Se souvenir de moi
                                            </label>
                                        </FormItem>
                                    )}
                                />
                                { errorMessage && (
                                    <Alert variant="destructive">
                                        <AlertCircleIcon className="h-4 w-4" />
                                        <AlertTitle>Erreur de connexion</AlertTitle>
                                        <AlertDescription>{errorMessage}</AlertDescription>
                                    </Alert>
                                )}
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading && <LoadingBtn />}
                                    Se connecter
                                </Button>
                            </form>
                        </Form>
                        <p className="mt-4 text-center text-sm">
                            Pas encore de compte ?{" "}
                            <a href="/auth/register">
                                <Button type="button" variant="link" className="p-0">Inscrivez-vous</Button>
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
