const defaultBuyerId = import.meta.env.VITE_BUYER_ID || "2";

export function getBuyerId() {
    const savedBuyerId = localStorage.getItem("buyerId");
    const buyerId = Number(savedBuyerId || defaultBuyerId);
    return Number.isInteger(buyerId) && buyerId > 0 ? buyerId : 2;
}

export function saveBuyerId(buyerId) {
    localStorage.setItem("buyerId", String(buyerId));
}
