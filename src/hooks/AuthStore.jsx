import { create } from "zustand";
import api, { refreshCsrfToken } from "../services/api";
import { useLoadingStore } from "./LoadingStore";

export const useAuthStore = create((set, get) => ({
    user: null,
    isFetchingUser: true,


    fetchUser: async () => {
        const { startLoading, stopLoading } = useLoadingStore.getState();
        try {
            set({ isFetchingUser: true });
            startLoading();
            const res = await api.get(`/user`);
            set({ user: res.data });
        } catch {
            set({ user: null });
        } finally {
            set({ isFetchingUser: false });
            stopLoading();
        }
    },

    login: async (credentials) => {
        await refreshCsrfToken();
        await api.post(`/auth/login`, credentials);
        await get().fetchUser();
    },

    logout: async () => {
        const { startLoading, stopLoading } = useLoadingStore.getState();
        try {
            startLoading();
            await refreshCsrfToken();
            await api.post(`/auth/logout`);
            set({ user: null });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            stopLoading();
        }
    },

    register: async (data) => {
        await refreshCsrfToken();
        await api.post(`/auth/register`, data);
        await get().fetchUser();
    },

    forgotPassword: async (data) => {
        await refreshCsrfToken();
        await api.post(`/auth/forgot-password`, data);
    },

    checkStatusTokenReset: async (token, email) => {
        const { startLoading, stopLoading } = useLoadingStore.getState();
        try {
            startLoading();
            await api.get(`/auth/check-reset-token?token=${token}&email=${email}`);
        } finally {
            stopLoading();
        }
    },

    resetPassword: async (data) => {
        await refreshCsrfToken();
        await api.post(`/auth/reset-password`, data);
    },

    resendVerification: async () => {
        await refreshCsrfToken();
        await api.post(`/auth/send-verification-email`);
    },

    verifyEmail: async (token, email) => {
        await api.post(`/auth/verify-email`, { token, email });
        try {
            const res = await api.get(`/user`);
            set({ user: res.data });
        } catch {
            set({ user: null });
        }
    }
}));