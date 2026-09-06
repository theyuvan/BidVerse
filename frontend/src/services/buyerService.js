import api from "./api";

export const getAvailableRooms = () => {
    return api.get("/buyer/rooms/available");
};
export const getRoomCatalog = (roomId) => {
    return api.get(`/buyer/rooms/${roomId}`);
};
export const bookRoom = (roomId, buyerId) => {
    return api.post(`/buyer/rooms/${roomId}/book`, {
        buyerId: buyerId
    });
};