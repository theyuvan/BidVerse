const AUTH_USER_KEY = "bidverse.auth.user";
const AUTH_HEADER_KEY = "bidverse.auth.authorization";

function createBasicAuthorization(email, password) {
    const credentials = new TextEncoder().encode(`${email}:${password}`);
    const binary = Array.from(credentials, (byte) => String.fromCharCode(byte)).join("");
    return `Basic ${btoa(binary)}`;
}

export function saveAuthSession(user, password) {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(
        AUTH_HEADER_KEY,
        createBasicAuthorization(user.email, password)
    );
}

export function getAuthUser() {
    const storedUser = sessionStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) return null;

    try {
        return JSON.parse(storedUser);
    } catch {
        clearAuthSession();
        return null;
    }
}

export function getAuthorizationHeader() {
    return sessionStorage.getItem(AUTH_HEADER_KEY);
}

export function clearAuthSession() {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_HEADER_KEY);
}
