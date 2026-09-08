import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBookings } from "../../services/buyerService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel } from "../../components/layout/icons";
import "../shared.css";

const TABS = [
    { key: "live", label: "Live" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" }
];

function bucketOf(roomStatus) {
    const status = roomStatus?.toLowerCase();
    if (status === "live") return "live";
    if (status === "completed") return "completed";
    return "upcoming"; // upcoming, open, waiting
}

export default function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [tab, setTab] = useState("live");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getBookings()
            .then((response) => { if (!cancelled) setBookings(response.data); })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load your bookings.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const grouped = useMemo(() => {
        const buckets = { live: [], upcoming: [], completed: [] };
        bookings.forEach((booking) => buckets[bucketOf(booking.roomStatus)].push(booking));
        return buckets;
    }, [bookings]);

    const visible = grouped[tab] || [];

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">My bookings</span>
                    <h1>Bookings</h1>
                    <p>Every room you've reserved a seat in, grouped by where it stands right now.</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 22 }}>
                {TABS.map(({ key, label }) => (
                    <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                        {label} <span style={{ opacity: 0.7 }}>({grouped[key]?.length ?? 0})</span>
                    </button>
                ))}
            </div>

            {error && <p className="alert alert-error" role="alert">{error}</p>}

            {loading ? (
                <p className="spinner-row">Loading bookings...</p>
            ) : visible.length === 0 ? (
                <div className="empty-state">Nothing here yet.</div>
            ) : (
                <div className="stack">
                    {visible.map((booking) => (
                        <article className="card booking-card" key={booking.roomSeatId}>
                            <div className="thumb">
                                <span className="thumb-fallback"><IconGavel width={22} height={22} /></span>
                            </div>
                            <div className="booking-card-body">
                                <h3>{booking.roomTitle}</h3>
                                <div className="booking-card-meta">
                                    <span>Room #{booking.roomId}</span>
                                    <span>{new Date(booking.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                                    <span>Advance ₹{booking.advanceAmount}</span>
                                </div>
                            </div>
                            <span className={`badge ${bucketOf(booking.roomStatus) === "live" ? "badge-danger" : bucketOf(booking.roomStatus) === "completed" ? "badge-neutral" : "badge-info"}`}>
                                {booking.roomStatus}
                            </span>
                            {booking.canJoin ? (
                                <Link className="btn btn-primary btn-sm" to={`/buyer/rooms/${booking.roomId}/live`}>Enter room</Link>
                            ) : bucketOf(booking.roomStatus) === "completed" ? (
                                <span className="badge badge-neutral">Finished</span>
                            ) : (
                                <Link className="btn btn-ghost btn-sm" to={`/buyer/rooms/${booking.roomId}`}>View room</Link>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
