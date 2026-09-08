import { useEffect, useState } from "react";
import { getProductHistory } from "../../services/sellerService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel } from "../../components/layout/icons";
import "../shared.css";

const TABS = ["all", "pending", "approved", "rejected"];

export default function Products() {
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getProductHistory()
            .then((response) => { if (!cancelled) setProducts(response.data); })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load your products.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const filtered = filter === "all" ? products : products.filter((p) => p.productStatus?.toLowerCase() === filter);

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Seller workspace</span>
                    <h1>My products</h1>
                    <p>Follow each listing from host review to auction sale.</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 22 }}>
                {TABS.map((key) => (
                    <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)} style={{ textTransform: "capitalize" }}>
                        {key}
                    </button>
                ))}
            </div>

            {loading && <p className="spinner-row">Loading your products...</p>}
            {!loading && error && <p className="alert alert-error">{error}</p>}
            {!loading && !error && filtered.length === 0 && <div className="empty-state">Nothing here yet.</div>}

            {!loading && !error && filtered.length > 0 && (
                <div className="grid-cards">
                    {filtered.map((product) => {
                        const sold = product.auctionStatus?.toLowerCase() === "sold" && Boolean(product.buyerId);
                        return (
                            <article className="card" style={{ padding: 16 }} key={product.productId}>
                                <div className="thumb" style={{ marginBottom: 12 }}>
                                    {product.imageUrl
                                        ? <img src={product.imageUrl} alt={product.name} />
                                        : <span className="thumb-fallback"><IconGavel width={24} height={24} /></span>}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                                    <h3 style={{ fontSize: 15 }}>{product.name}</h3>
                                    <span className={`badge ${product.productStatus === "approved" ? "badge-success" : product.productStatus === "rejected" ? "badge-danger" : "badge-warning"}`}>
                                        {product.productStatus}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, marginBottom: 10 }}>{product.description || "No description available."}</p>
                                <dl className="fact-list" style={{ marginBottom: sold ? 12 : 0 }}>
                                    <div><dt>Category</dt><dd>{product.categoryName || `#${product.categoryId}`}</dd></div>
                                    <div><dt>Base price</dt><dd>₹{product.basePrice}</dd></div>
                                    <div><dt>Room</dt><dd>{product.roomId ? `#${product.roomId}` : "Not assigned"}</dd></div>
                                    <div><dt>Auction</dt><dd style={{ textTransform: "capitalize" }}>{product.auctionStatus || "Not started"}</dd></div>
                                </dl>
                                {sold && (
                                    <div className="contact-card">
                                        <strong>{product.buyerName || `Buyer #${product.buyerId}`}</strong>
                                        <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
                                            {product.buyerEmail || "Email unavailable"} · {product.buyerPhone || "Phone unavailable"}
                                        </span>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
