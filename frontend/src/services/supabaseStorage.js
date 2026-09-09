import api from "./api";



export function isSupabaseUploadConfigured() { return true; }



export async function uploadProductImage(file) {
    const form = new FormData();
    form.append("file", file);
    let response;
    try { response = await api.post("/seller/product-images", form); }
    catch (error) {
        if (error.response?.status === 404) {
            throw new Error("The image-upload endpoint was not found. Restart the updated Bidverse backend on port 8080 and check the API base URL, then try again.", { cause: error });
        }
        throw error;
    }
    if (!response.data?.imageUrl) throw new Error("The upload did not return an image URL.");
    return response.data.imageUrl;
}
