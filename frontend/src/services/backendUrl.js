export function resolveBackendUrl(configuredUrl) {
    const configured = String(configuredUrl || "").trim().replace(/\/+$/, "");
    return configured || "http://localhost:8080";
}

export function resolveSocketUrl(baseUrl, pageOrigin = "http://localhost:5173") {
    const url = new URL(`${baseUrl.replace(/\/+$/, "")}/ws`, pageOrigin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.href;
}

export const backendUrl = resolveBackendUrl(import.meta.env?.VITE_API_BASE_URL);
export const auctionSocketUrl = resolveSocketUrl(backendUrl, globalThis.location?.origin);
