import api from "./api";

const API_URL = "/seller";

export const getSellerCategories = () => {
    return api.get(`${API_URL}/categories`);
};

export const getSellerProducts = (sellerId) => {
    return api.get(`${API_URL}/products`, { params: { sellerId } });
};

export const getSellerProductHistory = (sellerId) => {
    return api.get(`${API_URL}/products/history`, { params: { sellerId } });
};

export const createSellerProduct = (product) => {
    return api.post(`${API_URL}/products`, product);
};

export const getSellerDeals = (sellerId) => {
    return api.get(`${API_URL}/deals`, { params: { sellerId } });
};

export const getSellerDeal = (dealId) => {
    return api.get(`${API_URL}/deals/${dealId}`);
};

export const decideSellerDeal = (dealId, decision, reason = "") => {
    return api.post(`${API_URL}/deals/${dealId}/decision`, { decision, reason });
};
