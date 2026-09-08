import { createContext, useContext, useMemo, useState } from "react";
import { getSession, clearSession } from "../services/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(() => getSession());

    const value = useMemo(() => ({
        session,
        setSession,
        logout: () => {
            clearSession();
            setSession(null);
        }
    }), [session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
