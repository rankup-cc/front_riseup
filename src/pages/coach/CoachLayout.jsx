import { Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./coach.css";

const nav = [
    { href: "/coach", label: "Tableau de bord" },
    { href: "/coach/groups", label: "Groupes & athlètes" },
];

export default function CoachLayout() {
    const { pathname } = useLocation();
    const isPlanPage = pathname.includes("/coach/groups/") && pathname.includes("/plan");

    return (
        <div className={cn("coach-layout", isPlanPage && "coach-layout--wide")}>
            {!isPlanPage && (
                <aside className="coach-sidebar">
                    <p className="espace-coach">Espace coach</p>
                    <nav className="flex flex-col gap-2">
                        {nav.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                            <Button
                                key={item.href}
                                variant={isActive ? "default" : "ghost"}
                                asChild
                                className={cn(
                                    "coach-nav-button",
                                    isActive && "active"
                                )}
                            >
                                <a href={item.href}>{item.label}</a>
                            </Button>
                        );
                        })}
                    </nav>
                </aside>
            )}
            <main className="coach-content space-y-6">
                <Outlet />
            </main>
        </div>
    );
}
