import { useEffect, useState } from "react";
import { getSellerProductHistory } from "../../services/sellerService";

const INITIAL_SELLER_ID = "2";

function MyProducts() {
    const [sellerId, setSellerId] = useState(INITIAL_SELLER_ID);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProducts = async (id = sellerId) => {
        setLoading(true);
        setError("");
        try {
            const response = await getSellerProductHistory(Number(id));
            setProducts(response.data);
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.message || "Unable to load your products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        getSellerProductHistory(Number(INITIAL_SELLER_ID))
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
    }, []);

    return (
        <main className="host-page seller-page">
            <header className="page-header">
                <span className="eyebrow">Seller workspace</span>
                <h1>My products</h1>
                <p>Follow each listing from host review to auction sale.</p>
            </header>
            <form className="seller-filter" onSubmit={(event) => { event.preventDefault(); loadProducts(); }}>
                <label htmlFor="history-seller-id">Seller ID</label>
                <input id="history-seller-id" type="number" min="1" value={sellerId} onChange={(event) => setSellerId(event.target.value)} />
                <button type="submit">Load products</button>
            </form>
            {loading && <p className="empty-state">Loading your products...</p>}
            {!loading && error && <p className="form-error" role="alert">{error}</p>}
            {!loading && !error && products.length === 0 && <p className="empty-state">You have not listed any products yet.</p>}
            {!loading && !error && products.length > 0 && (
                <div className="seller-product-list">
                    {products.map((product) => {
                        const dealStatus = product.dealStatus?.toLowerCase();
                        const sold = ["sold", "confirmed", "completed"].includes(dealStatus);
                        return (
                            <article className="seller-product-card" key={product.productId}>
                                <div className="seller-product-heading">
                                    <div><span className="product-id">Product #{product.productId}</span><h2>{product.name}</h2></div>
                                    <span className={`product-status ${product.productStatus}`}>{product.productStatus}</span>
                                </div>
                                <p>{product.description || "No description available."}</p>
                                <dl className="seller-product-meta">
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
                            </article>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default MyProducts;
