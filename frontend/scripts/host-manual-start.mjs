import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
        sessionStorage.setItem("bidverse.auth.user", JSON.stringify({ userId: 1, role: "host", name: "Preview" }));
        sessionStorage.setItem("bidverse.auth.authorization", "Bearer preview-token");
        sessionStorage.setItem("bidverse.auth.expiresAt", new Date(Date.now() + 3600000).toISOString());
    });
    await context.routeWebSocket("**/ws", socket => socket.onMessage(frame => {
        if (String(frame).startsWith("CONNECT")) socket.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
    }));
    let room = { roomId: 5, hostId: 1, title: "Preview room", status: "upcoming", seatLimit: 10, advanceAmount: 1000, startTime: "2026-12-14T12:00:00+05:30" };
    let products = [{ productId: 1, name: "Watch", basePrice: 100, auctionStatus: "waiting" }];
    let starts = 0;
    await context.route("**:8080/**", route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/start")) {
            assert.equal(route.request().method(), "PUT");
            starts++;
            room = { ...room, status: "waiting" };
        }
        const data = path.endsWith("/products") || path.endsWith("/available") ? products : room;
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    await page.goto(`${base}/host/rooms/5`);
    await page.getByRole("button", { name: "Start room", exact: true }).click();
    assert.equal(starts, 0, "Opening confirmation does not start the room");
    await page.getByRole("button", { name: "Cancel start" }).click();
    assert.equal(starts, 0);
    await page.getByRole("button", { name: "Edit collection" }).click();
    assert.ok(await page.getByRole("button", { name: "Start room", exact: true }).isDisabled());
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Start room", exact: true }).click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole("button", { name: "Confirm start" }).click();
    await page.getByRole("status").filter({ hasText: "Buyers have 20 seconds" }).waitFor();
    assert.equal(starts, 1);
    assert.equal(await page.getByRole("button", { name: "Start room", exact: true }).count(), 0);
    room = { ...room, status: "upcoming", hostId: 2 };
    await page.reload();
    await page.getByRole("heading", { name: "Preview room" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Start room", exact: true }).count(), 0);
    room = { ...room, hostId: 1 };
    products = [];
    await page.reload();
    await page.getByRole("heading", { name: "Preview room" }).waitFor();
    assert.ok(await page.getByRole("button", { name: "Start room", exact: true }).isDisabled());
    console.log("PASS: owner-only manual start, confirmation/cancel, collection lock, empty room guard, mobile layout and waiting transition.");
    await context.close();
} finally { await browser.close(); }
