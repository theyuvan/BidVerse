import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerDeals } from "../../services/sellerService";
import "./SellerDeals.css";
const INITIAL_SELLER_ID = "2";

function SellerDeals() {
    const [sellerId, setSellerId] = useState(INITIAL_SELLER_ID);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDeals = async (id = sellerId) => {
        setLoading(true);
        setError("");
        try {
            const response = await getSellerDeals(Number(id));
            setDeals(response.data);
        } catch (requestError) {
            const data = requestError.response?.data;
            setError(data?.detail || data?.message || "Unable to load seller deals.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        getSellerDeals(Number(INITIAL_SELLER_ID))
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
    }, []);

    return (
        <main className="seller-page">
            <header className="page-header seller-page-header">
                <span className="eyebrow">Seller workspace</span>
                <h1>My deals</h1>
                <p>Contact winning buyers, then confirm or reject each deal.</p>
            </header>

            <form className="seller-filter" onSubmit={(event) => { event.preventDefault(); loadDeals(); }}>
                <label htmlFor="deals-seller-id">Seller ID</label>
                <input id="deals-seller-id" type="number" min="1" value={sellerId} onChange={(event) => setSellerId(event.target.value)} />
                <button type="submit" disabled={loading}>{loading ? "Loading..." : "Load deals"}</button>
            </form>

            {error && <p className="form-error" role="alert">{error}</p>}
            {!loading && !error && deals.length === 0 && <p className="empty-state">There are no auction deals for this seller.</p>}
            {!error && deals.length > 0 && (
                <section className="deal-list" aria-label="Seller deals">
                    {deals.map((deal) => (
                        <Link className="deal-list-card" to={`/seller/deals/${deal.dealId}`} key={deal.dealId}>
                            <div>
                                <span className="product-id">Deal #{deal.dealId} · Room #{deal.roomId}</span>
                                <h2>{deal.productName || `Auction item #${deal.auctionItemId}`}</h2>
                                <p>Buyer: {deal.buyerName || `#${deal.buyerId}`}</p>
                            </div>
                            <div className="deal-list-summary">
                                <strong>₹{deal.finalPrice}</strong>
                                <span className={`deal-status deal-status-${deal.status?.toLowerCase()}`}>{deal.status}</span>
                            </div>
                        </Link>
                    ))}
                </section>
            )}
        </main>
    );
}

export default SellerDeals;
