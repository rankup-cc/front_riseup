import * as React from "react";
// Importer useLocation pour connaître l'URL actuelle
import { useLocation } from "react-router";
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

// 1. Centraliser les liens de navigation dans un tableau
const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/dashboard", label: "Suivi personnel" },
    { href: "/trouver", label: "Trouver un partenaire" },
    { href: "/classement", label: "Classements" },
    { href: "/events/chat", label: "Vos discussions" },
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

    return (
        <nav className="flex w-full items-center justify-between border-b bg-background px-4 py-2 shadow-sm">
            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-4">
                {/* 3. On génère les liens à partir du tableau */}
                {navLinks.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        // On applique un style différent si le lien est actif
                        className={cn(
                            navigationMenuTriggerStyle(),
                            pathname === link.href
                                ? "bg-accent text-accent-foreground" // Style pour le lien actif
                                : "text-muted-foreground" // Style pour les liens inactifs
                        )}
                    >
                        {link.label}
                    </a>
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
                        {navLinks.map((link) => (
                            <DropdownMenuItem key={link.href} asChild>
                                <a
                                    href={link.href}
                                    // Même logique de style conditionnel ici
                                    className={cn(
                                        "block w-full",
                                        pathname === link.href && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {link.label}
                                </a>
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
                        <a href="/profile" className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" /> Mon profil
                        </a>
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