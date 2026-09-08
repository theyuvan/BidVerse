import axios from "axios";
import {
    clearAuthSession,
    getAuthorizationHeader
} from "./authSession";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
    const authorization = getAuthorizationHeader();

    if (authorization) {
        config.headers.Authorization = authorization;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || "";

        if (error.response?.status === 401 && !requestUrl.startsWith("/auth/")) {
            clearAuthSession();

            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
