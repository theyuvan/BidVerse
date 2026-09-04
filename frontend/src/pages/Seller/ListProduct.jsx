import { useState } from "react";
import { createSellerProduct } from "../../services/sellerService";

const initialForm = {
    sellerId: "2",
    categoryId: "",
    name: "",
    description: "",
    basePrice: "",
};

function ListProduct() {
    const [formData, setFormData] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            await createSellerProduct({
                sellerId: Number(formData.sellerId),
                categoryId: Number(formData.categoryId),
                name: formData.name.trim(),
                description: formData.description.trim(),
                basePrice: Number(formData.basePrice),
            });
            setMessage("Product submitted for host verification.");
            setFormData(initialForm);
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.message || "Unable to list product.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="host-page seller-page">
            <header className="page-header">
                <span className="eyebrow">Seller workspace</span>
                <h1>List a new product</h1>
                <p>Every new listing starts as pending and goes to the host verification queue.</p>
            </header>
            <form className="seller-form" onSubmit={handleSubmit}>
                <label><span>Seller ID</span><input type="number" name="sellerId" min="1" value={formData.sellerId} onChange={handleChange} required /></label>
                <label><span>Category ID</span><input type="number" name="categoryId" min="1" value={formData.categoryId} onChange={handleChange} required /></label>
                <label className="seller-form-wide"><span>Product name</span><input type="text" name="name" value={formData.name} onChange={handleChange} required /></label>
                <label className="seller-form-wide"><span>Description</span><textarea name="description" value={formData.description} onChange={handleChange} rows="4" required /></label>
                <label><span>Base price</span><input type="number" name="basePrice" min="0.01" step="0.01" value={formData.basePrice} onChange={handleChange} required /></label>
                <button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit for verification"}</button>
                {message && <p className="form-success" role="status">{message}</p>}
                {error && <p className="form-error" role="alert">{error}</p>}
            </form>
        </main>
    );
}

export default ListProduct;
