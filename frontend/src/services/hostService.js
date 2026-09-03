import axios from "axios";

export const getRooms = () => {
    return axios.get("http://localhost:8080/host/rooms");
};

export const createRoom = (room) => {
    return axios.post("http://localhost:8080/host/rooms", room);
};

export const getPendingProducts = () => {
    return axios.get("http://localhost:8080/host/products/pending");
};

export const getProducts = () => {
    return axios.get("http://localhost:8080/host/products");
};

export const verifyProduct = (productId, status) => {
    return axios.post(`http://localhost:8080/host/products/${productId}/verify`, { status });
};