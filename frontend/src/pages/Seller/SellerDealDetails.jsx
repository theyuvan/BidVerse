import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { decideSellerDeal, getSellerDeal } from "../../services/sellerService";
import "./SellerDealDetails.css";
function formatDate(value) {
    return value ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }) : "-";
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
                if (cancelled) return;
                const responseData = requestError.response?.data;
                setError(typeof responseData === "string"
                    ? responseData
                    : responseData?.message || "Unable to load deal details.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [dealId]);

    const handleDecision = async (decision) => {
        if (decision === "reject" && !reason.trim()) {
            setError("Please add a reason before cancelling the deal.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");
        try {
            const response = await decideSellerDeal(dealId, decision, reason.trim());
            setDeal(response.data);
            setReason("");
            setMessage(decision === "accept" ? "Deal confirmed successfully." : "Deal cancelled successfully.");
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.message || "Unable to update this deal.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <main className="host-page seller-page"><p className="empty-state">Loading deal details...</p></main>;
    if (!deal) return <main className="host-page seller-page"><p className="form-error" role="alert">{error || "Deal not found."}</p></main>;

    const isPending = deal.status?.toLowerCase() === "pending";
    const isConfirmed = deal.status?.toLowerCase() === "confirmed";

    return (
        <main className="host-page seller-page deal-details-page">
            <Link className="back-link" to="/seller/deals">Back to Deals</Link>
            <header className="page-header seller-page-header">
                <span className="eyebrow">Deal #{deal.dealId}</span>
                <h1>Deal details</h1>
                <p>Verify the buyer's winning offer before completing the sale.</p>
            </header>

            <div className="deal-details-grid">
                <section className="deal-product-panel">
                    <div className="product-art" aria-hidden="true">⌂</div>
                    <div>
                        <span className="product-id">Auction item #{deal.auctionItemId}</span>
                        <h2>Winning auction deal</h2>
                        <p>Buyer #{deal.buyerId} placed the final offer for this item.</p>
                    </div>
                    <dl className="deal-facts">
                        <div><dt>Final price</dt><dd>₹{deal.finalPrice}</dd></div>
                        <div><dt>Buyer ID</dt><dd>#{deal.buyerId}</dd></div>
                        <div><dt>Seller ID</dt><dd>#{deal.sellerId}</dd></div>
                    </dl>
                </section>

                <section className="deal-progress-panel">
                    <div className="advance-status">
                        <span>Advance status</span>
                        <strong>{isConfirmed ? "The buyer's advance is released." : "The buyer's advance is currently on hold."}</strong>
                        <p>{isConfirmed ? "The deal has been confirmed." : "It will be released once the deal is confirmed."}</p>
                    </div>
                    <h2>Deal progress</h2>
                    <ol className="deal-progress">
                        <li className="complete"><span>✓</span><strong>Product sold</strong><time>{formatDate(deal.createdAt)}</time></li>
                        <li className="complete"><span>✓</span><strong>Contact shared</strong><time>{formatDate(deal.createdAt)}</time></li>
                        <li className={isPending ? "active" : "complete"}><span>{isPending ? "◷" : "✓"}</span><strong>Deal in progress</strong><time>{isPending ? "-" : formatDate(deal.updatedAt)}</time></li>
                        <li className={isConfirmed ? "complete" : "pending"}><span>{isConfirmed ? "✓" : "○"}</span><strong>Deal confirmed</strong><time>{isConfirmed ? formatDate(deal.updatedAt) : "-"}</time></li>
                    </ol>
                </section>
            </div>

            {isPending && (
                <section className="deal-decision-panel">
                    <label htmlFor="cancel-reason">Cancellation reason <span>(required only to cancel)</span></label>
                    <textarea id="cancel-reason" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this deal cannot be completed" />
                    <div className="deal-actions">
                        <button className="button-danger" type="button" disabled={saving} onClick={() => handleDecision("reject")}>{saving ? "Updating..." : "Cancel deal"}</button>
                        <button className="button-success" type="button" disabled={saving} onClick={() => handleDecision("accept")}>{saving ? "Updating..." : "Confirm deal"}</button>
                    </div>
                </section>
            )}
            {message && <p className="form-success" role="status">{message}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {!isPending && <button className="secondary-button" type="button" onClick={() => navigate("/seller/deals")}>Return to deals</button>}
        </main>
    );
}

export default SellerDealDetails;
