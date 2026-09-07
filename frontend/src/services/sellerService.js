import api from "./api";

const API_URL = "/seller";

export const getSellerProducts = (sellerId) => {
    return api.get(`${API_URL}/products`, { params: { sellerId } });
};

export const getSellerProductHistory = (sellerId) => {
    return api.get(`${API_URL}/products/history`, { params: { sellerId } });
};

export const createSellerProduct = (product) => {
    return api.post(`${API_URL}/products`, product);
};
