import assert from "node:assert/strict";
import test from "node:test";
import { resolveBackendUrl, resolveSocketUrl } from "../src/services/backendUrl.js";

test("Local development falls back to localhost", () => {
    assert.equal(resolveBackendUrl(undefined, "http://localhost:5173"), "http://localhost:8080");
    assert.equal(resolveSocketUrl("http://localhost:8080/"), "ws://localhost:8080/ws");
});

test("Explicit environment configuration takes priority and is normalized", () => {
    assert.equal(resolveBackendUrl("https://api.example.test/v1/", "https://app.example.test"), "https://api.example.test/v1");
    assert.equal(resolveSocketUrl("https://api.example.test/v1/"), "wss://api.example.test/v1/ws");
});

test("Relative API paths use the current origin for WebSocket connections", () => {
    assert.equal(resolveSocketUrl("/api", "https://app.example.test"), "wss://app.example.test/api/ws");
});
