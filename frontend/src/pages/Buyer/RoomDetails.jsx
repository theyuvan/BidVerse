import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRoomDetails, getRoomCatalog, bookRoom } from "../../services/buyerService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel } from "../../components/layout/icons";
import "../shared.css";

export default function RoomDetails() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [booking, setBooking] = useState(false);
    const [bookingMessage, setBookingMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([getRoomDetails(roomId), getRoomCatalog(roomId)])
            .then(([roomResponse, productsResponse]) => {
                if (cancelled) return;
                setRoom(roomResponse.data);
                setProducts(productsResponse.data);
            })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load room details.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [roomId]);

    const handleBookRoom = async () => {
        setBooking(true);
        setError("");
        setBookingMessage("");
        try {
            await bookRoom(roomId);
            setBookingMessage("Seat booked! You'll be able to join once the room opens.");
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to book this room."));
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <p className="spinner-row">Loading room details...</p>;
    if (error && !room) return <p className="alert alert-error">{error}</p>;
    if (!room) return <p className="empty-state">Room not found.</p>;

    const status = room.status?.toLowerCase();
    const canBook = ["upcoming", "open", "waiting", "live"].includes(status);
    const canEnterLive = ["waiting", "live"].includes(status);

    return (
        <div>
            <Link className="back-link" to="/buyer/rooms">← Back to rooms</Link>

            <div className="page-head">
                <div>
                    <span className="eyebrow">Room #{room.roomId}</span>
                    <h1>{room.title}</h1>
                </div>
                <span className={`badge ${status === "live" ? "badge-danger" : "badge-info"}`}>{room.status}</span>
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <dl className="fact-list">
                    <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                    <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                    <div><dt>Status</dt><dd style={{ textTransform: "capitalize" }}>{room.status}</dd></div>
                    <div><dt>Start time</dt><dd>{room.startTime ? new Date(room.startTime).toLocaleString() : "Not scheduled"}</dd></div>
                </dl>
            </div>

            {canBook && (
                <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                    <div>
                        <h2 style={{ fontSize: 16, marginBottom: 4 }}>Book your seat</h2>
                        <p>Reserve a seat in this room to join and bid once it opens.</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleBookRoom} disabled={booking}>
                        {booking ? "Booking..." : "Book this room"}
                    </button>
                </div>
            )}
            {bookingMessage && <p className="alert alert-success" role="status">{bookingMessage}</p>}
            {error && <p className="alert alert-error" role="alert">{error}</p>}

            {canEnterLive && (
                <div className="card" style={{ padding: 20, marginBottom: 24, borderColor: "var(--accent)" }}>
                    <h2 style={{ fontSize: 16, marginBottom: 4 }}>
                        {status === "waiting" ? "Waiting room is open" : "Bidding is live"}
                    </h2>
                    <p style={{ marginBottom: 12 }}>Already booked a seat? Join to record your attendance and start bidding.</p>
                    <button className="btn btn-primary" onClick={() => navigate(`/buyer/rooms/${roomId}/live`)}>
                        Enter auction room
                    </button>
                </div>
            )}

            <div className="section-block">
                <div className="section-block-head">
                    <h2>Products in this room</h2>
                    <span>{products.length} products</span>
                </div>

                {products.length === 0 ? (
                    <div className="empty-state">No products have been added to this room yet.</div>
                ) : (
                    <div className="grid-cards">
                        {products.map((product) => (
                            <article className="card" style={{ padding: 14 }} key={product.auctionItemId}>
                                <div className="thumb" style={{ marginBottom: 12 }}>
                                    {product.imageUrl
                                        ? <img src={product.imageUrl} alt={product.productName} />
                                        : <span className="thumb-fallback"><IconGavel width={26} height={26} /></span>}
                                </div>
                                <h3 style={{ fontSize: 15, marginBottom: 4 }}>{product.productName}</h3>
                                <p style={{ fontSize: 13, marginBottom: 8 }}>{product.description || "No description available."}</p>
                                <div className="room-card-meta">
                                    <span>Category <strong>{product.categoryName}</strong></span>
                                    <span>Base price <strong>₹{product.basePrice}</strong></span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
