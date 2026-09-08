import api from "./api";

const BASE = "/seller";

export const getCategories = () => api.get(`${BASE}/categories`);
export const getProducts = () => api.get(`${BASE}/products`);
export const getProductHistory = () => api.get(`${BASE}/products/history`);
export const createProduct = (product) => api.post(`${BASE}/products`, product);

export const getDeals = () => api.get(`${BASE}/deals`);
export const getDeal = (dealId) => api.get(`${BASE}/deals/${dealId}`);
export const decideDeal = (dealId, decision, reason = "") =>
    api.post(`${BASE}/deals/${dealId}/decision`, { decision, reason });
