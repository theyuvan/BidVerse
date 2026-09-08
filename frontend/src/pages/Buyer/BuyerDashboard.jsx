import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBuyerId, saveBuyerId } from "../../services/buyerSession";
import { getAvailableRooms, getBuyerBookings, getBuyerDeals } from "../../services/buyerService";
import "./BuyerDashboard.css";

function BuyerDashboard() {
    const [buyerId, setBuyerId] = useState(getBuyerId());
    const [buyerIdInput, setBuyerIdInput] = useState(String(getBuyerId()));
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [wonDeals, setWonDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([getAvailableRooms(), getBuyerBookings(buyerId), getBuyerDeals(buyerId)])
            .then(([roomsResponse, bookingsResponse, dealsResponse]) => {
                if (cancelled) return;
                setRooms(roomsResponse.data);
                setBookings(bookingsResponse.data);
                setWonDeals(dealsResponse.data);
                setError("");
            })
            .catch(() => {
                if (!cancelled) setError("Unable to load buyer rooms.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [buyerId]);

    const changeBuyer = (event) => {
        event.preventDefault();
        const nextBuyerId = Number(buyerIdInput);

        if (!Number.isInteger(nextBuyerId) || nextBuyerId <= 0) {
            setError("Enter a valid buyer ID.");
            return;
        }

        saveBuyerId(nextBuyerId);
        setLoading(true);
        setBuyerId(nextBuyerId);
    };

    return (
        <main className="buyer-page">
            <header className="buyer-header">
                <div>
                    <h1>Buyer Auction Rooms</h1>
                    <p>Book a room, wait for the host, then bid live.</p>
                </div>

                <form className="buyer-switcher" onSubmit={changeBuyer}>
                    <label htmlFor="buyer-id">Testing as buyer</label>
                    <div>
                        <input
                            id="buyer-id"
                            type="number"
                            min="1"
                            value={buyerIdInput}
                            onChange={(event) => setBuyerIdInput(event.target.value)}
                        />
                        <button type="submit">Load</button>
                    </div>
                </form>
            </header>

            {error && <p className="form-error" role="alert">{error}</p>}

            <section className="buyer-section">
                <div className="section-heading">
                    <h2>My booked rooms</h2>
                    <span>{bookings.length} bookings</span>
                </div>

                {loading ? (
                    <p className="buyer-empty">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                    <p className="buyer-empty">You have not booked an auction room yet.</p>
                ) : (
                    <div className="rooms-grid">
                        {bookings.map((booking) => (
                            <article className="room-card" key={booking.roomSeatId}>
                                <span className={`buyer-room-status ${booking.roomStatus}`}>
                                    {booking.roomStatus}
                                </span>
                                <h3>{booking.roomTitle}</h3>
                                <p>Room #{booking.roomId}</p>
                                <p>{new Date(booking.startTime).toLocaleString()}</p>
                                <p>Advance paid: ₹{booking.advanceAmount}</p>
                                {booking.attendanceStatus === "missed" && (
                                    <p className="form-error">Entry missed. Advance forfeited.</p>
                                )}

                                {["waiting", "live", "upcoming", "open"].includes(booking.roomStatus) ? (
                                    <Link
                                        className="enter-room-link"
                                        to={`/buyer/rooms/${booking.roomId}/live`}
                                    >
                                        {booking.canJoin ? "Enter auction room" : "Open waiting page"}
                                    </Link>
                                ) : (
                                    <span className="room-complete-label">Auction finished</span>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="buyer-section">
                <div className="section-heading">
                    <h2>Products I won</h2>
                    <span>{wonDeals.length} sold products</span>
                </div>

                {loading ? (
                    <p className="buyer-empty">Loading won products...</p>
                ) : wonDeals.length === 0 ? (
                    <p className="buyer-empty">You have not won an auction product yet.</p>
                ) : (
                    <div className="won-deals-grid">
                        {wonDeals.map((deal) => (
                            <article className="won-deal-card" key={deal.dealId}>
                                {deal.imageUrl && <img src={deal.imageUrl} alt={deal.productName} />}
                                <div className="won-deal-content">
                                    <span className="buyer-room-status completed">Won · Room #{deal.roomId}</span>
                                    <h3>{deal.productName}</h3>
                                    <p>{deal.productDescription || "No product description available."}</p>
                                    <dl className="won-deal-details">
                                        <div><dt>Winning bid</dt><dd>₹{deal.finalPrice}</dd></div>
                                        <div><dt>Seller</dt><dd>{deal.sellerName || `Seller #${deal.sellerId}`}</dd></div>
                                        <div><dt>Email</dt><dd>{deal.sellerEmail || "Unavailable"}</dd></div>
                                        <div><dt>Phone</dt><dd>{deal.sellerPhone || "Unavailable"}</dd></div>
                                    </dl>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="buyer-section">
                <div className="section-heading">
                    <h2>Rooms available to book</h2>
                    <span>{rooms.length} rooms</span>
                </div>

                {loading ? (
                    <p className="buyer-empty">Loading rooms...</p>
                ) : rooms.length === 0 ? (
                    <p className="buyer-empty">No rooms are open for booking.</p>
                ) : (
                    <div className="rooms-grid">
                        {rooms.map((room) => (
                            <Link
                                key={room.roomId}
                                to={`/buyer/rooms/${room.roomId}`}
                                className="room-card"
                            >
                                <span className={`buyer-room-status ${room.status}`}>{room.status}</span>
                                <h3>{room.title}</h3>
                                <p>Room #{room.roomId}</p>
                                <p>Seats: {room.seatLimit}</p>
                                <p>Advance: ₹{room.advanceAmount}</p>
                                <p>{room.startTime
                                    ? new Date(room.startTime).toLocaleString()
                                    : "Start time not set"}</p>
                                <strong>View and book</strong>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default BuyerDashboard;
