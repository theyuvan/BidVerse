import axios from "axios";

const API_URL = "http://localhost:8080/seller";

export const getSellerProducts = (sellerId) => {
    return axios.get(`${API_URL}/products`, { params: { sellerId } });
};

export const getSellerProductHistory = (sellerId) => {
    return axios.get(`${API_URL}/products/history`, { params: { sellerId } });
};

export const createSellerProduct = (product) => {
    return axios.post(`${API_URL}/products`, product);
};
