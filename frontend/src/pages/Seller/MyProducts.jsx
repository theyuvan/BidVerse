import { useEffect, useState } from "react";
import { getSellerProductHistory } from "../../services/sellerService";
import { getSellerProfile } from "../../services/sellerSession";
import ProductPhoto from "../../components/ProductPhoto";
import "./MyProducts.css";

function MyProducts() {
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState("all");
    const seller = getSellerProfile();
    const sellerId = seller?.id;
    const [loading, setLoading] = useState(Boolean(sellerId));
    const [error, setError] = useState(() => sellerId ? "" : "Please sign in again to identify your seller account.");

    useEffect(() => {
        let cancelled = false;

        if (!sellerId) return () => { cancelled = true; };

        getSellerProductHistory(sellerId)
            .then((response) => {
                if (!cancelled) setProducts(response.data);
            })
            .catch((requestError) => {
                if (cancelled) return;
                const responseData = requestError.response?.data;
                setError(typeof responseData === "string"
                    ? responseData
                    : responseData?.message || "Unable to load your products.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [sellerId]);

    const visibleProducts = products.filter(product => filter === "all" || product.productStatus?.trim().toLowerCase() === filter);

    return (
        <main className="seller-page seller-products-page">
            <header className="page-header seller-page-header">
                <div>
                    <h1>My Products</h1>
                </div>
            </header>
            <p className="products-help-text">
                    Track the current status of your products, check room
                    assignments, monitor auctions, and view completed sales
                    from one place.
            </p>
            <div className="host-collection-toolbar">
            <div className="product-filters" role="group" aria-label="Product status filters">
                {["all", "pending", "approved", "rejected"].map(status => (
                    <button key={status} type="button" data-status={status}
                        className={filter === status ? "active" : ""}
                        aria-pressed={filter === status} aria-controls="seller-product-results"
                        onClick={() => setFilter(status)}>
                        {status[0].toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>
            </div>
            <section id="seller-product-results" aria-label={`${filter} products`} aria-live="polite" aria-busy={loading}>
            {loading && <p className="empty-state">Loading your products...</p>}
            {!loading && error && <p className="form-error" role="alert">{error}</p>}
            {!loading && !error && products.length === 0 && <p className="empty-state">You have not listed any products yet.</p>}
            {!loading && !error && products.length > 0 && visibleProducts.length === 0 && <p className="empty-state">No {filter} products yet.</p>}
            {!loading && !error && visibleProducts.length > 0 && (
                <div className="seller-product-list">
                    {visibleProducts.map((product) => {
                        const sold = product.auctionStatus?.toLowerCase() === "sold" && Boolean(product.buyerId);
                        return (
                            <article className="seller-product-card" key={product.productId}>
                                <div className="seller-product-image">
                                    <ProductPhoto src={product.imageUrl} name={product.name} />
                                </div>
                                <div className="seller-product-content">
                                    <div className="seller-product-heading">
                                        <span className="seller-product-category">{product.categoryName || "Collection"}</span>
                                        <span className={`product-status ${product.productStatus?.trim().toLowerCase()}`}>{product.productStatus}</span>
                                    </div>
                                    <div className="seller-product-title">
                                        <h2>{product.name}</h2>
                                    </div>
                                    <details className="seller-product-description">
                                        <summary>Product description</summary>
                                        <p>{product.description || "No description available."}</p>
                                    </details>
                                    <div className="seller-product-price"><span>Base price</span><strong>₹{Number(product.basePrice || 0).toLocaleString("en-IN")}</strong></div>
                                    <dl className="seller-product-meta">
                                        <div><dt>Room</dt><dd>{product.roomId ? `#${product.roomId}` : "Not assigned"}</dd></div>
                                        <div><dt>Auction</dt><dd>{product.auctionStatus || "Not started"}</dd></div>
                                        <div><dt>Sale</dt><dd>{product.dealStatus || "Not sold"}</dd></div>
                                    </dl>
                                    {sold && product.buyerId && (
                                        <div className="buyer-details">
                                            <h3>Buyer details</h3>
                                            <p><strong>{product.buyerName || `Buyer #${product.buyerId}`}</strong></p>
                                            <p>{product.buyerEmail || "Email unavailable"} · {product.buyerPhone || "Phone unavailable"}</p>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
            </section>
        </main>
    );
}

export default MyProducts;
