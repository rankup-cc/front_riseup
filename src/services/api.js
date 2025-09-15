import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

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
    return axios.get(`${API_URL}/csrf-cookie`, { withCredentials: true });
};

export default api;