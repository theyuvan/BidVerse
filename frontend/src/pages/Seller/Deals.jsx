import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDeals } from "../../services/sellerService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel } from "../../components/layout/icons";
import "../shared.css";

const TABS = [
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" }
];

export default function Deals() {
    const [deals, setDeals] = useState([]);
    const [tab, setTab] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getDeals()
            .then((response) => { if (!cancelled) setDeals(response.data); })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load your deals.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const grouped = useMemo(() => {
        const buckets = { pending: [], completed: [], cancelled: [] };
        deals.forEach((deal) => {
            const key = deal.status?.toLowerCase();
            (buckets[key] || buckets.pending).push(deal);
        });
        return buckets;
    }, [deals]);

    const visible = grouped[tab] || [];

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Seller workspace</span>
                    <h1>My deals</h1>
                    <p>Contact winning buyers, then confirm or reject each deal.</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 22 }}>
                {TABS.map(({ key, label }) => (
                    <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                        {label} <span style={{ opacity: 0.7 }}>({grouped[key]?.length ?? 0})</span>
                    </button>
                ))}
            </div>

            {error && <p className="alert alert-error">{error}</p>}

            {loading ? (
                <p className="spinner-row">Loading deals...</p>
            ) : visible.length === 0 ? (
                <div className="empty-state">Nothing here yet.</div>
            ) : (
                <div className="stack">
                    {visible.map((deal) => (
                        <Link className="card deal-card" to={`/seller/deals/${deal.dealId}`} key={deal.dealId}>
                            <div className="thumb">
                                {deal.imageUrl
                                    ? <img src={deal.imageUrl} alt={deal.productName} />
                                    : <span className="thumb-fallback"><IconGavel width={22} height={22} /></span>}
                            </div>
                            <div className="deal-card-body">
                                <h3>{deal.productName || `Auction item #${deal.auctionItemId}`}</h3>
                                <div className="deal-card-meta">
                                    <span>Deal #{deal.dealId}</span>
                                    <span>Room #{deal.roomId}</span>
                                    <span>Buyer: {deal.buyerName || `#${deal.buyerId}`}</span>
                                </div>
                            </div>
                            <span className="deal-card-price">₹{deal.finalPrice}</span>
                            <span className={`badge ${deal.status === "completed" ? "badge-success" : deal.status === "cancelled" ? "badge-danger" : "badge-warning"}`}>
                                {deal.status}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
