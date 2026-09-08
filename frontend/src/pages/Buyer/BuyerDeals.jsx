import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBuyerDeals } from "../../services/buyerService";
import { getBuyerId } from "../../services/buyerSession";

function BuyerDeals() {
    const buyerId = getBuyerId();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getBuyerDeals(buyerId)
            .then((response) => {
                if (!cancelled) setDeals(response.data);
            })
            .catch((requestError) => {
                if (cancelled) return;
                const data = requestError.response?.data;
                setError(data?.detail || data?.message || "Unable to load your deals.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [buyerId]);

    return (
        <main className="seller-page buyer-deals-page">
            <header className="page-header seller-page-header">
                <span className="eyebrow">Buyer #{buyerId}</span>
                <h1>My deals</h1>
                <p>Review products you won and confirm the deal after speaking with the seller.</p>
            </header>

            {loading && <p className="empty-state">Loading your deals...</p>}
            {!loading && error && <p className="form-error" role="alert">{error}</p>}
            {!loading && !error && deals.length === 0 && <p className="empty-state">You have not won any products yet.</p>}
            {!loading && !error && deals.length > 0 && (
                <section className="deal-list" aria-label="Buyer deals">
                    {deals.map((deal) => (
                        <Link className="deal-list-card" to={`/buyer/deals/${deal.dealId}`} key={deal.dealId}>
                            <div>
                                <span className="product-id">Deal #{deal.dealId} · Room #{deal.roomId}</span>
                                <h2>{deal.productName}</h2>
                                <p>Seller: {deal.sellerName || `#${deal.sellerId}`}</p>
                            </div>
                            <div className="deal-list-summary">
                                <strong>₹{deal.finalPrice}</strong>
                                <span className={`deal-status deal-status-${deal.dealStatus?.toLowerCase()}`}>{deal.dealStatus}</span>
                            </div>
                        </Link>
                    ))}
                </section>
            )}
        </main>
    );
}

export default BuyerDeals;
