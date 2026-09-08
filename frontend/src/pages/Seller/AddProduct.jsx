import { useEffect, useMemo, useState } from "react";
import { createProduct, getCategories } from "../../services/sellerService";
import { apiErrorMessage } from "../../services/api";
import "../shared.css";

const initialForm = { categoryId: "", name: "", description: "", basePrice: "", imageUrl: "", otherCategory: "" };

export default function AddProduct() {
    const [formData, setFormData] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        getCategories()
            .then((response) => setCategories(response.data))
            .catch(() => setError("Unable to load categories."))
            .finally(() => setCategoriesLoading(false));
    }, []);

    const selectedCategory = useMemo(
        () => categories.find((category) => String(category.categoryId) === formData.categoryId),
        [categories, formData.categoryId]
    );
    const isOtherCategory = selectedCategory?.name?.toLowerCase() === "other";

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        if (isOtherCategory && !formData.otherCategory.trim()) {
            setError("Please specify what category this product belongs to.");
            setSaving(false);
            return;
        }

        // There's no free-text category field on the product itself, so when the seller
        // picks "Other" their specified category is folded into the description where the
        // host and buyers can still see it clearly.
        const description = isOtherCategory
            ? `Category: ${formData.otherCategory.trim()}\n\n${formData.description.trim()}`
            : formData.description.trim();

        try {
            await createProduct({
                categoryId: Number(formData.categoryId),
                name: formData.name.trim(),
                description,
                basePrice: Number(formData.basePrice),
                imageUrl: formData.imageUrl.trim() || null
            });
            setMessage("Product submitted for host verification.");
            setFormData(initialForm);
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to list product."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Seller workspace</span>
                    <h1>Add a product</h1>
                    <p>Every new listing starts as pending and goes to the host verification queue.</p>
                </div>
            </div>

            <form className="card stack" style={{ padding: 24, maxWidth: 560 }} onSubmit={handleSubmit}>
                <label className="field">
                    <span className="field-label">Category</span>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={categoriesLoading}>
                        <option value="">{categoriesLoading ? "Loading categories..." : "Choose a category"}</option>
                        {categories.map((category) => (
                            <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                        ))}
                    </select>
                </label>

                {isOtherCategory && (
                    <label className="field">
                        <span className="field-label">Please specify the category</span>
                        <input
                            type="text"
                            name="otherCategory"
                            value={formData.otherCategory}
                            onChange={handleChange}
                            placeholder="e.g. Musical instruments"
                            required
                        />
                    </label>
                )}

                <label className="field">
                    <span className="field-label">Product name</span>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </label>

                <label className="field">
                    <span className="field-label">Description</span>
                    <textarea name="description" rows={4} value={formData.description} onChange={handleChange} required />
                </label>

                <label className="field">
                    <span className="field-label">Base price (₹)</span>
                    <input type="number" name="basePrice" min="0.01" step="0.01" value={formData.basePrice} onChange={handleChange} required />
                </label>

                <label className="field">
                    <span className="field-label">Image URL (optional)</span>
                    <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
                </label>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Submitting..." : "Submit for verification"}
                </button>
                {message && <p className="alert alert-success">{message}</p>}
                {error && <p className="alert alert-error">{error}</p>}
            </form>
        </div>
    );
}
