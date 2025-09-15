// src/hooks/LoadingStore.jsx
import { create } from "zustand";

export const useLoadingStore = create((set) => ({
    isLoading: false,
    loadingText: "",
    loadingRequests: 0,

    startLoading: (text = "") => set((state) => ({
        isLoading: true,
        loadingText: text || state.loadingText,
        loadingRequests: state.loadingRequests + 1
    })),

    stopLoading: () => set((state) => {
        const newCount = Math.max(0, state.loadingRequests - 1);
        return {
            loadingRequests: newCount,
            isLoading: newCount > 0,
            // Ne réinitialise le texte que lorsque tous les chargements sont terminés
            loadingText: newCount > 0 ? state.loadingText : ""
        };
    })
}));