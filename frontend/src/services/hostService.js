import axios from "axios";

export const getRooms = () => {
    return axios.get("http://localhost:8080/host/rooms");
};

export const getRoomDetails = (roomId) => {
    return axios.get(`http://localhost:8080/host/rooms/${roomId}`);
};

export const getRoomProducts = (roomId) => {
    return axios.get(`http://localhost:8080/host/rooms/${roomId}/products`);
};

export const assignProductToRoom = (productId, roomId) => {
    return axios.post(`http://localhost:8080/host/products/${productId}/assignRoom`, { roomId });
};

export const createRoom = (room) => {
    return axios.post("http://localhost:8080/host/rooms", room);
};

export const getPendingProducts = () => {
    return axios.get("http://localhost:8080/host/products/pending");
};

export const getProducts = () => {
    return axios.get("http://localhost:8080/host/products?status=pending");
};

export const verifyProduct = (productId, status) => {
    return axios.post(`http://localhost:8080/host/products/${productId}/verify`, { status });
};