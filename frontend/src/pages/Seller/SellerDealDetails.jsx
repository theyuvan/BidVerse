import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { decideSellerDeal, getSellerDeal } from "../../services/sellerService";

function errorMessage(error, fallback) {
    const data = error.response?.data;
    return typeof data === "string" ? data : data?.detail || data?.message || fallback;
}

function SellerDealDetails() {
    const { dealId } = useParams();
    const navigate = useNavigate();
    const [deal, setDeal] = useState(null);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        getSellerDeal(dealId)
            .then((response) => {
                if (!cancelled) setDeal(response.data);
            })
            .catch((requestError) => {
                if (!cancelled) setError(errorMessage(requestError, "Unable to load deal details."));
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
            const response = await decideSellerDeal(dealId, decision, reason.trim());
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

    const canDecide = deal.status?.toLowerCase() === "pending"
        && deal.sellerStatus?.toLowerCase() === "pending";

    return (
        <main className="seller-page deal-details-page">
            <Link className="back-link" to="/seller/deals">Back to Deals</Link>
            <header className="page-header seller-page-header">
                <div>
                    <span className="eyebrow">Deal #{deal.dealId}</span>
                    <h1>{deal.productName || "Deal details"}</h1>
                    <p>Confirm only after you are satisfied with the buyer conversation and delivery arrangements.</p>
                </div>
                <span className={`deal-status deal-status-${deal.status?.toLowerCase()}`}>{deal.status}</span>
            </header>

            <div className="deal-details-grid">
                <section className="deal-product-panel">
                    {deal.imageUrl
                        ? <img className="deal-product-image" src={deal.imageUrl} alt={deal.productName} />
                        : <div className="product-art" aria-hidden="true">⌂</div>}
                    <div>
                        <span className="product-id">Auction item #{deal.auctionItemId} · Room #{deal.roomId}</span>
                        <h2>{deal.productName || "Winning auction deal"}</h2>
                        <p>{deal.productDescription || "No product description available."}</p>
                    </div>
                    <dl className="deal-facts">
                        <div><dt>Final price</dt><dd>₹{deal.finalPrice}</dd></div>
                        <div><dt>Your decision</dt><dd>{deal.sellerStatus}</dd></div>
                        <div><dt>Buyer decision</dt><dd>{deal.buyerStatus}</dd></div>
                        <div><dt>Overall deal</dt><dd>{deal.status}</dd></div>
                    </dl>
                </section>

                <section className="deal-progress-panel">
                    <h2>Buyer contact details</h2>
                    <div className="deal-contact-card">
                        <strong>{deal.buyerName || `Buyer #${deal.buyerId}`}</strong>
                        <a href={`mailto:${deal.buyerEmail}`}>{deal.buyerEmail || "Email unavailable"}</a>
                        <a href={`tel:${deal.buyerPhone}`}>{deal.buyerPhone || "Phone unavailable"}</a>
                    </div>
                    {deal.cancelReason && <p className="deal-cancel-reason"><strong>Rejection reason:</strong> {deal.cancelReason}</p>}
                    <p>The deal completes only after both seller and buyer confirm.</p>
                </section>
            </div>

            {canDecide && (
                <section className="deal-decision-panel">
                    <label htmlFor="seller-rejection-reason">Rejection reason <span>(required only when rejecting)</span></label>
                    <textarea id="seller-rejection-reason" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why you cannot proceed with this deal" />
                    <div className="deal-actions">
                        <button className="button-danger" type="button" disabled={saving} onClick={() => submitDecision("reject")}>Reject deal</button>
                        <button className="button-success" type="button" disabled={saving} onClick={() => submitDecision("confirm")}>Confirm deal</button>
                    </div>
                </section>
            )}
            {message && <p className="form-success" role="status">{message}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {!canDecide && <button className="secondary-button" type="button" onClick={() => navigate("/seller/deals")}>Return to deals</button>}
        </main>
    );
}

export default SellerDealDetails;
