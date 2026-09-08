import { useEffect, useState } from "react";
import { getProducts, verifyProduct } from "../../services/hostService";
import { apiErrorMessage } from "../../services/api";
import "../shared.css";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function VerifyProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        getProducts()
            .then((response) => setProducts(response.data))
            .catch((requestError) => setError(apiErrorMessage(requestError, "Unable to load products.")))
            .finally(() => setLoading(false));
    }, []);

    const handleDecision = async (productId, status) => {
        setUpdatingId(productId);
        setError("");
        try {
            await verifyProduct(productId, status);
            setProducts((current) => current.map((product) =>
                product.productId === productId ? { ...product, status } : product
            ));
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to update product status."));
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredProducts = filter === "all" ? products : products.filter((product) => product.status?.toLowerCase() === filter);

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Host workspace</span>
                    <h1>Verify products</h1>
                    <p>Approve or reject product listings before they can be added to a room.</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 22 }}>
                {FILTERS.map((key) => (
                    <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)} style={{ textTransform: "capitalize" }}>
                        {key}
                    </button>
                ))}
            </div>

            {loading && <p className="spinner-row">Loading products...</p>}
            {!loading && error && <p className="alert alert-error">{error}</p>}
            {!loading && !error && filteredProducts.length === 0 && <div className="empty-state">Nothing here.</div>}

            {!loading && filteredProducts.length > 0 && (
                <div className="card table-scroll" style={{ padding: 4 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Description</th>
                                <th>Seller</th>
                                <th>Base price</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.productId}>
                                    <td style={{ color: "var(--text)", fontWeight: 600 }}>{product.productName}</td>
                                    <td>{product.description || "No description"}</td>
                                    <td>{product.sellerName || "Unknown"}</td>
                                    <td>₹{product.basePrice}</td>
                                    <td>
                                        <span className={`badge ${product.status === "approved" ? "badge-success" : product.status === "rejected" ? "badge-danger" : "badge-warning"}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        {product.status?.toLowerCase() === "pending" ? (
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button className="btn btn-success btn-sm" disabled={updatingId === product.productId} onClick={() => handleDecision(product.productId, "approved")}>
                                                    Approve
                                                </button>
                                                <button className="btn btn-danger btn-sm" disabled={updatingId === product.productId} onClick={() => handleDecision(product.productId, "rejected")}>
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="badge badge-neutral">Reviewed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
