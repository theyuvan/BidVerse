

import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
await mkdir(".ui-check", { recursive: true });
const browser = await chromium.launch({ headless: true });
const room = { roomId: 5, hostId: 1, title: "The Collectors' Edit", seatLimit: 35, advanceAmount: 300, startTime: "2026-12-09T18:30:00+05:30", status: "upcoming" };
const products = [
    { productId: 101, auctionItemId: 11, name: "Vintage leather watch", productName: "Vintage leather watch", sellerName: "Alex Morgan", sellerId: 41, categoryId: 1, categoryName: "Watches", description: "A distinctive mechanical watch with a beautifully detailed dial and leather strap.", basePrice: 15000, currentPrice: 15750, imageUrl: `${base}/images/showcase-watch.png`, status: "pending", productStatus: "pending", auctionStatus: "waiting" },
    { productId: 102, auctionItemId: 12, name: "iPhone 15", productName: "iPhone 15", sellerName: "Alex Morgan", sellerId: 41, categoryId: 2, categoryName: "Electronics", description: "Thoughtful design. Everyday possibility.", basePrice: 45000, currentPrice: 45000, imageUrl: `${base}/images/technology.png`, status: "approved", productStatus: "approved", auctionStatus: "waiting" }
];
const deal = { ...products[0], dealId: 7, roomId: 5, buyerId: 21, buyerName: "Taylor Brooks", sellerEmail: "seller@example.com", buyerEmail: "buyer@example.com", sellerPhone: "9000000000", buyerPhone: "9000000001", finalPrice: 15750, dealStatus: "pending", buyerStatus: "pending", sellerStatus: "confirmed" };
const cases = [
    [null, "/"], [null, "/login"], [null, "/register"], [null, "/host/login"],
    ["buyer", "/buyer"], ["buyer", "/buyer/rooms"], ["buyer", "/buyer/rooms/5"], ["buyer", "/buyer/deals"], ["buyer", "/buyer/deals/7"],
    ["seller", "/seller"], ["seller", "/seller/list-product"], ["seller", "/seller/products"], ["seller", "/seller/deals"], ["seller", "/seller/deals/7"],
    ["host", "/host/dashboard"], ["host", "/host/rooms"], ["host", "/host/rooms/create"], ["host", "/host/rooms/5"], ["host", "/host/products"]
];
const failures = [];
async function createContext(role, viewport) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.routeWebSocket("**/ws", ws => ws.onMessage(message => {
        if (String(message).startsWith("CONNECT")) ws.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
    }));
    await context.addInitScript((role) => {
        if (role) {
            sessionStorage.setItem("bidverse.auth.user", JSON.stringify({ userId: role === "host" ? 1 : 21, name: "Taylor Brooks", role, email: "preview@example.com" }));
            sessionStorage.setItem("bidverse.auth.authorization", "Bearer test-preview-token");
            sessionStorage.setItem("bidverse.auth.expiresAt", new Date(Date.now() + 3600000).toISOString());
        }
    }, role);
    await context.route("**:8080/**", async route => {
        const path = new URL(route.request().url()).pathname;
        let data = [];
        if (path.includes("/categories")) data = [{ categoryId: 1, name: "Watches" }, { categoryId: 2, name: "Electronics" }];
        else if (path.endsWith("/deals/7")) data = deal;
        else if (path.includes("/deals")) data = [deal];
        else if (path.endsWith("/bookings")) data = [{ ...room, roomSeatId: 9, roomTitle: room.title, roomStatus: "upcoming", attendanceStatus: "booked", canJoin: false }];
        else if (path.endsWith("/details") || path === "/host/rooms/5") data = room;
        else if (path === "/host/products/available") data = products.filter(product => product.status === "approved");
        else if (path === "/host/rooms/5/products") data = [{ ...products[0], status: "approved" }];
        else if (path.includes("/products") || path.endsWith("/enter") || path === "/buyer/rooms/5") data = products;
        else if (path.includes("/rooms")) data = [room, { ...room, roomId: 6, title: "Objects of Everyday Wonder" }, { ...room, roomId: 7, title: "A New Perspective" }];
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    });
    return context;
}
try {
    for (const role of ["buyer", "seller", "host"]) {
        const slideshowContext = await createContext(role, { width: 1440, height: 1000 });
        const slideshowPage = await slideshowContext.newPage();
        await slideshowPage.emulateMedia({ reducedMotion: "no-preference" });
        await slideshowPage.goto(`${base}/${role === "host" ? "host/dashboard" : role}`);
        const stage = slideshowPage.locator(".product-slideshow-stage");
        await stage.waitFor();
        assert.equal(await slideshowPage.locator(".product-slide img").count(), 3);
        assert.equal(await slideshowPage.locator(".stat-icon svg").count(), role === "buyer" ? 3 : 4);
        await slideshowPage.waitForFunction(() => document.querySelector(".product-slideshow-stage")?.dataset.slide === "1", undefined, { timeout: 2500 });
        await slideshowPage.waitForFunction(() => document.querySelector(".product-slideshow-stage")?.dataset.slide === "2", undefined, { timeout: 2500 });
        await slideshowPage.waitForFunction(() => document.querySelector(".product-slideshow-stage")?.dataset.slide === "0", undefined, { timeout: 2500 });
        assert.equal(await slideshowPage.getByRole("button", { name: /Pause product slideshow|Play product slideshow/ }).count(), 0);
        await stage.hover();
        const pausedSlide = await stage.getAttribute("data-slide");
        await slideshowPage.waitForTimeout(1700);
        assert.equal(await stage.getAttribute("data-slide"), pausedSlide, "Hover keeps the current image still");
        await slideshowPage.getByRole("button", { name: /^Show image 3:/ }).click();
        assert.equal(await stage.getAttribute("data-slide"), "2");
        await slideshowPage.getByRole("heading", { level: 1 }).click();
        await slideshowPage.waitForFunction(() => document.querySelector(".product-slideshow-stage")?.dataset.slide === "0", undefined, { timeout: 2500 });
        await slideshowPage.emulateMedia({ reducedMotion: "reduce" });
        await slideshowPage.mouse.move(0, 0);
        await slideshowPage.screenshot({ path: `.ui-check/${role}-slideshow-and-icons.png`, fullPage: true });
        assert.ok(await slideshowPage.locator(".brand-logo").first().evaluate(img => img.complete && img.naturalWidth > 0));
        await slideshowContext.close();
    }
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
        for (const [role, path] of cases) {
            const context = await createContext(role, viewport);
            const page = await context.newPage();
            page.on("pageerror", error => failures.push(`${path}: ${error.message}`));
            await page.goto(`${base}${path}`);
            await page.locator("main").waitFor();
            await page.waitForTimeout(250);
            await page.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
            const metrics = await page.evaluate(() => ({
                width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
                background: getComputedStyle(document.querySelector("main")).backgroundColor,
                smallControls: [...document.querySelectorAll("main button, .view-book-button, .app-nav-links a, .nav-account a, .menu-toggle")]
                    .filter(el => el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 16)
                    .map(el => `${el.textContent.trim()}: ${getComputedStyle(el).fontSize}`),
                brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
            }));
            if (metrics.scrollWidth > metrics.width + 1) failures.push(`${path} @${viewport.width}: horizontal overflow ${JSON.stringify(metrics)}`);
            if (metrics.brokenImages.length) failures.push(`${path}: broken images ${metrics.brokenImages}`);
            if (metrics.smallControls.length) failures.push(`${path}: small controls ${metrics.smallControls}`);
            if (["/buyer", "/seller", "/host/dashboard"].includes(path)) {
                const fitted = await page.locator(".product-slide img").evaluateAll(images => images.every(image => {
                    const stage = image.closest(".product-slideshow-stage").getBoundingClientRect();
                    const bounds = image.getBoundingClientRect();
                    return bounds.width <= stage.width + 1 && bounds.height <= stage.height + 1 && getComputedStyle(image).objectFit === "contain";
                }));
                assert.ok(fitted, `${path}: slideshow images fit inside their stage without cropping`);
                const sizes = await page.locator(".product-slide img").evaluateAll(images => images.map(image => ({ width: image.clientWidth, height: image.clientHeight })));
                assert.equal(sizes.length, 3);
                assert.ok(sizes.every(size => size.width === sizes[0].width && size.height === sizes[0].height), `${path}: every product has the same image frame`);
                assert.ok(sizes[0].height >= (viewport.width > 760 ? 340 : 284), `${path}: product frame is enlarged`);
            }
            if (["/buyer", "/seller", "/host/dashboard"].includes(path) && viewport.width === 1440) {
                const card = page.locator("a.room-card, a.seller-action-card, .host-room-tile").first();
                const normalBorder = await card.evaluate(el => getComputedStyle(el).borderTopColor);
                await card.hover();
                assert.notEqual(await card.evaluate(el => getComputedStyle(el).borderTopColor), normalBorder, `${path}: hover must be visible`);
                await page.screenshot({ path: `.ui-check/${role}-card-hover.png`, fullPage: true });
                await page.mouse.move(0, 0);
                const focusTarget = role === "host" ? card.locator(".host-room-title") : card;
                await focusTarget.focus();
                assert.notEqual(await card.evaluate(el => getComputedStyle(el).borderTopColor), normalBorder, `${path}: keyboard focus must be visible`);
                await focusTarget.evaluate(el => el.blur());
            }
            assert.equal(await page.locator("footer").count(), 1);
            if (viewport.width === 1440) {
                const cards = page.locator("main :is(.room-card,.host-room-tile,.host-product-tile,.seller-action-card,.buyer-deal-card,.deal-list-card,.seller-product-card,.won-deal-card,.buyer-stat-box,.seller-stat,.overview-card,.product-summary-card,.category-card,.buyer-product-card,.assigned-product,.host-picker-card,.collection-card)");
                for (const card of await cards.all()) {
                    await card.hover();
                    const lightBackground = await card.evaluate(element => {
                        return getComputedStyle(element).backgroundColor === "rgb(234, 242, 255)";
                    });
                    assert.ok(lightBackground, `${path}: card hover must match the pale-blue showcase background`);
                }
                const won = page.locator(".won-deal-card").first();
                if (await won.count()) {
                    await won.hover();
                    await won.screenshot({ path: ".ui-check/won-product-light-hover.png" });
                }
                await page.mouse.move(0, 0);
            }
            if (["/host/rooms", "/host/products", "/buyer/rooms"].includes(path)) {
                const filters = page.locator("button[data-status]");
                assert.ok(await filters.count() >= 3);
                const styles = await filters.evaluateAll(buttons => buttons.map(button => ({
                    selected: button.getAttribute("aria-pressed") === "true" || button.classList.contains("active"),
                    color: getComputedStyle(button).color, background: getComputedStyle(button).backgroundColor
                })));
                assert.ok(styles.every(style => style.selected
                    ? style.background === "rgb(20, 96, 219)" && style.color === "rgb(255, 255, 255)"
                    : style.color === "rgb(20, 87, 191)"), "Filters use blue only, with white text on the selected filter");
                if (path === "/host/products") {
                    for (const filter of await filters.all()) {
                        await filter.hover();
                        await filter.click();
                        await page.waitForTimeout(220);
                        assert.equal(await filter.evaluate(button => getComputedStyle(button).backgroundColor), "rgb(20, 96, 219)", "Every host product filter stays blue when selected and hovered");
                    }
                    await page.getByRole("button", { name: "All", exact: true }).click();
                    await page.mouse.move(0, 0);
                }
            }
            const frames = await page.locator(".host-product-photo, .buyer-deal-product-image, .seller-product-image").evaluateAll(elements => elements.map(el => ({ background: getComputedStyle(el).backgroundColor, padding: getComputedStyle(el).padding })));
            assert.ok(frames.every(frame => frame.background === "rgba(0, 0, 0, 0)" && frame.padding === "0px"), "Product frames are transparent without white padding");
            if (path === "/host/rooms") {
                const sizes = await page.locator(".host-room-tile").evaluateAll(cards => cards.map(card => ({
                    width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height,
                    overflow: card.scrollHeight > card.clientHeight + 1
                })));
                assert.ok(sizes.every(size => Math.abs(size.width - sizes[0].width) < 1 && size.height === 440 && !size.overflow), "Room cards have equal widths and fixed heights without clipping");
                assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth), "none");
                await page.mouse.wheel(0, 500);
                await page.waitForTimeout(100);
                assert.ok(await page.evaluate(() => scrollY > 0), "Hidden scrollbar must still allow scrolling");
            }
            if (path === "/seller/list-product") {
                assert.ok(await page.locator('input[name="name"]').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 17));
                assert.ok(await page.locator(".seller-form label > span").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16));
            }
            if (!role) assert.equal(await page.locator('a[href="/host/login"]').count(), 0, "Public pages must not advertise host login");
            if (path === "/login") assert.deepEqual(await page.locator("select option").allTextContents(), ["Buyer", "Seller"]);
            if (path === "/host/login") {
                assert.equal(await page.locator("form input").count(), 2);
                assert.equal(await page.locator("form select").count(), 0);
                assert.equal(await page.getByLabel("Host email").count(), 1);
                assert.equal(await page.getByLabel("Host password").count(), 1);
            }
            if (role && viewport.width === 390) {
                await page.getByRole("button", { name: "Menu" }).click();
                assert.ok(await page.getByRole("navigation", { name: "Main navigation" }).isVisible());
                assert.equal(await page.locator(".app-nav-links a").first().evaluate(el => getComputedStyle(el).textDecorationLine), "none");
                await page.getByRole("button", { name: "Menu" }).click();
            }
            await page.screenshot({ path: `.ui-check/${path.replaceAll("/", "_") || "home"}-${viewport.width}.png`, fullPage: true });
            console.log(`Checked ${path} @${viewport.width}`);
            await context.close();
        }
    }
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
        const sellerContext = await createContext("seller", viewport);
        let history = [...products, { ...products[0], productId: 103, name: "Rejected preview product", productStatus: "Rejected" }];
        await sellerContext.route("**:8080/seller/products/history?*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(history) }));
        const sellerPage = await sellerContext.newPage();
        await sellerPage.goto(`${base}/seller/products`);
        await sellerPage.locator(".seller-product-card").first().waitFor();
        assert.deepEqual(await sellerPage.locator(".product-filters button").allTextContents(), ["All", "Pending", "Approved", "Rejected"]);
        assert.equal(await sellerPage.getByRole("button", { name: "All", exact: true }).getAttribute("aria-pressed"), "true");
        assert.equal(await sellerPage.locator(".seller-product-card").count(), 3);
        assert.equal(await sellerPage.locator(".seller-product-card .product-id").count(), 0, "Seller cards do not show product IDs");
        const filterStyles = await sellerPage.locator(".product-filters button").evaluateAll(buttons => buttons.map(button => ({ background: getComputedStyle(button).backgroundColor, color: getComputedStyle(button).color })));
        assert.equal(new Set(filterStyles.slice(1).map(style => style.background)).size, 1, "Inactive seller filters use one neutral background");
        assert.equal(new Set(filterStyles.slice(1).map(style => style.color)).size, 1, "Inactive seller filters use one neutral text color");
        assert.notEqual(filterStyles[0].background, filterStyles[1].background);
        for (const [label, productName] of [["Approved", products[1].name], ["Rejected", "Rejected preview product"], ["Pending", products[0].name]]) {
            await sellerPage.getByRole("button", { name: label, exact: true }).click();
            assert.equal(await sellerPage.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), "true");
            assert.equal(await sellerPage.getByRole("button", { name: label, exact: true }).evaluate(button => getComputedStyle(button).backgroundColor), "rgb(20, 96, 219)", "Every selected seller filter uses the same blue accent");
            assert.deepEqual(await sellerPage.locator(".seller-product-card h2").allTextContents(), [productName]);
        }
        await sellerPage.getByRole("button", { name: "All", exact: true }).click();
        assert.equal(await sellerPage.locator(".seller-product-card").count(), 3);
        const photos = await sellerPage.locator(".seller-product-image img").evaluateAll(images => images.map(img => {
            const frame = img.closest(".seller-product-image").getBoundingClientRect();
            const bounds = img.getBoundingClientRect();
            return { height: frame.height, fits: bounds.width <= frame.width && bounds.height <= frame.height, fit: getComputedStyle(img).objectFit };
        }));
        assert.ok(photos.every(photo => photo.height >= 240 && photo.fits && photo.fit === "contain"), "Product images remain uncropped on desktop and mobile");
        assert.ok(await sellerPage.locator(".seller-product-card").evaluateAll(cards => cards.every(card => card.getBoundingClientRect().height < 680)), "Product cards stay compact");
        const description = sellerPage.locator(".seller-product-description").first();
        assert.equal(await description.getAttribute("open"), null);
        await description.locator("summary").click();
        assert.ok(await description.locator("p").isVisible(), "Full descriptions can still be read");
        await description.locator("summary").click();
        assert.ok(await sellerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await sellerPage.screenshot({ path: `.ui-check/seller-product-filters-${viewport.width}.png`, fullPage: true });
        history = [products[1]];
        await sellerPage.reload();
        await sellerPage.locator(".seller-product-card").waitFor();
        await sellerPage.getByRole("button", { name: "Rejected", exact: true }).click();
        await sellerPage.getByText("No rejected products yet.", { exact: true }).waitFor();
        assert.equal(await sellerPage.locator(".seller-product-card").count(), 0);
        await sellerPage.getByRole("button", { name: "Approved", exact: true }).click();
        assert.equal(await sellerPage.locator(".seller-product-card").count(), 1);
        await sellerContext.close();
    }
    const context = await createContext("buyer", { width: 1440, height: 1000 });
    await context.route("**:8080/buyer/rooms/5/details", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...room, status: "live" }) }));
    const page = await context.newPage();
    let sendUpdate;
    let nextPayload;
    const bidPayloads = [];
    await page.routeWebSocket("**/ws", ws => {
        const subscriptions = new Map();
        ws.onMessage(message => {
            const frame = String(message);
            const lines = frame.split("\n");
            const header = key => lines.find(line => line.startsWith(`${key}:`))?.slice(key.length + 1);
            if (frame.startsWith("CONNECT")) ws.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
            if (frame.startsWith("SUBSCRIBE")) {
                subscriptions.set(header("destination"), header("id"));
                if (header("destination").endsWith("/status")) {
                    sendUpdate = update => ws.send(`MESSAGE\nsubscription:${subscriptions.get("/topic/room/5")}\nmessage-id:${Date.now()}\ndestination:/topic/room/5\n\n${JSON.stringify(update)}\0`);
                }
            }
            if (frame.startsWith("SEND") && header("destination") === "/app/room/5/next") {
                nextPayload = JSON.parse(frame.split("\n\n")[1].replaceAll("\0", ""));
            }
            if (frame.startsWith("SEND") && header("destination") === "/app/room/5/bid") {
                bidPayloads.push(JSON.parse(frame.split("\n\n")[1].replaceAll("\0", "")));
            }
        });
    });
    await page.goto(`${base}/buyer/rooms/5/live`);
    for (let i = 0; i < 30 && !sendUpdate; i++) await page.waitForTimeout(100);
    assert.ok(sendUpdate, "Auction socket connected");
    const live = { roomId: 5, auctionItemId: 11, productName: products[0].name, currentPrice: 15750, roomStatus: "live", itemStatus: "live", eventType: "BID_UPDATE", highestBidderId: 22, secondsRemaining: 15 };
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        sendUpdate(live);
        await page.locator(".quick-bid").first().waitFor();
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(100);
        const layout = await page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
            return { image: rect(".lot-visual"), panel: rect(".lot-bid-panel"), timer: rect(".auction-timer"), manual: rect(".manual-bid"), width: document.documentElement.scrollWidth };
        });
        assert.ok(layout.width <= viewport.width, "Live auction does not overflow horizontally");
        assert.ok(layout.timer.bottom <= viewport.height && layout.manual.bottom <= viewport.height, `Timer and all bid controls visible at ${viewport.width}: ${JSON.stringify(layout)}`);
        assert.ok(viewport.width > 760 ? layout.image.right <= layout.panel.x : layout.panel.bottom <= layout.image.y, "Desktop image is left; mobile bidding controls come first");
        const photo = await page.locator(".lot-visual .host-product-photo img").evaluate(img => {
            const frame = img.parentElement.getBoundingClientRect(), bounds = img.getBoundingClientRect();
            return { fits: bounds.height <= frame.height && bounds.width <= frame.width, fit: getComputedStyle(img).objectFit, padding: getComputedStyle(img).padding };
        });
        assert.ok(photo.fits && photo.fit === "contain" && photo.padding === "0px", "Full product photo fits without cropping or artificial padding");
        assert.ok(await page.locator(".auction-products article img").evaluateAll(images => images.every(img => getComputedStyle(img).backgroundColor === "rgba(0, 0, 0, 0)")), "Auction thumbnails have transparent backgrounds");
        await page.screenshot({ path: `.ui-check/auction-live-${viewport.width}.png`, fullPage: true });
    }
    for (const percent of [2, 5, 10]) {
        await page.getByRole("button", { name: `Quick bid +${percent}%`, exact: true }).click();
    }
    await page.waitForTimeout(100);
    assert.deepEqual(bidPayloads.map(payload => payload.incrementPercent), [2, 5, 10]);
    assert.ok(bidPayloads.every(payload => payload.auctionItemId === 11 && payload.buyerId === 21 && payload.mode === "AUTO"));
    await page.locator("#manual-amount").fill("17000");
    await page.waitForTimeout(1100);
    assert.equal(await page.locator("#manual-amount").inputValue(), "17000", "Countdown preserves manual input");
    await page.getByRole("button", { name: "Place bid", exact: true }).click();
    await page.waitForTimeout(100);
    assert.equal(bidPayloads.at(-1).amount, 17000);
    assert.equal(bidPayloads.at(-1).mode, "MANUAL");
    sendUpdate({ ...live, secondsRemaining: 0 });
    await page.waitForTimeout(100);
    for (const button of await page.locator(".bid-actions button").all()) assert.ok(await button.isDisabled(), "Bids disabled after deadline");
    await page.setViewportSize({ width: 1440, height: 1000 });
    const result = { roomId: 5, auctionItemId: 11, productName: products[0].name, currentPrice: 15750, roomStatus: "live", itemStatus: "sold", eventType: "ITEM_RESOLVED", highestBidderId: 21, winningBuyerName: "Taylor Brooks", nextProductId: 102, nextProductName: products[1].name, participantCount: 2, readyBuyerIds: [], intermissionEndsAt: new Date(Date.now() + 15000).toISOString() };
    sendUpdate(result);
    await page.getByRole("heading", { name: "This one is yours." }).waitFor();
    await page.getByRole("button", { name: "Next product" }).click();
    await page.waitForTimeout(100);
    assert.deepEqual(nextPayload, { auctionItemId: 11 });
    sendUpdate({ ...result, readyBuyerIds: [21] });
    const ready = page.getByRole("button", { name: "Ready · waiting for others" });
    await ready.waitFor();
    assert.ok(await ready.isDisabled());
    await page.screenshot({ path: ".ui-check/auction-sold.png", fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 450));
    const before = await page.evaluate(() => scrollY);
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => scrollY), before, "Countdown must not reset scroll");
    sendUpdate({ ...result, auctionItemId: 12, productName: products[1].name, itemStatus: "unsold", highestBidderId: null, nextProductId: null, nextProductName: null, intermissionEndsAt: new Date(Date.now() + 20000).toISOString() });
    await page.getByRole("heading", { name: "No bids this time." }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: ".ui-check/auction-unsold-mobile.png", fullPage: true });
    sendUpdate({ roomId: 5, roomStatus: "completed", eventType: "ROOM_COMPLETED" });
    await page.getByRole("heading", { name: "Auction completed" }).waitFor();
    await context.close();
    const refreshContext = await createContext("buyer", { width: 1440, height: 1000 });
    const refreshPage = await refreshContext.newPage();
    let roomNotification;
    let catalogue = [room];
    await refreshPage.routeWebSocket("**/ws", socket => socket.onMessage(message => {
        const frame = String(message);
        if (frame.startsWith("CONNECT")) socket.send("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
        if (frame.startsWith("SUBSCRIBE") && frame.includes("destination:/topic/rooms")) {
            const id = frame.match(/\nid:([^\n]+)/)[1];
            roomNotification = () => socket.send(`MESSAGE\nsubscription:${id}\nmessage-id:catalogue-1\ndestination:/topic/rooms\n\n${JSON.stringify({ eventType: "ROOMS_CHANGED" })}\0`);
        }
    }));
    await refreshContext.route("**:8080/buyer/rooms/available", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(catalogue) }));
    await refreshContext.route("**:8080/buyer/deals/mine", async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.fulfill({ contentType: "application/json", body: "[]" });
    });
    await refreshPage.goto(`${base}/buyer`);
    await refreshPage.getByRole("heading", { name: room.title, exact: true }).waitFor({ timeout: 2000 });
    assert.ok(await refreshPage.getByText("Loading won products...", { exact: true }).isVisible(), "Room cards do not wait for slow deals");
    for (let attempt = 0; !roomNotification && attempt < 20; attempt++) await refreshPage.waitForTimeout(100);
    assert.equal(typeof roomNotification, "function", "Buyer subscribes to room notifications");
    catalogue = [...catalogue, { ...room, roomId: 99, title: "Just created by the host" }];
    roomNotification();
    await refreshPage.getByRole("heading", { name: "Just created by the host", exact: true }).waitFor({ timeout: 2500 });
    assert.equal(await refreshPage.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "light");
    await refreshPage.screenshot({ path: ".ui-check/buyer-live-refresh.png", fullPage: true });
    await refreshContext.close();

    const detailsContext = await createContext("buyer", { width: 1440, height: 1000 });
    await detailsContext.route("**:8080/buyer/rooms/5", async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(products) });
    });
    const detailsPage = await detailsContext.newPage();
    await detailsPage.goto(`${base}/buyer/rooms/5`);
    await detailsPage.getByRole("heading", { name: room.title, exact: true }).waitFor({ timeout: 2000 });
    assert.ok(await detailsPage.getByText("Loading products...", { exact: true }).isVisible(), "Room details appear before slow products");
    await detailsPage.getByRole("heading", { name: products[0].productName, exact: true }).waitFor();
    await detailsContext.close();

    const loginContext = await createContext(null, { width: 1440, height: 1000 });
    const loginPage = await loginContext.newPage();
    let loginBody;
    await loginContext.route("**:8080/auth/login", route => {
        loginBody = route.request().postDataJSON();
        assert.equal(route.request().headers().authorization, undefined, "Login must not send stale Basic credentials");
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ userId: 1, name: "Preview host", role: "host", email: "host@example.com", accessToken: "t".repeat(43), expiresAt: new Date(Date.now() + 3600000).toISOString() }) });
    });
    await loginPage.goto(`${base}/host/login`);
    await loginPage.evaluate(() => sessionStorage.setItem("bidverse.auth.authorization", "Basic c3RhbGU6Y3JlZGVudGlhbHM="));
    await loginPage.getByLabel("Host email").fill("host@example.com");
    await loginPage.getByLabel("Host password").fill("test-password");
    await loginPage.getByRole("button", { name: "Login as Host" }).click();
    await loginPage.waitForURL("**/host/dashboard");
    assert.equal(loginBody.role, "host");
    await loginContext.close();

    const uploadContext = await createContext("seller", { width: 1440, height: 1000 });
    const uploadPage = await uploadContext.newPage();
    const photo = await readFile("public/images/showcase-watch.png");
    const publicImage = "https://storage.example.test/storage/v1/object/public/Products/seller-21/photo.jpg";
    let uploadCount = 0;
    let productCount = 0;
    await uploadContext.route(publicImage, route => route.fulfill({ contentType: "image/jpeg", body: photo }));
    await uploadContext.route("**:8080/seller/product-images", route => {
        uploadCount++;
        assert.ok(route.request().headers().authorization?.startsWith("Bearer "));
        assert.ok(route.request().headers()["content-type"]?.startsWith("multipart/form-data; boundary="));
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ imageUrl: publicImage }) });
    });
    await uploadContext.route("**:8080/seller/products", route => {
        productCount++;
        assert.equal(route.request().postDataJSON().imageUrl, publicImage);
        if (productCount === 1) return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ detail: "Please review your product details." }) });
        return route.fulfill({ status: 201, contentType: "text/plain", body: "Product Created Successfully" });
    });
    await uploadPage.goto(`${base}/seller/list-product`);
    await uploadPage.locator('select[name="categoryId"]').selectOption("1");
    await uploadPage.getByLabel("Product name", { exact: true }).fill("Preview product");
    await uploadPage.getByLabel("Description", { exact: true }).fill("A test product description.");
    await uploadPage.getByLabel("Base price", { exact: true }).fill("100");
    await uploadPage.locator('input[type="file"]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: photo });
    await uploadPage.getByRole("button", { name: "Submit for verification", exact: true }).click();
    await uploadPage.getByRole("alert").filter({ hasText: "Please review your product details." }).waitFor();
    await uploadPage.getByRole("button", { name: "Submit for verification", exact: true }).click();
    await uploadPage.getByRole("heading", { name: "Product submitted successfully" }).waitFor();
    assert.equal(uploadCount, 1, "Retry must reuse the image upload");
    assert.equal(productCount, 2);
    await uploadContext.close();
    const hostContext = await createContext("host", { width: 1440, height: 1000 });
    const hostPage = await hostContext.newPage();
    let createdBody, selectionBody;
    let assigned = [{ ...products[0], status: "approved" }];
    await hostContext.route("**:8080/host/rooms", route => {
        createdBody = route.request().postDataJSON();
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(room) });
    });
    await hostContext.route("**:8080/host/rooms/5/products", route => {
        if (route.request().method() === "PUT") {
            selectionBody = route.request().postDataJSON();
            assigned = products.filter(product => selectionBody.productIds.includes(product.productId)).map(product => ({ ...product, status: "approved" }));
        }
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(assigned) });
    });
    await hostPage.goto(`${base}/host/rooms/create`);
    await hostPage.getByRole("checkbox", { name: "Include iPhone 15" }).waitFor();
    assert.ok(await hostPage.getByRole("checkbox", { name: "Include iPhone 15" }).isChecked(), "Approved available products are selected by default");
    assert.equal(await hostPage.getByRole("checkbox").count(), 1);
    await hostPage.getByRole("button", { name: "Clear selection" }).click();
    assert.ok(!(await hostPage.getByRole("checkbox").isChecked()));
    await hostPage.getByRole("button", { name: "Select all" }).click();
    await hostPage.getByLabel("Room title").fill("Preview room");
    await hostPage.getByLabel("Start time").fill("2026-12-09T18:30");
    await hostPage.getByLabel("Seat limit").fill("20");
    await hostPage.getByLabel("Advance amount").fill("250");
    await hostPage.getByRole("button", { name: "Create auction room" }).click();
    await hostPage.waitForURL("**/host/rooms/5");
    assert.deepEqual(createdBody.productIds, [102]);
    assert.equal(createdBody.hostId, undefined, "Host identity comes from authentication");
    await hostPage.getByRole("button", { name: "Edit collection" }).click();
    await hostPage.getByRole("checkbox", { name: "Include Vintage leather watch" }).uncheck();
    await hostPage.getByRole("checkbox", { name: "Include iPhone 15" }).check();
    assert.equal(await hostPage.getByRole("button", { name: /Open waiting room|Start room/ }).count(), 0, "Scheduled rooms do not need a manual start button");
    assert.ok(await hostPage.getByText("Bidding starts 20 seconds later", { exact: false }).isVisible());
    await hostPage.getByRole("button", { name: "Save collection" }).click();
    await hostPage.getByRole("status").filter({ hasText: "Room collection updated." }).waitFor();
    assert.deepEqual(selectionBody.productIds, [102]);
    await hostPage.getByRole("button", { name: "Edit collection" }).click();
    await hostPage.getByRole("button", { name: "Clear selection" }).click();
    await hostPage.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await hostPage.locator(".host-product-tile").count(), 1, "Cancel retains saved collection");
    await hostContext.close();

    const missingContext = await createContext("seller", { width: 1440, height: 1000 });
    await missingContext.route("**:8080/seller/product-images", route => route.fulfill({ status: 404, contentType: "application/json", body: "{}" }));
    const missingPage = await missingContext.newPage();
    await missingPage.goto(`${base}/seller/list-product`);
    await missingPage.locator('select[name="categoryId"]').selectOption("1");
    await missingPage.getByLabel("Product name", { exact: true }).fill("Preview");
    await missingPage.getByLabel("Description", { exact: true }).fill("Description");
    await missingPage.getByLabel("Base price", { exact: true }).fill("100");
    await missingPage.locator('input[type="file"]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: photo });
    await missingPage.getByRole("button", { name: "Submit for verification", exact: true }).click();
    await missingPage.getByRole("alert").filter({ hasText: "Restart the updated Bidverse backend" }).waitFor();
    assert.equal(await missingPage.locator('input[name="name"]').inputValue(), "Preview", "Failed upload keeps form values");
    const legacyExport = await missingPage.evaluate(async () => typeof (await import("/src/services/supabaseStorage.js")).isSupabaseUploadConfigured);
    assert.equal(legacyExport, "function", "Older hot-reloaded forms retain their named import");
    await missingContext.close();
    assert.deepEqual(failures, [], "All routes should render without crashes, broken images or horizontal overflow");
    console.log("PASS: 38 responsive routes, readable controls, fixed cards, scrolling, hover/focus, auctions, host login, room product selection, and upload/retry/404 handling.");
} finally { await browser.close(); }
