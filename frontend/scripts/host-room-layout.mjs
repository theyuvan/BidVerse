
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const titles = ["Auction 210", "Home Furniture Auction", "Fashion Weekend Auction",
    "An unusually long auction title that should wrap without moving the other cards out of alignment",
    "Phone", "Collector edition", "Weekend auction", "Last room"];
const rooms = titles.map((title, index) => ({
    roomId: index + 1, hostId: 1, title, seatLimit: 30, advanceAmount: 300,
    startTime: "2026-12-09T18:30:00+05:30", status: ["live", "completed", "upcoming"][index % 3]
}));
await mkdir(".ui-check", { recursive: true });
try {
    for (const width of [1920, 1440, 1060, 1024, 768, 700, 390, 320]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
        await context.addInitScript(() => {
            sessionStorage.setItem("bidverse.auth.user", JSON.stringify({ userId: 1, role: "host", name: "Preview host" }));
            sessionStorage.setItem("bidverse.auth.authorization", "Basic cHJldmlldzp0ZXN0");
        });
        await context.route("**:8080/**", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(rooms) }));
        const page = await context.newPage();
        await page.goto(base + "/host/rooms");
        await page.locator(".host-room-tile").nth(7).waitFor();
        assert.equal(await page.getByRole("button", { name: /Start room|Open waiting room/ }).count(), 0);
        const columns = width > 1050 ? 3 : width > 700 ? 2 : 1;
        const measure = () => page.locator(".host-room-grid").evaluate(grid => {
            const rect = element => {
                const box = element.getBoundingClientRect();
                return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right };
            };
            return {
                grid: rect(grid),
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                cards: [...grid.children].map(card => ({
                    ...rect(card), clipped: card.scrollHeight > card.clientHeight + 1,
                    factsY: rect(card.querySelector(".host-room-facts")).y - rect(card).y,
                    actionsY: rect(card.querySelector(".host-room-actions")).y - rect(card).y
                }))
            };
        });
        const layout = await measure();
        assert.equal(layout.overflow, false, width + ": no horizontal overflow");
        assert.ok(Math.abs(layout.cards[0].x - layout.grid.x) < 1);
        assert.ok(Math.abs(layout.cards[columns - 1].right - layout.grid.right) < 1, width + ": first row fills available width");
        for (const [index, card] of layout.cards.entries()) {
            assert.ok(Math.abs(card.width - layout.cards[0].width) < 1);
            assert.equal(card.height, 440);
            assert.equal(card.clipped, false);
            assert.ok(Math.abs(card.x - layout.cards[index % columns].x) < 1, width + ": columns align");
            assert.ok(Math.abs(card.y - layout.cards[Math.floor(index / columns) * columns].y) < 1, width + ": rows align");
            assert.ok(Math.abs(card.actionsY - layout.cards[0].actionsY) < 1, width + ": buttons align");
            assert.ok(Math.abs(card.factsY - layout.cards[0].factsY) < 1, width + ": facts align");
        }

        await page.getByRole("button", { name: "Upcoming", exact: true }).click();
        assert.equal(await page.locator(".host-room-tile").count(), 2);
        const filtered = await measure();
        assert.ok(Math.abs(filtered.cards[0].width - layout.cards[0].width) < 1);
        await page.getByRole("button", { name: "All", exact: true }).click();
        await page.screenshot({ path: ".ui-check/host-organized-" + width + ".png", fullPage: true });
        console.log("PASS: host room alignment @" + width);
        await context.close();
    }
} finally { await browser.close(); }
