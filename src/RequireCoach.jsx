import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/hooks/AuthStore.jsx";

export default function RequireCoach() {
    const { user } = useAuthStore();

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    const isCoachOrAdmin = user.role === "coach" || user.role === "admin";
    if (!isCoachOrAdmin) {
        return <Navigate to="/" replace />;
    }

    if (user.role === "coach" && user.coach_status !== "approved") {
        return <Navigate to="/coach/verification" replace />;
    }

    return <Outlet />;
}
