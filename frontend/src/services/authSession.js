import { backendUrl } from "./backendUrl";

const AUTH_USER_KEY = "bidverse.auth.user";
const AUTH_HEADER_KEY = "bidverse.auth.authorization";
const AUTH_EXPIRY_KEY = "bidverse.auth.expiresAt";

export function saveAuthSession(user) {
    if (!user.accessToken || !user.expiresAt) throw new Error("Restart the updated backend to enable secure login sessions.");
    const { accessToken, expiresAt, ...profile } = user;
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
    sessionStorage.setItem(AUTH_HEADER_KEY, `Bearer ${accessToken}`);
    sessionStorage.setItem(AUTH_EXPIRY_KEY, expiresAt);
}

export function getAuthUser() {
    if (!getAuthorizationHeader()) return null;
    try { return JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null"); }
    catch { clearAuthSession(); return null; }
}

export function getAuthorizationHeader() {
    const header = sessionStorage.getItem(AUTH_HEADER_KEY);
    const expiresAt = Date.parse(sessionStorage.getItem(AUTH_EXPIRY_KEY) || "");
    if (!header?.startsWith("Bearer ") || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        clearAuthSession();
        return null;
    }
    return header;
}

export function clearAuthSession() {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_HEADER_KEY);
    sessionStorage.removeItem(AUTH_EXPIRY_KEY);
}

export function signOut() {
    const authorization = getAuthorizationHeader();
    clearAuthSession();
    if (authorization) fetch(`${backendUrl}/auth/logout`, {
        method: "POST", headers: { Authorization: authorization }, keepalive: true
    }).catch(() => {});
}
