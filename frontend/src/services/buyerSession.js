import { getAuthUser } from "./authSession";

export function getBuyerId() {
    const buyerId = Number(getAuthUser()?.userId);
    return Number.isInteger(buyerId) && buyerId > 0 ? buyerId : null;
}
