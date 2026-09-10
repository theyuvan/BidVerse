export const tunnelFrontendOrigin = "https://51986cbd-5173.inc1.devtunnels.ms";
export const tunnelBackendOrigin = "https://51986cbd-8080.inc1.devtunnels.ms";

export function resolveBackendUrl(configuredUrl, pageOrigin) {
    const configured = String(configuredUrl || "").trim().replace(/\/+$/, "");
    return configured || (pageOrigin === tunnelFrontendOrigin ? tunnelBackendOrigin : "http://localhost:8080");
}

export function resolveSocketUrl(baseUrl, pageOrigin = "http://localhost:5173") {
    const url = new URL(`${baseUrl.replace(/\/+$/, "")}/ws`, pageOrigin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.href;
}

export const backendUrl = resolveBackendUrl(import.meta.env?.VITE_API_BASE_URL, globalThis.location?.origin);
export const auctionSocketUrl = resolveSocketUrl(backendUrl, globalThis.location?.origin);
