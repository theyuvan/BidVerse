import api from "./api";
import { saveSession, clearSession } from "./session";

export async function registerUser({ name, email, phone, password, role }) {
    const response = await api.post("/auth/register", { name, email, phone, password, role });
    return response.data;
}

export async function loginUser({ email, password, role }) {
    const response = await api.post("/auth/login", { email, password, role });
    const account = response.data;
    return saveSession({ email, password, userId: account.userId, name: account.name, role: account.role });
}

export function logout() {
    clearSession();
}
