import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerDeals } from "../../services/sellerService";
import { getSellerProfile } from "../../services/sellerSession";

function SellerDeals() {
    const [deals, setDeals] = useState([]);
    const seller = getSellerProfile();
    const sellerId = seller?.id;
    const [loading, setLoading] = useState(Boolean(sellerId));
    const [error, setError] = useState(() => sellerId ? "" : "Please sign in again to identify your seller account.");

    useEffect(() => {
        let cancelled = false;
        if (!sellerId) return () => { cancelled = true; };
        getSellerDeals(sellerId)
            .then((response) => {
                if (!cancelled) setDeals(response.data);
            })
            .catch((requestError) => {
                if (cancelled) return;
                const data = requestError.response?.data;
                setError(data?.detail || data?.message || "Unable to load seller deals.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [sellerId]);

    return (
        <main className="seller-page seller-deals-page">
            <header className="page-header seller-page-header">
                <div>
                    <span className="eyebrow">Seller deals</span>
                    <h1>My Deals</h1>
                    <p>Contact winning buyers, then confirm or reject each deal.</p>
                </div>
            </header>

            {error && <p className="form-error" role="alert">{error}</p>}
            {!loading && !error && deals.length === 0 && <p className="empty-state">There are no auction deals for this seller.</p>}
            {!error && deals.length > 0 && (
                <section className="deal-list" aria-label="Seller deals">
                    {deals.map((deal) => (
                        <Link className="deal-list-card" to={`/seller/deals/${deal.dealId}`} key={deal.dealId}>
                            <div className="deal-list-image">
                                {deal.imageUrl
                                    ? <img src={deal.imageUrl} alt={deal.productName || "Auction product"} />
                                    : <span>No image</span>}
                            </div>
                            <div className="deal-list-content">
                                <div>
                                    <span className="product-id">Deal #{deal.dealId} · Room #{deal.roomId}</span>
                                    <h2>{deal.productName || `Auction item #${deal.auctionItemId}`}</h2>
                                    <p>Buyer: {deal.buyerName || `#${deal.buyerId}`}</p>
                                </div>
                                <div className="deal-list-summary">
                                    <strong>₹{deal.finalPrice}</strong>
                                    <span className={`deal-status deal-status-${deal.status?.toLowerCase()}`}>{deal.status}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>
            )}
        </main>
    );
}

export default SellerDeals;
