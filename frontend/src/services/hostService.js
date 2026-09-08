import api from "./api";

const BASE = "/host";

export const getRooms = () => api.get(`${BASE}/rooms`);
export const getRoomDetails = (roomId) => api.get(`${BASE}/rooms/${roomId}`);
export const getRoomProducts = (roomId) => api.get(`${BASE}/rooms/${roomId}/products`);
export const startRoom = (roomId) => api.put(`${BASE}/rooms/${roomId}/start`);
export const createRoom = (room) => api.post(`${BASE}/rooms`, room);
export const updateRoomSeatLimit = (roomId, seatLimit) => api.patch(`${BASE}/rooms/${roomId}`, { seatLimit });

export const assignProductToRoom = (productId, roomId) =>
    api.post(`${BASE}/products/${productId}/assign-room`, { roomId });

export const getProducts = (status) => api.get(`${BASE}/products`, { params: status ? { status } : {} });
export const getPendingProducts = () => api.get(`${BASE}/products/pending`);
export const getAvailableProducts = () => api.get(`${BASE}/products/available`);
export const verifyProduct = (productId, status) => api.post(`${BASE}/products/${productId}/verify`, { status });
