import { useEffect, useState } from "react";
import { getSellerProductHistory } from "../../services/sellerService";
import { getSellerProfile } from "../../services/sellerSession";

function MyProducts() {
    const [products, setProducts] = useState([]);
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

    return (
        <main className="seller-page seller-products-page">
            <header className="page-header seller-page-header">
                <div>
                    <span className="eyebrow">Seller catalogue</span>
                    <h1>My Products</h1>
                </div>
            </header>
            <p className="products-help-text">
                    Track the current status of your products, check room
                    assignments, monitor auctions, and view completed sales
                    from one place.
            </p>
            {loading && <p className="empty-state">Loading your products...</p>}
            {!loading && error && <p className="form-error" role="alert">{error}</p>}
            {!loading && !error && products.length === 0 && <p className="empty-state">You have not listed any products yet.</p>}
            {!loading && !error && products.length > 0 && (
                <div className="seller-product-list">
                    {products.map((product) => {
                        const sold = product.auctionStatus?.toLowerCase() === "sold" && Boolean(product.buyerId);
                        return (
                            <article className="seller-product-card" key={product.productId}>
                                <div className="seller-product-image">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} />
                                    ) : (
                                        <span aria-hidden="true">No image</span>
                                    )}
                                </div>
                                <div className="seller-product-content">
                                    <div className="seller-product-heading">
                                        <div><span className="product-id">Product #{product.productId}</span><h2>{product.name}</h2></div>
                                        <span className={`product-status ${product.productStatus?.toLowerCase()}`}>{product.productStatus}</span>
                                    </div>
                                    <p>{product.description || "No description available."}</p>
                                    <dl className="seller-product-meta">
                                        <div><dt>Category</dt><dd>{product.categoryName || `ID ${product.categoryId}`}</dd></div>
                                        <div><dt>Base price</dt><dd>₹{product.basePrice}</dd></div>
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
        </main>
    );
}

export default MyProducts;
