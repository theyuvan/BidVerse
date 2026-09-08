const STORAGE_KEY = "bidverse.session";

// The backend uses HTTP Basic auth on every request -- there's no token. We keep the
// raw credentials (only in memory + sessionStorage, cleared on logout/tab close) just
// long enough to build the "Authorization: Basic ..." header on each API call.
export function saveSession({ email, password, userId, name, role }) {
    const session = { email, password, userId, name, role };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
}

export function getSession() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
}

export function getAuthHeader() {
    const session = getSession();
    if (!session) return null;
    const encoded = btoa(`${session.email}:${session.password}`);
    return `Basic ${encoded}`;
}
