import { useEffect, useState } from "react";
import { getAuthUser } from "../services/authSession";

const cache = new Map();

export default function useLiveResource(key, fetcher) {
    const cacheKey = `${getAuthUser()?.userId}:${key}`;
    const [state, setState] = useState(() => ({ data: cache.get(cacheKey) || [], loading: !cache.has(cacheKey), error: "" }));

    useEffect(() => {
        let stopped = false, inFlight = false, queued = false;
        const controller = new AbortController();
        const refresh = async () => {
            if (stopped || document.visibilityState === "hidden") return;
            if (inFlight) { queued = true; return; }
            inFlight = true;
            try {
                const response = await fetcher(controller.signal);
                if (!stopped) {
                    if (cache.size >= 100) cache.clear();
                    cache.set(cacheKey, response.data);
                    setState({ data: response.data, loading: false, error: "" });
                }
            } catch (error) {
                if (!stopped && error.code !== "ERR_CANCELED") setState(current => ({ ...current, loading: false,
                    error: error.response?.data?.detail || error.response?.data?.message || `Unable to refresh ${key}. Retrying automatically.` }));
            } finally {
                inFlight = false;
                if (queued && !stopped) { queued = false; void refresh(); }
            }
        };
        void refresh();
        const timer = setInterval(refresh, 15000);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        window.addEventListener("bidverse:rooms-changed", refresh);
        return () => {
            stopped = true;
            controller.abort();
            clearInterval(timer);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
            window.removeEventListener("bidverse:rooms-changed", refresh);
        };
    }, [cacheKey, fetcher, key]);
    return state;
}
