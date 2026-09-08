import api from "./api";

export const getAvailableRooms = () => {
    return api.get("/buyer/rooms/available");
};
export const getRoomCatalog = (roomId) => {
    return api.get(`/buyer/rooms/${roomId}`);
};
export const getRoomDetails = (roomId) => {
    return api.get(`/buyer/rooms/${roomId}/details`);
};
export const bookRoom = (roomId, buyerId) => {
    return api.post(`/buyer/rooms/${roomId}/book`, {
        buyerId
    });
};
export const getBuyerBookings = (buyerId) => {
    return api.get(`/buyer/${buyerId}/bookings`);
};
export const getBuyerDeals = (buyerId) => {
    return api.get(`/buyer/${buyerId}/deals`);
};
export const getBuyerDeal = (dealId) => {
    return api.get(`/buyer/deals/${dealId}`);
};
export const decideBuyerDeal = (dealId, decision, reason = "") => {
    return api.post(`/buyer/deals/${dealId}/decision`, { decision, reason });
};

export const joinRoom = (roomId, buyerId) => {
    return api.post(`/buyer/rooms/${roomId}/enter`, null, {
        params: { buyerId }
    });
};
