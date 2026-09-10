import assert from "node:assert/strict";
import test from "node:test";
import { resolveBackendUrl, resolveSocketUrl, tunnelBackendOrigin, tunnelFrontendOrigin } from "../src/services/backendUrl.js";

test("Local development falls back to localhost", () => {
    assert.equal(resolveBackendUrl(undefined, "http://localhost:5173"), "http://localhost:8080");
    assert.equal(resolveSocketUrl("http://localhost:8080/"), "ws://localhost:8080/ws");
});

test("Forwarded frontend falls back to its HTTPS backend and secure socket", () => {
    const base = resolveBackendUrl("", tunnelFrontendOrigin);
    assert.equal(base, tunnelBackendOrigin);
    assert.equal(resolveSocketUrl(base), "wss://51986cbd-8080.inc1.devtunnels.ms/ws");
});

test("Explicit environment configuration takes priority and is normalized", () => {
    assert.equal(resolveBackendUrl(` ${tunnelBackendOrigin}/ `, "http://localhost:5173"), tunnelBackendOrigin);
    assert.equal(resolveBackendUrl("https://api.example.test/v1/", tunnelFrontendOrigin), "https://api.example.test/v1");
    assert.equal(resolveSocketUrl("https://api.example.test/v1/"), "wss://api.example.test/v1/ws");
});

test("Relative API paths use the current origin for WebSocket connections", () => {
    assert.equal(resolveSocketUrl("/api", tunnelFrontendOrigin), "wss://51986cbd-5173.inc1.devtunnels.ms/api/ws");
});
