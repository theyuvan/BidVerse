import api from "./api";

export const getRooms = () => {
    return api.get("/host/rooms");
};

export const getRoomDetails = (roomId) => {
    return api.get(`/host/rooms/${roomId}`);
};

export const getRoomProducts = (roomId) => {
    return api.get(`/host/rooms/${roomId}/products`);
};

export const startRoom = (roomId) => {
    return api.put(`/host/rooms/${roomId}/start`);
};

export const assignProductToRoom = (productId, roomId) => {
    return api.post(`/host/products/${productId}/assign-room`, { roomId });
};

export const createRoom = (room) => {
    return api.post("/host/rooms", room);
};

export const saveRoomProducts = (roomId, productIds) => api.put(`/host/rooms/${roomId}/products`, { productIds });

export const getPendingProducts = () => {
    return api.get("/host/products/pending");
};

export const getProducts = () => {
    return api.get("/host/products");
};

export const getAvailableProducts = () => {
    return api.get("/host/products/available");
};

export const verifyProduct = (productId, status) => {
    return api.post(`/host/products/${productId}/verify`, { status });
};
