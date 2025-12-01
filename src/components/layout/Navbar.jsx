import * as React from "react";
// Importer useLocation pour connaître l'URL actuelle
import { Link, useLocation } from "react-router-dom";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UserIcon, LogOutIcon, MenuIcon } from "lucide-react";
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import { useState } from "react";
// cn est un utilitaire fourni par shadcn/ui pour combiner des classes Tailwind de manière propre
import { cn } from "@/lib/utils";
import {Button} from "@/components/ui/button.jsx";
import { icon } from "leaflet";

// 1. Centraliser les liens de navigation dans un tableau
const baseNavLinks = [
    { href: "/", label: "Accueil" },
    {
        href: "/trouver",
        label: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-users-group"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
                <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M17 10h2a2 2 0 0 1 2 2v1" />
                <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
            </svg>
        ),
    },
    {
        href: "/classement",
        label: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-trophy"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M8 21l8 0" />
                <path d="M12 17l0 4" />
                <path d="M7 4l10 0" />
                <path d="M17 4v8a5 5 0 0 1 -10 0v-8" />
                <path d="M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                <path d="M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            </svg>
        ),
    },
    {
        href: "/events/chat",
        label: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="icon icon-tabler icons-tabler-filled icon-tabler-message"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18 3a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-4.724l-4.762 2.857a1 1 0 0 1 -1.508 -.743l-.006 -.114v-2h-1a4 4 0 0 1 -3.995 -3.8l-.005 -.2v-8a4 4 0 0 1 4 -4zm-4 9h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m2 -4h-8a1 1 0 1 0 0 2h8a1 1 0 0 0 0 -2" />
            </svg>
        ),
    },
];

export default function Navbar() {
    const { user } = useAuthStore();
    const [avatarFallback, setAvatarFallback] = useState("U");

    // 2. Obtenir le chemin actuel de l'URL
    const { pathname } = useLocation();

    React.useEffect(() => {
        if (user && user.name) {
            setAvatarFallback(user.name.charAt(0).toUpperCase());
        }
    }, [user]);

    const links = React.useMemo(() => {
        const items = [...baseNavLinks];
        const isCoach = user && (user.role === "coach" || user.role === "admin");
        if (user && !isCoach) {
            items.push({ href: "/mon-plan", label: "Mon plan" });
        }
        if (isCoach) {
            const pending = user.role === "coach" && user.coach_status !== "approved";
            items.push({
                href: pending ? "/coach/verification" : "/coach",
                label: pending ? "Statut coach" : "Espace coach",
            });
        }
        return items;
    }, [user]);

    return (
        <nav className="flex w-full items-center justify-between border-b bg-background px-4 py-2 shadow-sm">
            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-4">
                {/* 3. On génère les liens à partir du tableau */}
                {links.map((link) => (
                    <Link
                        key={link.href}
                        to={link.href}
                        // On applique un style différent si le lien est actif
                        className={cn(
                            navigationMenuTriggerStyle(),
                            pathname === link.href
                                ? "bg-accent text-accent-foreground" // Style pour le lien actif
                                : "text-muted-foreground" // Style pour les liens inactifs
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                            <MenuIcon className="h-6 w-6" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {/* On génère aussi les liens mobiles à partir du même tableau */}
                        {links.map((link) => (
                            <DropdownMenuItem key={link.href} asChild>
                                <Link
                                    to={link.href}
                                    // Même logique de style conditionnel ici
                                    className={cn(
                                        "block w-full",
                                        pathname === link.href && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Profile dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="/avatar.jpg" alt="Avatar" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" /> Mon profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a className="flex items-center" onClick={() => useAuthStore.getState().logout()}>
                            <LogOutIcon className="mr-2 h-4 w-4" /> Se déconnecter
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
}

