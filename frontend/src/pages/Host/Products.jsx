import { useEffect, useState } from "react";
import { getProducts, verifyProduct } from "../../services/hostService";
import ProductPhoto from "../../components/ProductPhoto";
import "./Products.css";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState("all");
    const [query, setQuery] = useState("");
    useEffect(() => {
        getProducts().then(response => setProducts(response.data)).catch(() => setError("Unable to load products.")).finally(() => setLoading(false));
    }, []);
    const decide = async (id, status) => {
        setUpdatingId(id); setError("");
        try {
            await verifyProduct(id, status);
            setProducts(current => current.map(product => product.productId === id ? { ...product, status } : product));
        } catch (error) { setError(error.response?.data?.detail || error.response?.data?.message || "Unable to update product status."); }
        finally { setUpdatingId(null); }
    };
    const visible = products.filter(product => (filter === "all" || product.status?.toLowerCase() === filter)
        && [product.productName, product.sellerName, product.categoryName].some(value => String(value || "").toLowerCase().includes(query.toLowerCase())));
    return <main className="host-page products-page">
        <header className="page-header"><div><span className="overline">CURATE THE NEXT AUCTION</span><h1>Product collection</h1><p>Review the details. Approve the pieces that are ready for bidding.</p></div></header>
        <div className="host-collection-toolbar"><div className="product-filters" aria-label="Product status filters">
            {["all", "pending", "approved", "rejected"].map(status => <button key={status} type="button" data-status={status} className={filter === status ? "active" : ""} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status[0].toUpperCase() + status.slice(1)}</button>)}
        </div><input aria-label="Search products" type="search" placeholder="Search products or sellers" value={query} onChange={event => setQuery(event.target.value)} /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <p className="empty-state">Loading products…</p> : !visible.length ? <p className="empty-state">No products match this view.</p>
            : <div className="host-product-grid">{visible.map(product => <article className="host-product-tile" key={product.productId}>
                <ProductPhoto src={product.imageUrl} name={product.productName} />
                <div className="host-product-body"><div className="host-product-top"><span>{product.categoryName || "Collection"}</span><span className={`host-status ${product.status}`}>{product.status}</span></div>
                    <h2>{product.productName}</h2><p className="host-product-description">{product.description || "No description provided."}</p>
                    <dl><div><dt>Listed by</dt><dd>{product.sellerName || "Seller unavailable"}</dd></div><div><dt>Base price</dt><dd>₹{Number(product.basePrice).toLocaleString("en-IN")}</dd></div></dl>
                    {product.status?.toLowerCase() === "pending" ? <div className="host-product-decisions">
                        <button type="button" disabled={updatingId !== null} onClick={() => decide(product.productId, "approved")}>{updatingId === product.productId ? "Saving…" : "Approve"}</button>
                        <button type="button" className="button-outline" disabled={updatingId !== null} onClick={() => decide(product.productId, "rejected")}>Reject</button>
                    </div> : <p className="host-review-note">{product.status === "approved" ? "Approved · ready for selection if unassigned" : "Reviewed · not available for auction"}</p>}
                </div>
            </article>)}</div>}
    </main>;
}
