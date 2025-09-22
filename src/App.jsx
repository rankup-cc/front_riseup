import '@/App.css';
import '@/assets/fontawesome/all.css';
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import Accueil from "@/pages/Accueil.jsx";
import RequireAuth from "@/RequireAuth.jsx";
import GuestRoute from "@/GuestRoute.jsx";
import Login from "@/pages/auth/Login.jsx";
import { useAuthStore } from "@/hooks/AuthStore.jsx";
import { useEffect } from "react";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import RequireAuthVerified from "./RequireAuthVerified.jsx";
import Register from "@/pages/auth/Register.jsx";
import ForgotPassword from "@/pages/auth/ForgotPassword.jsx";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import ResetPassword from "@/pages/auth/ResetPassword.jsx";
import LoadingOverlay from "@/components/Loading/LoadingOverlay.jsx";
import ResendVerification from "@/pages/auth/FormVerifyEmail.jsx";
import RequireEmailNotVerified from "@/RequireEmailNotVerified.jsx";
import Navbar from "@/components/layout/Navbar.jsx";
import Page from "@/pages/dashboard.jsx";

function AppLayout() {
    const fetchUser = useAuthStore((state) => state.fetchUser);
    const isFetchingUser = useAuthStore((state) => state.isFetchingUser);
    const user = useAuthStore((state) => state.user);
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (isFetchingUser) {
        return <LoadingOverlay />;
    }
    if (user) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <Outlet />
            </div>
        )
    } else {
        return <Outlet />;
    }
}

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <AppLayout />,
            children: [
                {
                    element: <GuestRoute />,
                    children: [
                        { path: "auth/register", element: <Register /> },
                        { path: "auth/login", element: <Login /> },
                        { path: "auth/forgot-password", element: <ForgotPassword /> },
                        { path: "auth/reset-password", element: <ResetPassword /> },
                    ],
                },
                {
                    element: <RequireAuth />,
                        children: [
                        ],
                    },
                    {
                        element: <RequireEmailNotVerified />,
                        children: [
                            { path: "auth/email-not-verify", element: <ResendVerification /> },
                        ],
                    },
                    {
                        element: <RequireAuthVerified />,
                        children: [
                            { path: "", element: <Accueil /> },
                            { path: "dashboard", element: <Page /> },
                        ],
                    },
                { path: "auth/verify-email", element: <VerifyEmail /> },
            ],
        },
    ]);

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}