import { getAuthUser } from "./authSession";

export function getSellerProfile() {
    const user = getAuthUser();

    if (!user || user.role?.toLowerCase() !== "seller") return null;

    const id = Number(user.userId);
    if (!Number.isInteger(id) || id <= 0) return null;

    return { ...user, id };
}
