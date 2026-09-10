import axios from "axios";
import { backendUrl } from "./backendUrl";
import {
    clearAuthSession,
    getAuthorizationHeader
} from "./authSession";

const api = axios.create({
    baseURL: backendUrl,
});

api.interceptors.request.use((config) => {
    const authorization = getAuthorizationHeader();


    if (authorization && !config.url?.startsWith("/auth/")) {
        config.headers.Authorization = authorization;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || "";

        if (error.response?.status === 401 && !requestUrl.startsWith("/auth/")) {
            const loginPath = window.location.pathname.startsWith("/host/") ? "/host/login" : "/login";
            clearAuthSession();

            if (window.location.pathname !== loginPath) {
                window.location.assign(loginPath);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
