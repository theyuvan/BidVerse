import api from "./api";

export const getAvailableRooms = () => api.get("/buyer/rooms/available");
export const searchRooms = (query) => api.get("/buyer/rooms/search", { params: { query } });
export const getRoomCatalog = (roomId) => api.get(`/buyer/rooms/${roomId}`);
export const getRoomDetails = (roomId) => api.get(`/buyer/rooms/${roomId}/details`);
export const bookRoom = (roomId) => api.post(`/buyer/rooms/${roomId}/book`);
export const joinRoom = (roomId) => api.post(`/buyer/rooms/${roomId}/enter`);

export const getBookings = (status) => api.get("/buyer/bookings", { params: status ? { status } : {} });
export const getDeals = () => api.get("/buyer/deals/mine");
export const getDeal = (dealId) => api.get(`/buyer/deals/${dealId}`);
export const decideDeal = (dealId, decision, reason = "") =>
    api.post(`/buyer/deals/${dealId}/decision`, { decision, reason });
