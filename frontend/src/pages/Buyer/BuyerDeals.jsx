import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getAuthUser } from "../../services/authSession";
import {
    getBuyerDeals,
    getBuyerDeal,
    decideBuyerDeal
} from "../../services/buyerService";

import "./BuyerDeals.css";

function errorMessage(error, fallback) {
    const data = error.response?.data;

    return typeof data === "string"
        ? data
        : data?.detail || data?.message || fallback;
}


// ===============================
// MY DEALS PAGE
// ===============================

function BuyerDeals() {
    const user = getAuthUser();

    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getBuyerDeals()
            .then((response) => {
                if (!cancelled) {
                    setDeals(response.data);
                }
            })
            .catch((requestError) => {
                if (cancelled) return;

                const data = requestError.response?.data;

                setError(
                    data?.detail ||
                    data?.message ||
                    "Unable to load your deals."
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="seller-page deal-details-page">

            <header className="page-header seller-page-header">
                <span className="eyebrow">
                    Signed in as {user?.name || "Buyer"}
                </span>

                <h1>My deals</h1>

                <p>
                    Review products you won and confirm the deal
                    after speaking with the seller.
                </p>
            </header>

            {loading && (
                <p className="empty-state">
                    Loading your deals...
                </p>
            )}

            {!loading && error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}

            {!loading && !error && deals.length === 0 && (
                <p className="empty-state">
                    You have not won any products yet.
                </p>
            )}

            {!loading && !error && deals.length > 0 && (
                <section
                    className="deal-list"
                    aria-label="Buyer deals"
                >
                    {deals.map((deal) => (
                        <Link
                            className="deal-list-card"
                            to={`/buyer/deals/${deal.dealId}`}
                            key={deal.dealId}
                        >
                            <div>
                                <span className="product-id">
                                    Deal #{deal.dealId}
                                    {" · "}
                                    Room #{deal.roomId}
                                </span>

                                <h2>{deal.productName}</h2>

                                <p>
                                    Seller:{" "}
                                    {deal.sellerName ||
                                        `#${deal.sellerId}`}
                                </p>
                            </div>

                            <div className="deal-list-summary">
                                <strong>
                                    ₹{deal.finalPrice}
                                </strong>

                                <span
                                    className={`deal-status deal-status-${deal.dealStatus?.toLowerCase()}`}
                                >
                                    {deal.dealStatus}
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>
            )}

        </main>
    );
}


// ===============================
// DEAL DETAILS PAGE
// ===============================

function BuyerDealDetails() {

    const { dealId } = useParams();

    const [deal, setDeal] = useState(null);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {

        let cancelled = false;

        getBuyerDeal(dealId)
            .then((response) => {
                if (!cancelled) {
                    setDeal(response.data);
                }
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(
                        errorMessage(
                            requestError,
                            "Unable to load this deal."
                        )
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };

    }, [dealId]);


    const submitDecision = async (decision) => {

        if (decision === "reject" && !reason.trim()) {
            setError(
                "Please provide a reason before rejecting the deal."
            );
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {

            const response = await decideBuyerDeal(
                dealId,
                decision,
                reason.trim()
            );

            setDeal(response.data);
            setReason("");

            setMessage(
                decision === "confirm"
                    ? "Your confirmation was submitted."
                    : "The deal was rejected and cancelled."
            );

        } catch (requestError) {

            setError(
                errorMessage(
                    requestError,
                    "Unable to update this deal."
                )
            );

        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <main className="seller-page">
                <p className="empty-state">
                    Loading deal...
                </p>
            </main>
        );
    }


    if (!deal) {
        return (
            <main className="seller-page">
                <p className="form-error">
                    {error || "Deal not found."}
                </p>
            </main>
        );
    }


    const canDecide =
        deal.dealStatus?.toLowerCase() === "pending" &&
        deal.buyerStatus?.toLowerCase() === "pending";


    return (
        <main className="seller-page deal-details-page">

            <Link
                className="back-link"
                to="/buyer/deals"
            >
                ← Back to My Deals
            </Link>


            <header className="page-header seller-page-header">

                <span className="eyebrow">
                    Deal #{deal.dealId}
                </span>

                <h1>{deal.productName}</h1>

                <p>
                    Confirm only after you are satisfied with
                    the seller conversation and product arrangements.
                </p>

            </header>


            <div className="deal-details-grid">

                <section className="deal-product-panel">

                    {deal.imageUrl ? (

                        <img
                            className="deal-product-image"
                            src={deal.imageUrl}
                            alt={deal.productName}
                        />

                    ) : (

                        <div
                            className="product-art"
                            aria-hidden="true"
                        >
                            ⌂
                        </div>

                    )}


                    <div>

                        <span className="product-id">
                            Room #{deal.roomId}
                            {" · "}
                            Product #{deal.productId}
                        </span>

                        <h2>{deal.productName}</h2>

                        <p>
                            {deal.productDescription ||
                                "No description available."}
                        </p>

                    </div>


                    <dl className="deal-facts">

                        <div>
                            <dt>Winning price</dt>
                            <dd>₹{deal.finalPrice}</dd>
                        </div>

                        <div>
                            <dt>Your decision</dt>
                            <dd>{deal.buyerStatus}</dd>
                        </div>

                        <div>
                            <dt>Seller decision</dt>
                            <dd>{deal.sellerStatus}</dd>
                        </div>

                        <div>
                            <dt>Overall deal</dt>
                            <dd>{deal.dealStatus}</dd>
                        </div>

                    </dl>

                </section>


                <section className="deal-progress-panel">

                    <h2>Seller contact details</h2>

                    <div className="deal-contact-card">

                        <strong>
                            {deal.sellerName ||
                                `Seller #${deal.sellerId}`}
                        </strong>

                        {deal.sellerEmail ? (
                            <a href={`mailto:${deal.sellerEmail}`}>
                                {deal.sellerEmail}
                            </a>
                        ) : (
                            <span>Email unavailable</span>
                        )}

                        {deal.sellerPhone ? (
                            <a href={`tel:${deal.sellerPhone}`}>
                                {deal.sellerPhone}
                            </a>
                        ) : (
                            <span>Phone unavailable</span>
                        )}

                    </div>


                    {deal.cancelReason && (
                        <p className="deal-cancel-reason">
                            <strong>
                                Rejection reason:
                            </strong>{" "}
                            {deal.cancelReason}
                        </p>
                    )}


                    <p>
                        The deal completes only after both
                        buyer and seller confirm.
                    </p>

                </section>

            </div>


            {canDecide && (

                <section className="deal-decision-panel">

                    <label htmlFor="buyer-rejection-reason">
                        Rejection reason{" "}
                        <span>
                            (required only when rejecting)
                        </span>
                    </label>


                    <textarea
                        id="buyer-rejection-reason"
                        rows="3"
                        value={reason}
                        onChange={(event) =>
                            setReason(event.target.value)
                        }
                        placeholder="Explain why you cannot proceed with this deal"
                    />


                    <div className="deal-actions">

                        <button
                            className="button-danger"
                            type="button"
                            disabled={saving}
                            onClick={() =>
                                submitDecision("reject")
                            }
                        >
                            {saving
                                ? "Processing..."
                                : "Reject deal"}
                        </button>


                        <button
                            className="button-success"
                            type="button"
                            disabled={saving}
                            onClick={() =>
                                submitDecision("confirm")
                            }
                        >
                            {saving
                                ? "Processing..."
                                : "Confirm deal"}
                        </button>

                    </div>

                </section>

            )}


            {message && (
                <p
                    className="form-success"
                    role="status"
                >
                    {message}
                </p>
            )}


            {error && (
                <p
                    className="form-error"
                    role="alert"
                >
                    {error}
                </p>
            )}

        </main>
    );
}


// ===============================
// EXPORTS
// ===============================

export {
    BuyerDeals,
    BuyerDealDetails
};

export default BuyerDeals;