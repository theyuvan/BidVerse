import { useEffect, useState } from "react";
import { createSellerProduct, getSellerCategories } from "../../services/sellerService";
import { getSellerProfile } from "../../services/sellerSession";
import { uploadProductImage } from "../../services/supabaseStorage";

const initialForm = {
    categoryId: "",
    name: "",
    description: "",
    basePrice: "",
    imageUrl: "",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function ListProduct() {
    const [formData, setFormData] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [imageName, setImageName] = useState("");
    const seller = getSellerProfile();

    useEffect(() => {
        getSellerCategories()
            .then((response) => setCategories(response.data))
            .catch(() => setError("Unable to load categories."))
            .finally(() => setCategoriesLoading(false));
    }, []);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });

        if (event.target.name === "imageUrl" && !imageFile) {
            setImagePreview(event.target.value.trim());
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
            setError("Please choose a PNG, JPG, WEBP, or GIF image.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError("Image must be 2 MB or smaller.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageFile(file);
            setImagePreview(String(reader.result));
            setImageName(file.name);
            setError("");
        };
        reader.onerror = () => setError("Unable to read the selected image.");
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            if (!seller?.id) throw new Error("Please sign in again to identify your seller account.");
            const publicImageUrl = imageFile
                ? await uploadProductImage(imageFile)
                : formData.imageUrl.trim();


            if (imageFile) {
                setFormData((current) => ({ ...current, imageUrl: publicImageUrl }));
                setImageFile(null);
                setImagePreview(publicImageUrl);
            }

            if (publicImageUrl) {
                let parsedImageUrl;
                try {
                    parsedImageUrl = new URL(publicImageUrl);
                } catch {
                    throw new Error("Enter a valid public product image URL.");
                }
                if (parsedImageUrl.protocol !== "https:") {
                    throw new Error("Product image URL must use HTTPS.");
                }
            }

            await createSellerProduct({
                categoryId: Number(formData.categoryId),
                name: formData.name.trim(),
                description: formData.description.trim(),
                basePrice: Number(formData.basePrice),
                imageUrl: publicImageUrl || null,
            });
            setMessage("Product submitted for verification.");
            setFormData(initialForm);
            setImageFile(null);
            setImagePreview("");
            setImageName("");
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.detail || responseData?.message || requestError.message || "Unable to list product.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="seller-page">
            <header className="page-header seller-page-header">
                <div>
                    <h1>List a new product</h1>
                    <p>Every new listing starts as pending and goes to the host verification queue.</p>
                </div>
            </header>
            <form className="seller-form" onSubmit={handleSubmit}>
                <label><span>Seller</span><input type="text" value={seller?.name || "Sign in to continue"} readOnly /></label>
                <label>
                    <span>Category</span>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={categoriesLoading}>
                        <option value="">{categoriesLoading ? "Loading categories..." : "Choose a category"}</option>
                        {categories.map((category) => (
                            <option key={category.categoryId} value={category.categoryId}>
                                {category.categoryId} - {category.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="seller-form-wide"><span>Product name</span><input type="text" name="name" value={formData.name} onChange={handleChange} required /></label>
                <label className="seller-form-wide"><span>Description</span><textarea name="description" value={formData.description} onChange={handleChange} rows="4" required /></label>
                <label><span>Base price</span><input type="number" name="basePrice" min="0.01" step="0.01" value={formData.basePrice} onChange={handleChange} required /></label>
                <label className="seller-form-wide seller-image-field">
                    <span>Product image</span>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleImageChange}
                        disabled={saving}
                        key={imageFile ? "selected-image" : "empty-image"}
                    />
                    <small>
                        Optional. PNG, JPG, WEBP, or GIF up to 2 MB.
                        {" Uploaded securely through your seller account."}
                    </small>
                    {imageName && <strong>{imageName}</strong>}
                    {imageFile && <button type="button" className="secondary-button" disabled={saving} onClick={() => {
                        setImageFile(null); setImageName(""); setImagePreview(formData.imageUrl.trim()); setError("");
                    }}>Remove selected image</button>}
                    {imagePreview && (
                        <img
                            className="seller-image-preview"
                            src={imagePreview}
                            alt="Selected product preview"
                            onError={() => setError("The image could not be loaded. Check that the Supabase bucket is public and the URL is correct.")}
                        />
                    )}
                </label>
                <button type="submit" disabled={saving}>{saving ? "Uploading & submitting..." : "Submit for verification"}</button>
                {error && <p className="form-error" role="alert">{error}</p>}
            </form>
            <section className="seller-next-steps" aria-labelledby="seller-next-steps-title">
                <span className="eyebrow">After you submit</span>
                <h2 id="seller-next-steps-title">What happens next?</h2>
                <div className="seller-next-steps-grid">
                    <article><strong>01</strong><h3>Host review</h3><p>Your listing enters the verification queue.</p></article>
                    <article><strong>02</strong><h3>Auction setup</h3><p>Once approved, a host can add it to an auction room.</p></article>
                    <article><strong>03</strong><h3>Deal confirmation</h3><p>Track the winning buyer and confirm the final deal.</p></article>
                </div>
            </section>
            {message && (
                <div className="success-modal-backdrop" role="presentation">
                    <section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="product-success-title">
                        <span className="success-modal-icon" aria-hidden="true">✓</span>
                        <p className="success-modal-kicker">Listing submitted</p>
                        <h2 id="product-success-title">Product submitted successfully</h2>
                        <p>Your product is now waiting for host verification.</p>
                        <button type="button" onClick={() => setMessage("")}>Continue</button>
                    </section>
                </div>
            )}
        </main>
    );
}

export default ListProduct;
