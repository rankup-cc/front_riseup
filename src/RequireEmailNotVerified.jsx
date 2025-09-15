import {Outlet, Navigate} from "react-router";
import {useAuthStore} from "./hooks/AuthStore.jsx";
import {useLoadingStore} from "@/hooks/LoadingStore.jsx";

export default function RequireEmailNotVerified() {
    const { user } = useAuthStore()
    const { isLoading } = useLoadingStore.getState();
    if (isLoading) return null;
    console.log("user", user);
    if (!user) return <Navigate to="/auth/login" replace />;
    if (user.email_verified_at !== null) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />
}