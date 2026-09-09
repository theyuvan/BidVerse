const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PRODUCT_BUCKET = import.meta.env.VITE_SUPABASE_PRODUCT_BUCKET || "Products";

function safeFileName(fileName) {
    const extension = fileName.includes(".") ? `.${fileName.split(".").pop().toLowerCase()}` : "";
    const baseName = fileName
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "product";

    return `${baseName}${extension}`;
}

function encodeObjectPath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
}

export function isSupabaseUploadConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export async function uploadProductImage(file, sellerId) {
    if (!isSupabaseUploadConfigured()) {
        throw new Error(
            "Photo upload is not configured yet. Add VITE_SUPABASE_URL and " +
            "VITE_SUPABASE_ANON_KEY, or paste an existing public image URL."
        );
    }

    const objectPath = `seller-${sellerId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const encodedBucket = encodeURIComponent(PRODUCT_BUCKET);
    const encodedPath = encodeObjectPath(objectPath);
    const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${encodedBucket}/${encodedPath}`,
        {
            method: "POST",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": file.type,
                "x-upsert": "false"
            },
            body: file
        }
    );

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || body?.error || "Unable to upload the product photo.");
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}
