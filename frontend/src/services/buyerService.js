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
export const bookRoom = (roomId) => {
    return api.post(`/buyer/rooms/${roomId}/book`);
};
export const getBuyerBookings = () => {
    return api.get("/buyer/bookings");
};
export const getBuyerDeals = () => {
    return api.get("/buyer/deals/mine");
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
