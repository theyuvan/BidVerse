import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignProductToRoom, createRoom, getAvailableProducts } from "../../services/hostService";
import { apiErrorMessage } from "../../services/api";
import "../shared.css";

export default function CreateRoom() {
    const [formData, setFormData] = useState({ title: "", seatLimit: "", advanceAmount: "", startTime: "" });
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getAvailableProducts()
            .then((response) => setAvailableProducts(response.data))
            .catch(() => {});
    }, []);

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

    const toggleProduct = (productId) => {
        setSelectedProductIds((current) =>
            current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setSaving(true);

        try {
            const response = await createRoom({
                title: formData.title,
                seatLimit: Number(formData.seatLimit),
                advanceAmount: Number(formData.advanceAmount),
                status: "upcoming",
                startTime: `${formData.startTime}:00+05:30`
            });
            const room = response.data;

            if (selectedProductIds.length > 0) {
                await Promise.all(selectedProductIds.map((productId) => assignProductToRoom(productId, room.roomId)));
                setMessage(`Room created with ${selectedProductIds.length} product(s) added. You can add more anytime before it starts.`);
            } else {
                setMessage("Room created. Add products to it from My Rooms before it starts.");
            }

            setFormData({ title: "", seatLimit: "", advanceAmount: "", startTime: "" });
            setSelectedProductIds([]);
            window.setTimeout(() => navigate(`/host/rooms/${room.roomId}`), 900);
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to create room."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Host workspace</span>
                    <h1>Create a room</h1>
                    <p>Add products now, or skip this and attach them later from My Rooms — any time before the room starts.</p>
                </div>
            </div>

            <form className="card stack" style={{ padding: 24, maxWidth: 640 }} onSubmit={handleSubmit}>
                <label className="field">
                    <span className="field-label">Room title</span>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Saturday Electronics Auction" required />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <label className="field">
                        <span className="field-label">Seat limit</span>
                        <input type="number" name="seatLimit" min="1" value={formData.seatLimit} onChange={handleChange} required />
                    </label>
                    <label className="field">
                        <span className="field-label">Advance amount (₹)</span>
                        <input type="number" name="advanceAmount" min="0" step="0.01" value={formData.advanceAmount} onChange={handleChange} required />
                    </label>
                </div>

                <label className="field">
                    <span className="field-label">Start time</span>
                    <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
                </label>

                <div className="field">
                    <span className="field-label">Add products now (optional — you can add more later)</span>
                    {availableProducts.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--text-faint)" }}>No approved products are waiting to be assigned right now.</p>
                    ) : (
                        <div className="stack" style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 10 }}>
                            {availableProducts.map((product) => (
                                <label key={product.productId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, padding: "6px 4px" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(product.productId)}
                                        onChange={() => toggleProduct(product.productId)}
                                    />
                                    {product.productName} · {product.categoryName || "Uncategorized"} · ₹{product.basePrice}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Creating..." : "Create room"}
                </button>
                {message && <p className="alert alert-success">{message}</p>}
                {error && <p className="alert alert-error">{error}</p>}
            </form>
        </div>
    );
}
