import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { decideBuyerDeal, getBuyerDeal } from "../../services/buyerService";

function errorMessage(error, fallback) {
    const data = error.response?.data;
    return typeof data === "string" ? data : data?.detail || data?.message || fallback;
}

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
                if (!cancelled) setDeal(response.data);
            })
            .catch((requestError) => {
                if (!cancelled) setError(errorMessage(requestError, "Unable to load this deal."));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [dealId]);

    const submitDecision = async (decision) => {
        if (decision === "reject" && !reason.trim()) {
            setError("Please provide a reason before rejecting the deal.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");
        try {
            const response = await decideBuyerDeal(dealId, decision, reason.trim());
            setDeal(response.data);
            setReason("");
            setMessage(decision === "confirm"
                ? "Your confirmation was submitted."
                : "The deal was rejected and cancelled.");
        } catch (requestError) {
            setError(errorMessage(requestError, "Unable to update this deal."));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <main className="seller-page"><p className="empty-state">Loading deal...</p></main>;
    if (!deal) return <main className="seller-page"><p className="form-error">{error || "Deal not found."}</p></main>;

    const canDecide = deal.dealStatus?.toLowerCase() === "pending"
        && deal.buyerStatus?.toLowerCase() === "pending";

    return (
        <main className="seller-page deal-details-page">
            <Link className="back-link" to="/buyer/deals">Back to My Deals</Link>
            <header className="page-header seller-page-header">
                <span className="eyebrow">Deal #{deal.dealId}</span>
                <h1>{deal.productName}</h1>
                <p>Confirm only after you are satisfied with the seller conversation and product arrangements.</p>
            </header>

            <div className="deal-details-grid">
                <section className="deal-product-panel">
                    {deal.imageUrl
                        ? <img className="deal-product-image" src={deal.imageUrl} alt={deal.productName} />
                        : <div className="product-art" aria-hidden="true">⌂</div>}
                    <div>
                        <span className="product-id">Room #{deal.roomId} · Product #{deal.productId}</span>
                        <h2>{deal.productName}</h2>
                        <p>{deal.productDescription || "No description available."}</p>
                    </div>
                    <dl className="deal-facts">
                        <div><dt>Winning price</dt><dd>₹{deal.finalPrice}</dd></div>
                        <div><dt>Your decision</dt><dd>{deal.buyerStatus}</dd></div>
                        <div><dt>Seller decision</dt><dd>{deal.sellerStatus}</dd></div>
                        <div><dt>Overall deal</dt><dd>{deal.dealStatus}</dd></div>
                    </dl>
                </section>

                <section className="deal-progress-panel">
                    <h2>Seller contact details</h2>
                    <div className="deal-contact-card">
                        <strong>{deal.sellerName || `Seller #${deal.sellerId}`}</strong>
                        <a href={`mailto:${deal.sellerEmail}`}>{deal.sellerEmail || "Email unavailable"}</a>
                        <a href={`tel:${deal.sellerPhone}`}>{deal.sellerPhone || "Phone unavailable"}</a>
                    </div>
                    {deal.cancelReason && <p className="deal-cancel-reason"><strong>Rejection reason:</strong> {deal.cancelReason}</p>}
                    <p>The deal completes only after both buyer and seller confirm.</p>
                </section>
            </div>

            {canDecide && (
                <section className="deal-decision-panel">
                    <label htmlFor="buyer-rejection-reason">Rejection reason <span>(required only when rejecting)</span></label>
                    <textarea id="buyer-rejection-reason" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why you cannot proceed with this deal" />
                    <div className="deal-actions">
                        <button className="button-danger" type="button" disabled={saving} onClick={() => submitDecision("reject")}>Reject deal</button>
                        <button className="button-success" type="button" disabled={saving} onClick={() => submitDecision("confirm")}>Confirm deal</button>
                    </div>
                </section>
            )}
            {message && <p className="form-success" role="status">{message}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
        </main>
    );
}

export default BuyerDealDetails;
