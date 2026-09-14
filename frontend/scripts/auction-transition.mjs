import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
        sessionStorage.setItem("bidverse.auth.user", JSON.stringify({ userId: 21, role: "buyer", name: "Preview" }));
        sessionStorage.setItem("bidverse.auth.authorization", "Bearer preview-token");
        sessionStorage.setItem("bidverse.auth.expiresAt", new Date(Date.now() + 3600000).toISOString());
    });
    await context.route("**:8080/**", route => {
        const data = route.request().url().endsWith("/details") ? { roomId: 5, status: "waiting" } : [
            { auctionItemId: 11, productId: 101, productName: "Test watch", basePrice: 100, currentPrice: 100, auctionStatus: "waiting", imageUrl: `${base}/images/showcase-watch.png` }
        ];
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    });
    const waiting = { roomId: 5, roomStatus: "waiting", eventType: "SNAPSHOT", waitingSecondsRemaining: 1 };
    const live = { roomId: 5, roomStatus: "live", eventType: "SNAPSHOT", auctionItemId: 11, productId: 101, productName: "Test watch", itemStatus: "live", secondsRemaining: 15, currentPrice: 100 };
    let snapshots = 0;
    let sendUpdate;
    let receivedBid;
    await context.routeWebSocket("**/ws", ws => {
        const subscriptions = new Map();
        const reply = (subscription, update) => ws.send(`MESSAGE\nsubscription:${subscription}\nmessage-id:${Date.now()}\ndestination:/topic/room/5\n\n${JSON.stringify(update)}\0`);
        ws.onMessage(message => {
            const frame = String(message);
            const header = key => frame.split("\n").find(line => line.startsWith(`${key}:`))?.slice(key.length + 1);
            if (frame.startsWith("CONNECT")) ws.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
            if (frame.startsWith("SUBSCRIBE")) {
                subscriptions.set(header("destination"), header("id"));
                if (header("destination").endsWith("/status")) {
                    snapshots++;
                    reply(header("id"), snapshots === 1 ? waiting : live);
                    sendUpdate = update => reply(subscriptions.get("/topic/room/5"), update);
                }
            }
            if (frame.startsWith("SEND") && header("destination").endsWith("/bid")) receivedBid = JSON.parse(frame.split("\n\n")[1].replaceAll("\0", ""));
        });
    });
    const page = await context.newPage();
    await page.goto(`${base}/buyer/rooms/5/live`);
    await page.getByRole("heading", { name: "You are in the waiting room" }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "No bids this time." }).count(), 0);
    await page.locator(".lot-bid-panel").waitFor({ timeout: 8000 });
    assert.ok(snapshots >= 2, "A missed activation broadcast is recovered when waiting reaches zero");
    sendUpdate({ ...waiting, waitingSecondsRemaining: 20 });
    await page.waitForTimeout(200);
    assert.equal(await page.getByRole("heading", { name: "You are in the waiting room" }).count(), 0, "A delayed waiting snapshot cannot overwrite live bidding");
    assert.ok(Number(await page.locator(".auction-timer strong").textContent()) > 0);
    await page.getByRole("button", { name: "Quick bid +5%", exact: true }).click();
    await page.waitForTimeout(100);
    assert.equal(receivedBid.auctionItemId, 11);
    assert.equal(receivedBid.incrementPercent, 5);
    assert.equal(await page.getByRole("heading", { name: "No bids this time." }).count(), 0);
    console.log("PASS: single-product waiting-to-bidding recovery, stale waiting snapshot ignored, buyer can bid.");
    await context.close();
} finally { await browser.close(); }
