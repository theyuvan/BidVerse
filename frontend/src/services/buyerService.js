import api from "./api";

export const getAvailableRooms = (signal) => {
    return api.get("/buyer/rooms/available", { signal });
};
export const getRoomCatalog = (roomId, signal) => {
    return api.get(`/buyer/rooms/${roomId}`, { signal });
};
export const getRoomDetails = (roomId, signal) => {
    return api.get(`/buyer/rooms/${roomId}/details`, { signal });
};
export const bookRoom = (roomId) => {
    return api.post(`/buyer/rooms/${roomId}/book`);
};
export const getBuyerBookings = (signal) => {
    return api.get("/buyer/bookings", { signal });
};
export const getBuyerDeals = (signal) => {
    return api.get("/buyer/deals/mine", { signal });
};
export const getBuyerDeal = (dealId) => {
    return api.get(`/buyer/deals/${dealId}`);
};
export const decideBuyerDeal = (dealId, decision, reason = "") => {
    return api.post(`/buyer/deals/${dealId}/decision`, { decision, reason });
};

export const joinRoom = (roomId) => {
    return api.post(`/buyer/rooms/${roomId}/enter`);
};
