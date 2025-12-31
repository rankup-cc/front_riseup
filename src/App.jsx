import '@/App.css';
import '@/assets/fontawesome/all.css';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router";
import Accueil from "@/pages/Accueil.jsx";
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
import Trouver from "@/pages/trouver.jsx";
import ClassementPage from "@/pages/classement.jsx";
import AbonnesPage from './pages/abonnes.jsx';
import EventChatPage from "./pages/EventChatPage";
import Profile from './pages/profile.jsx';
import RequireCoach from "@/RequireCoach.jsx";
import CoachLayout from "@/pages/coach/CoachLayout.jsx";
import CoachDashboard from "@/pages/coach/CoachDashboard.jsx";
import CoachGroups from "@/pages/coach/CoachGroups.jsx";
import GroupPlan from "@/pages/coach/GroupPlan.jsx";
import CoachPending from "@/pages/coach/CoachPending.jsx";
import AthletePlanPage from "@/pages/AthletePlanPage.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://backend.riseupmotion.com";

function AppLayout() {
    const fetchUser = useAuthStore((state) => state.fetchUser);
    const isFetchingUser = useAuthStore((state) => state.isFetchingUser);
    const user = useAuthStore((state) => state.user);
    useEffect(() => {
    fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
        method: "GET",
        credentials: "include",
    })
        .then(() => console.log("CSRF cookie initialisé ✅"))
        .catch(err => console.error("Erreur init CSRF:", err));
    }, []);


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
                        { path: "trouver", element: <Trouver /> },
                        { path: "classement", element: <ClassementPage /> },
                        { path: "abonnes", element: <AbonnesPage /> },
                        { path: "events/:id/chat", element: <EventChatPage /> },
                        { path: "events/chat", element: <EventChatPage /> },
                        { path: "events/chat/:id", element: <EventChatPage /> },
                        { path: "profile", element: <Profile /> },
                        { path: "mon-plan", element: <AthletePlanPage /> },
                        { path: "coach/verification", element: <CoachPending /> },
                        {
                            element: <RequireCoach />,
                            children: [
                                {
                                    path: "coach",
                                    element: <CoachLayout />,
                                    children: [
                                        { index: true, element: <CoachDashboard /> },
                                        { path: "groups", element: <CoachGroups /> },
                                        { path: "groups/:groupId/plan", element: <GroupPlan /> },
                                        { path: "plans", element: <Navigate to="/coach/groups" replace /> },
                                    ],
                                },
                            ],
                        },
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
