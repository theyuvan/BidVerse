import axios from "axios";
import { getAuthHeader, clearSession } from "./session";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
    const authHeader = getAuthHeader();
    if (authHeader) {
        config.headers.Authorization = authHeader;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearSession();
            if (!window.location.pathname.startsWith("/login") && window.location.pathname !== "/") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export function apiErrorMessage(error, fallback) {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (typeof data === "string") return data;
    return data.message || data.detail || data.error || fallback;
}
