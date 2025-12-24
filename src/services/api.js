import axios from "axios";

// API_URL doit pointer vers l'API (ex: https://backend-riseup.onrender.com/api)
const API_URL = import.meta.env.VITE_API_URL;
// API_ORIGIN sert pour le cookie CSRF (ex: https://backend-riseup.onrender.com)
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || API_URL?.replace(/\/api\/?$/, "");

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    withXSRFToken: true,
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 419) {
            await refreshCsrfToken();
            return api(error.config);
        }
        return Promise.reject(error);
    }
);

export const refreshCsrfToken = async () => {
    return axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true });
};

export default api;
