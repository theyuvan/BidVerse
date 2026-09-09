import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    decideBuyerDeal,
    getBuyerDeal,
    getBuyerDeals
} from "../../services/buyerService";
import "./BuyerDeals.css";

const formatMoney = (amount) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
}).format(Number(amount) || 0);

const normalize = (value) => value?.toLowerCase() || "pending";

function getErrorMessage(error, fallback) {
    const data = error.response?.data;
    return typeof data === "string"
        ? data
        : data?.detail || data?.message || fallback;
}

function StatusBadge({ status }) {
    const normalizedStatus = normalize(status);

    return (
        <span className={`buyer-deal-status buyer-deal-status-${normalizedStatus}`}>
            {status || "Pending"}
        </span>
    );
}

function BuyerDeals() {
    const [deals, setDeals] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        getBuyerDeals()
            .then((response) => {
                if (!cancelled) setDeals(response.data);
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(getErrorMessage(requestError, "Unable to load your deals."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const filteredDeals = useMemo(() => {
        const query = search.trim().toLowerCase();

        return deals.filter((deal) => {
            const dealStatus = normalize(deal.dealStatus);
            const needsAction = dealStatus === "pending" && normalize(deal.buyerStatus) === "pending";
            const matchesFilter = activeFilter === "all"
                || (activeFilter === "action" && needsAction)
                || dealStatus === activeFilter;
            const matchesSearch = !query || [
                deal.productName,
                deal.sellerName,
                deal.roomId,
                deal.dealId
            ].some((value) => String(value || "").toLowerCase().includes(query));

            return matchesFilter && matchesSearch;
        });
    }, [activeFilter, deals, search]);

    const retry = () => {
        setError("");
        setLoading(true);
        setReloadKey((current) => current + 1);
    };

    return (
        <main className="buyer-deals-page">
            <header className="buyer-deals-header">
                <div>
                    <h1>My Deals</h1>
                    <p>
                        Review products you won, contact the seller, and complete your decisions.
                    </p>
                </div>
            </header>

            {!loading && !error && deals.length > 0 && (
                <section className="buyer-deals-toolbar" aria-label="Deal filters">
                    <div className="buyer-deal-filters">
                        {[
                            ["all", "All Deals"],
                            ["action", "Needs Action"],
                            ["completed", "Completed"],
                            ["cancelled", "Cancelled"]
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                className={activeFilter === value ? "active" : ""}
                                onClick={() => setActiveFilter(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <label className="buyer-deal-search">
                        <span className="sr-only">Search deals</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search product, seller or room"
                        />
                    </label>
                </section>
            )}

            {loading && (
                <div className="buyer-deal-skeletons" aria-label="Loading deals">
                    <div /><div /><div />
                </div>
            )}

            {!loading && error && (
                <section className="buyer-deals-message buyer-deals-error" role="alert">
                    <h2>Could not load your deals</h2>
                    <p>{error}</p>
                    <button type="button" onClick={retry}>Try Again</button>
                </section>
            )}

            {!loading && !error && deals.length === 0 && (
                <section className="buyer-deals-message">
                    <span aria-hidden="true">✓</span>
                    <h2>No deals yet</h2>
                    <p>Products you win will appear here after an auction ends.</p>
                    <Link to="/buyer/rooms">Browse Auction Rooms</Link>
                </section>
            )}

            {!loading && !error && deals.length > 0 && filteredDeals.length === 0 && (
                <section className="buyer-deals-message">
                    <h2>No matching deals</h2>
                    <p>Try a different filter or search term.</p>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveFilter("all");
                            setSearch("");
                        }}
                    >
                        Clear Filters
                    </button>
                </section>
            )}

            {!loading && !error && filteredDeals.length > 0 && (
                <section className="buyer-deal-grid" aria-label="Your deals">
                    {filteredDeals.map((deal) => {
                        const needsAction = normalize(deal.dealStatus) === "pending"
                            && normalize(deal.buyerStatus) === "pending";

                        return (
                            <article className="buyer-deal-card" key={deal.dealId}>
                                <div className="buyer-deal-card-image">
                                    {deal.imageUrl ? (
                                        <img src={deal.imageUrl} alt={deal.productName} />
                                    ) : (
                                        <span aria-hidden="true">Won</span>
                                    )}
                                </div>

                                <div className="buyer-deal-card-body">
                                    <div className="buyer-deal-card-top">
                                        <span>Deal #{deal.dealId} · Room #{deal.roomId}</span>
                                        <StatusBadge status={deal.dealStatus} />
                                    </div>

                                    <h2>{deal.productName}</h2>
                                    <p className="buyer-deal-seller">
                                        Seller: {deal.sellerName || `Seller #${deal.sellerId}`}
                                    </p>

                                    <div className="buyer-deal-card-footer">
                                        <div>
                                            <span>Winning price</span>
                                            <strong>{formatMoney(deal.finalPrice)}</strong>
                                        </div>
                                        <Link to={`/buyer/deals/${deal.dealId}`}>
                                            {needsAction ? "Review & Decide" : "View Deal"} →
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

function BuyerDealDetails() {
    const { dealId } = useParams();
    const [deal, setDeal] = useState(null);
    const [reason, setReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let cancelled = false;

        getBuyerDeal(dealId)
            .then((response) => {
                if (!cancelled) setDeal(response.data);
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(getErrorMessage(requestError, "Unable to load this deal."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [dealId]);

    const submitDecision = async (decision) => {
        if (decision === "reject" && !reason.trim()) {
            setError("Please provide a reason before rejecting the deal.");
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const response = await decideBuyerDeal(dealId, decision, reason.trim());
            const updatedDeal = response.data;
            setDeal(updatedDeal);
            setReason("");
            setShowRejectForm(false);

            if (decision === "reject") {
                setNotice("Deal rejected. Your reason has been recorded.");
            } else if (normalize(updatedDeal.dealStatus) === "completed") {
                setNotice("Deal completed. Both you and the seller have confirmed.");
            } else {
                setNotice("Your confirmation is recorded. Waiting for the seller to confirm.");
            }
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Unable to update this deal."));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="buyer-deal-details-page">
                <div className="buyer-deal-details-loading" aria-label="Loading deal" />
            </main>
        );
    }

    if (!deal) {
        return (
            <main className="buyer-deal-details-page">
                <Link className="buyer-deal-back" to="/buyer/deals">← Back to My Deals</Link>
                <section className="buyer-deals-message buyer-deals-error" role="alert">
                    <h2>Deal not found</h2>
                    <p>{error || "This deal is unavailable."}</p>
                </section>
            </main>
        );
    }

    const canDecide = normalize(deal.dealStatus) === "pending"
        && normalize(deal.buyerStatus) === "pending";

    return (
        <main className="buyer-deal-details-page">
            <Link className="buyer-deal-back" to="/buyer/deals">← Back to My Deals</Link>

            <header className="buyer-deal-details-header">
                <div>
                    <span className="buyer-deals-eyebrow">Deal #{deal.dealId}</span>
                    <h1>{deal.productName}</h1>
                    <p>Review the winning product, seller contact, and confirmation status.</p>
                </div>
                <StatusBadge status={deal.dealStatus} />
            </header>

            {notice && <p className="buyer-deal-notice" role="status">{notice}</p>}
            {error && <p className="buyer-deal-inline-error" role="alert">{error}</p>}

            <div className="buyer-deal-details-grid">
                <section className="buyer-deal-product-panel">
                    <div className="buyer-deal-product-image">
                        {deal.imageUrl ? (
                            <img src={deal.imageUrl} alt={deal.productName} />
                        ) : (
                            <span aria-hidden="true">Won</span>
                        )}
                    </div>

                    <div className="buyer-deal-product-copy">
                        <span>Room #{deal.roomId} · Product #{deal.productId}</span>
                        <h2>{deal.productName}</h2>
                        <p>{deal.productDescription || "No product description available."}</p>
                        <div className="buyer-winning-price">
                            <span>Winning price</span>
                            <strong>{formatMoney(deal.finalPrice)}</strong>
                        </div>
                    </div>
                </section>

                <aside className="buyer-seller-panel">
                    <span className="buyer-panel-label">Seller contact</span>
                    <h2>{deal.sellerName || `Seller #${deal.sellerId}`}</h2>
                    <div className="buyer-contact-list">
                        {deal.sellerEmail ? (
                            <a href={`mailto:${deal.sellerEmail}`}>{deal.sellerEmail}</a>
                        ) : (
                            <span>Email unavailable</span>
                        )}
                        {deal.sellerPhone ? (
                            <a href={`tel:${deal.sellerPhone}`}>{deal.sellerPhone}</a>
                        ) : (
                            <span>Phone unavailable</span>
                        )}
                    </div>
                    <p>Contact the seller and confirm only after agreeing on the arrangements.</p>
                </aside>
            </div>

            <section className="buyer-deal-progress">
                <div>
                    <span>Your decision</span>
                    <StatusBadge status={deal.buyerStatus} />
                </div>
                <div>
                    <span>Seller decision</span>
                    <StatusBadge status={deal.sellerStatus} />
                </div>
                <div>
                    <span>Overall deal</span>
                    <StatusBadge status={deal.dealStatus} />
                </div>
            </section>

            {deal.cancelReason && (
                <section className="buyer-cancel-reason">
                    <strong>Rejection reason</strong>
                    <p>{deal.cancelReason}</p>
                </section>
            )}

            {canDecide && (
                <section className="buyer-decision-panel">
                    <div className="buyer-decision-copy">
                        <span className="buyer-panel-label">Your decision</span>
                        <h2>Are you ready to complete this deal?</h2>
                        <p>Confirm the deal or reject it with a clear reason.</p>
                    </div>

                    {showRejectForm ? (
                        <div className="buyer-reject-form">
                            <label htmlFor="buyer-rejection-reason">Reason for rejection</label>
                            <textarea
                                id="buyer-rejection-reason"
                                rows="4"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Explain why you cannot proceed with this deal"
                                disabled={saving}
                                autoFocus
                            />
                            <div className="buyer-decision-actions">
                                <button
                                    type="button"
                                    className="buyer-button-secondary"
                                    disabled={saving}
                                    onClick={() => {
                                        setShowRejectForm(false);
                                        setReason("");
                                        setError("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="buyer-button-danger"
                                    disabled={saving}
                                    onClick={() => submitDecision("reject")}
                                >
                                    {saving ? "Submitting..." : "Submit Rejection"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="buyer-decision-actions">
                            <button
                                type="button"
                                className="buyer-button-secondary"
                                disabled={saving}
                                onClick={() => setShowRejectForm(true)}
                            >
                                Reject Deal
                            </button>
                            <button
                                type="button"
                                className="buyer-button-confirm"
                                disabled={saving}
                                onClick={() => submitDecision("confirm")}
                            >
                                {saving ? "Confirming..." : "Confirm Deal"}
                            </button>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}

export { BuyerDeals, BuyerDealDetails };
export default BuyerDeals;
