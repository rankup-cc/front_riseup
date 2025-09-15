import {Outlet, Navigate} from "react-router";
import {useAuthStore} from "./hooks/AuthStore.jsx";
import {useLoadingStore} from "@/hooks/LoadingStore.jsx";

export default function RequireAuth() {
    const { user } = useAuthStore()
    const { isLoading } = useLoadingStore.getState();
    if (isLoading) return null;
    if (!user) {
        return <Navigate to="/auth/login" replace />
    }

    return <Outlet />
}