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

export const assignProductToRoom = (productId, roomId) => {
    return api.post(`http://localhost:8080/host/products/${productId}/assignRoom`, { roomId });
};

export const createRoom = (room) => {
    return api.post("/host/rooms", room);
};

export const getPendingProducts = () => {
    return api.get("/host/products/pending");
};

export const getProducts = () => {
    return api.get("/host/products");
};

export const getAvailableProducts = () => {
    return api.get("http://localhost:8080/host/products/available");
};

export const verifyProduct = (productId, status) => {
    return api.post(`/host/products/${productId}/verify`, { status });
};
