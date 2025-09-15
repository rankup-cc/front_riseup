import {Outlet, Navigate} from "react-router";
import {useAuthStore} from "./hooks/AuthStore.jsx";

export default function GuestRoute() {
    const { user } = useAuthStore();

    if (user) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}