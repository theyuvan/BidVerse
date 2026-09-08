import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { decideDeal, getDeal } from "../../services/buyerService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel } from "../../components/layout/icons";
import "../shared.css";

export default function DealDetails() {
    const { dealId } = useParams();
    const [deal, setDeal] = useState(null);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        getDeal(dealId)
            .then((response) => { if (!cancelled) setDeal(response.data); })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load this deal.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
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
            const response = await decideDeal(dealId, decision, reason.trim());
            setDeal(response.data);
            setReason("");
            setMessage(decision === "confirm" ? "Your confirmation was submitted." : "The deal was rejected and cancelled.");
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to update this deal."));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="spinner-row">Loading deal...</p>;
    if (!deal) return <p className="alert alert-error">{error || "Deal not found."}</p>;

    const canDecide = deal.dealStatus?.toLowerCase() === "pending" && deal.buyerStatus?.toLowerCase() === "pending";

    return (
        <div>
            <Link className="back-link" to="/buyer/deals">← Back to deals</Link>

            <div className="page-head">
                <div>
                    <span className="eyebrow">Deal #{deal.dealId}</span>
                    <h1>{deal.productName}</h1>
                </div>
                <span className={`badge ${deal.dealStatus === "completed" ? "badge-success" : deal.dealStatus === "cancelled" ? "badge-danger" : "badge-warning"}`}>
                    {deal.dealStatus}
                </span>
            </div>

            <div className="detail-grid">
                <section className="card detail-media">
                    <div className="thumb">
                        {deal.imageUrl
                            ? <img src={deal.imageUrl} alt={deal.productName} />
                            : <span className="thumb-fallback"><IconGavel width={30} height={30} /></span>}
                    </div>
                    <p style={{ marginBottom: 14 }}>{deal.productDescription || "No description available."}</p>
                    <dl className="fact-list">
                        <div><dt>Winning price</dt><dd>₹{deal.finalPrice}</dd></div>
                        <div><dt>Your decision</dt><dd style={{ textTransform: "capitalize" }}>{deal.buyerStatus}</dd></div>
                        <div><dt>Seller decision</dt><dd style={{ textTransform: "capitalize" }}>{deal.sellerStatus}</dd></div>
                        <div><dt>Room</dt><dd>#{deal.roomId}</dd></div>
                    </dl>
                </section>

                <section className="card" style={{ padding: 20 }}>
                    <h2 style={{ fontSize: 16, marginBottom: 12 }}>Seller contact</h2>
                    <div className="contact-card">
                        <strong>{deal.sellerName || `Seller #${deal.sellerId}`}</strong>
                        <a href={`mailto:${deal.sellerEmail}`}>{deal.sellerEmail || "Email unavailable"}</a>
                        <a href={`tel:${deal.sellerPhone}`}>{deal.sellerPhone || "Phone unavailable"}</a>
                    </div>
                    {deal.cancelReason && (
                        <p className="alert alert-error" style={{ marginTop: 14 }}>
                            <strong>Rejection reason:</strong> {deal.cancelReason}
                        </p>
                    )}
                    <p style={{ marginTop: 14, fontSize: 13 }}>The deal completes only once both you and the seller confirm.</p>

                    {canDecide && (
                        <div style={{ marginTop: 20 }}>
                            <label className="field">
                                <span className="field-label">Rejection reason (required only if rejecting)</span>
                                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why you can't proceed" />
                            </label>
                            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                <button className="btn btn-danger" disabled={saving} onClick={() => submitDecision("reject")}>Reject deal</button>
                                <button className="btn btn-success" disabled={saving} onClick={() => submitDecision("confirm")}>Confirm deal</button>
                            </div>
                        </div>
                    )}
                    {message && <p className="alert alert-success" style={{ marginTop: 14 }}>{message}</p>}
                    {error && <p className="alert alert-error" style={{ marginTop: 14 }}>{error}</p>}
                </section>
            </div>
        </div>
    );
}
