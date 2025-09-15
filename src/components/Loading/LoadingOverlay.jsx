// src/components/Loading/LoadingOverlay.jsx
import { useLoadingStore } from "@/hooks/LoadingStore";
import { useNavigation } from "react-router";

export default function LoadingOverlay() {
    const { isLoading } = useLoadingStore();
    const navigation = useNavigation();

    // Affiche le loader uniquement lors des navigations ou des chargements explicites
    const showLoading = navigation.state === "loading" || isLoading;

    if (!showLoading) return null;

    return (
        <div className="fixed inset-0 bg-card flex items-center justify-center z-50">
            <div className="rounded-lg p-6 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
}