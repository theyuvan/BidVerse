import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
await mkdir(".ui-check", { recursive: true });
try {
    for (const width of [1440, 768, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
        await context.addInitScript(() => {
            sessionStorage.setItem("bidverse.auth.user", JSON.stringify({ userId: 21, role: "buyer", name: "Preview" }));
            sessionStorage.setItem("bidverse.auth.authorization", "Bearer preview-token");
            sessionStorage.setItem("bidverse.auth.expiresAt", new Date(Date.now() + 3600000).toISOString());
        });
        await context.routeWebSocket("**/ws", socket => socket.onMessage(frame => {
            if (String(frame).startsWith("CONNECT")) socket.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
        }));
        let status = "upcoming";
        await context.route("**:8080/**", route => {
            const path = new URL(route.request().url()).pathname;
            const data = path.endsWith("/details") ? { roomId: 64, hostId: 1, title: "Technology auction", seatLimit: 2, advanceAmount: 1000, status, startTime: "2026-12-14T14:08:00+05:30" } : [];
            return route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
        });
        const page = await context.newPage();
        for (status of ["upcoming", "waiting", "live"]) {
            await page.goto(`${base}/buyer/rooms/64`);
            await page.locator(".booking-section").waitFor();
            const styles = await page.evaluate(() => {
                const style = selector => getComputedStyle(document.querySelector(selector));
                return {
                    values: [...document.querySelectorAll(".room-summary span")].map(el => ({ color: getComputedStyle(el).color, size: parseFloat(getComputedStyle(el).fontSize) })),
                    panel: style(".booking-section").backgroundColor,
                    heading: style(".booking-section h2").color,
                    description: style(".booking-section p").color,
                    overflow: document.documentElement.scrollWidth > innerWidth
                };
            });
            assert.equal(styles.values.length, 6);
            assert.ok(styles.values.every(value => value.color === "rgb(23, 43, 69)" && value.size >= 20));
            assert.equal(styles.panel, "rgb(234, 242, 255)");
            assert.equal(styles.heading, "rgb(23, 43, 69)");
            assert.equal(styles.description, "rgb(67, 90, 119)");
            assert.equal(styles.overflow, false);
            await page.screenshot({ path: `.ui-check/room-details-${status}-${width}.png`, fullPage: true });
            if (status === "upcoming") {
                await page.getByRole("button", { name: "Book Room", exact: true }).click();
                await page.getByText("Booking confirmed", { exact: true }).waitFor();
                assert.equal(await page.locator(".booking-toast strong").evaluate(el => getComputedStyle(el).color), "rgb(20, 98, 67)");
            }
            console.log(`PASS: ${status} room details, booking panel and readable values @${width}`);
        }
        await context.close();
    }
} finally { await browser.close(); }
