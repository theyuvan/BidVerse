import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const expected = {
    buyer: ["bookings", "live", "won"],
    seller: ["listings", "live", "pending", "won"],
    host: ["rooms", "upcoming", "live", "completed"]
};
const colors = {
    bookings: "rgb(20, 96, 219)", listings: "rgb(20, 96, 219)", rooms: "rgb(20, 96, 219)",
    live: "rgb(22, 128, 74)", pending: "rgb(184, 106, 8)", upcoming: "rgb(184, 106, 8)",
    completed: "rgb(112, 80, 198)", won: "rgb(155, 115, 0)"
};
await mkdir(".ui-check", { recursive: true });
try {
    for (const width of [1440, 768, 390]) {
        for (const role of Object.keys(expected)) {
            const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
            await context.addInitScript(role => {
                sessionStorage.setItem("bidverse.auth.user", JSON.stringify({ userId: 1, role, name: "Preview" }));
                sessionStorage.setItem("bidverse.auth.authorization", "Bearer preview-token");
                sessionStorage.setItem("bidverse.auth.expiresAt", new Date(Date.now() + 3600000).toISOString());
            }, role);
            await context.route("**:8080/**", route => route.fulfill({ contentType: "application/json", body: "[]" }));
            await context.routeWebSocket("**/ws", socket => socket.onMessage(frame => {
                if (String(frame).startsWith("CONNECT")) socket.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
            }));
            const page = await context.newPage();
            await page.goto(`${base}/${role === "host" ? "host/dashboard" : role}`);
            const cards = page.locator(".buyer-stat-box,.seller-stat,.overview-card");
            await cards.first().waitFor();
            assert.equal(await cards.count(), expected[role].length);
            assert.deepEqual(await cards.locator(".stat-icon").evaluateAll(icons => icons.map(icon => icon.dataset.icon)), expected[role]);
            for (const card of await cards.all()) {
                const icon = card.locator(".stat-icon");
                const kind = await icon.getAttribute("data-icon");
                const check = async () => assert.equal(await icon.evaluate(element => getComputedStyle(element).color), colors[kind]);
                await check();
                assert.equal(await card.evaluate(element => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
                await card.hover();
                await check();
                assert.equal(await card.evaluate(element => getComputedStyle(element).backgroundColor), "rgb(234, 242, 255)");
                assert.ok(await icon.evaluate(element => {
                    const bounds = element.getBoundingClientRect();
                    const card = element.closest(".buyer-stat-box,.seller-stat,.overview-card").getBoundingClientRect();
                    return bounds.left >= card.left && bounds.right <= card.right && bounds.bottom <= card.bottom;
                }), "Icon stays inside the card");
                await page.mouse.move(0, 0);
            }
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
            const slides = page.locator(".product-slide img");
            assert.equal(await slides.count(), 3);
            const imageSizes = await slides.evaluateAll(async images => {
                await Promise.all(images.map(image => image.decode()));
                return images.map(image => ({ width: image.clientWidth, height: image.clientHeight, fit: getComputedStyle(image).objectFit }));
            });
            assert.ok(imageSizes.every(size => size.width === imageSizes[0].width && size.height === imageSizes[0].height && size.fit === "contain"));
            assert.ok(imageSizes[0].height >= (width > 760 ? 340 : 284));
            await page.getByRole("button", { name: /^Show image 2:/ }).click();
            assert.ok((await page.locator(".product-slide.is-current img").getAttribute("src")).endsWith("technology.png"));
            assert.ok(await page.locator(".product-slide.is-current img").evaluate(image => {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0);
                return context.getImageData(0, 0, 1, 1).data[3] === 0;
            }), "The phone uses real transparency, not a white or checkerboard background");
            await page.screenshot({ path: `.ui-check/${role}-status-icons-${width}.png`, fullPage: true });
            if (width === 1440) {
                await page.getByRole("heading", { level: 1 }).click();
                await page.mouse.move(0, 0);
                await page.emulateMedia({ reducedMotion: "no-preference" });
                await page.waitForFunction(() => document.querySelector(".product-slideshow-stage").dataset.slide === "2", undefined, { timeout: 6000 });
            }
            await context.close();
            console.log(`PASS: ${role} summary icons, image loading, sizing and slider @${width}`);
        }
    }
} finally { await browser.close(); }
