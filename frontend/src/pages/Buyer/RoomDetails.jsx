import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getRoomDetails,
    getRoomCatalog,
    bookRoom
} from "../../services/buyerService";
import { getBuyerId } from "../../services/buyerSession";
import "./RoomDetails.css";

function RoomDetails() {

    const { roomId } = useParams();
    const buyerId = getBuyerId();

    const [room, setRoom] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [booking, setBooking] = useState(false);
    const [booked, setBooked] = useState(false);
    const [bookingNotice, setBookingNotice] = useState(null);

    useEffect(() => {

        const fetchRoomData = async () => {

            try {

                const [roomResponse, productsResponse] = await Promise.all([
                    getRoomDetails(roomId),
                    getRoomCatalog(roomId),
                ]);

                setRoom(roomResponse.data);
                setProducts(productsResponse.data);

            } catch {

                setError("Unable to load room details.");

            } finally {

                setLoading(false);

            }
        };

        fetchRoomData();

    }, [roomId]);

    useEffect(() => {
        if (!bookingNotice) return undefined;

        const timeoutId = window.setTimeout(() => {
            setBookingNotice(null);
        }, 5000);

        return () => window.clearTimeout(timeoutId);
    }, [bookingNotice]);


    const handleBookRoom = async () => {

        setBooking(true);
        setBookingNotice(null);

        try {

            await bookRoom(roomId);

            setBooked(true);
            setBookingNotice({
                type: "success",
                message: "Room booked successfully. You can open it from your booked rooms."
            });

        } catch (error) {

            const responseData = error.response?.data;

            const message = typeof responseData === "string"
                ? responseData
                : responseData?.detail || responseData?.message;

            setBookingNotice({
                type: "error",
                message: message || "Unable to book this room. Please try again."
            });

        } finally {

            setBooking(false);

        }
    };

    if (loading) {

        return (
            <main className="buyer-room-details-page">
                <p>Loading room details...</p>
            </main>
        );

    }


    if (error && !room) {

        return (
            <main className="buyer-room-details-page">
                <p className="form-error">
                    {error}
                </p>
            </main>
        );

    }


    if (!room) {

        return (
            <main className="buyer-room-details-page">
                <p>Room not found.</p>
            </main>
        );

    }


    const canBook =
        room.status?.toLowerCase() === "upcoming" ||
        room.status?.toLowerCase() === "open";


    return (
        <main className="buyer-room-details-page">

            {bookingNotice && (
                <div
                    className={`booking-toast booking-toast-${bookingNotice.type}`}
                    role={bookingNotice.type === "error" ? "alert" : "status"}
                    aria-live="polite"
                >
                    <span className="booking-toast-icon" aria-hidden="true">
                        {bookingNotice.type === "success" ? "✓" : "!"}
                    </span>
                    <div>
                        <strong>
                            {bookingNotice.type === "success" ? "Booking confirmed" : "Booking failed"}
                        </strong>
                        <p>{bookingNotice.message}</p>
                    </div>
                    <button
                        type="button"
                        className="booking-toast-close"
                        aria-label="Close notification"
                        onClick={() => setBookingNotice(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            <Link
                className="back-link"
                to="/buyer/rooms"
            >
                ← Back to Rooms
            </Link>


            <header className="page-header room-detail-hero">
                <div>
                    <span className="room-detail-eyebrow">Auction room #{room.roomId}</span>
                    <h1>{room.title}</h1>
                    <p>Review the auction schedule and products before reserving your seat.</p>
                </div>
                <span className={`room-detail-status ${room.status?.toLowerCase()}`}>
                    {room.status}
                </span>
            </header>


            <section className="room-summary">

                <div>
                    <strong>Room ID</strong>
                    <span>{room.roomId}</span>
                </div>

                <div>
                    <strong>Host ID</strong>
                    <span>{room.hostId}</span>
                </div>

                <div>
                    <strong>Seats</strong>
                    <span>{room.seatLimit}</span>
                </div>

                <div>
                    <strong>Advance</strong>
                    <span>₹{room.advanceAmount}</span>
                </div>

                <div>
                    <strong>Status</strong>
                    <span>{room.status}</span>
                </div>

                <div>
                    <strong>Start Time</strong>

                    <span>
                        {room.startTime
                            ? new Date(room.startTime).toLocaleString()
                            : "Not scheduled"}
                    </span>

                </div>

            </section>



            {canBook && (

                <section className="booking-section">

                    <div>
                        <span className="room-detail-eyebrow">Seat reservation</span>
                        <h2>Book This Room</h2>
                        <p>Secure your seat with an advance of ₹{room.advanceAmount}.</p>
                    </div>

                    <button
                        onClick={handleBookRoom}
                        disabled={booking || booked}
                        className={booked ? "book-room-button booked" : "book-room-button"}
                    >
                        {booking ? "Booking..." : booked ? "✓ Booked Successfully" : "Book Room"}
                    </button>

                </section>

            )}

            {["waiting", "live"].includes(room.status?.toLowerCase()) && (
                <section className="booking-section live-entry-panel">
                    <div>
                        <span className="room-detail-eyebrow">Ready to enter</span>
                        <h2>{room.status?.toLowerCase() === "waiting" ? "Waiting Room Is Open" : "Auction Is Live"}</h2>
                        <p>Join as buyer #{buyerId} and take your place in the auction.</p>
                    </div>
                    <Link className="enter-room-link" to={`/buyer/rooms/${roomId}/live`}>
                        Enter Auction Room →
                    </Link>
                </section>
            )}



            <section className="room-products-section">

                <div className="section-heading">
                    <div>
                        <span className="room-detail-eyebrow">Auction catalogue</span>
                        <h2>Products Available</h2>
                    </div>
                </div>


                {products.length === 0 ? (

                    <p className="empty-state">
                        No products are available in this room.
                    </p>

                ) : (

                    <div className="assigned-product-list">

                        {products.map((product) => (

                            <article
                                className="assigned-product"
                                key={product.auctionItemId}
                            >

                                {product.imageUrl && (
                                    <img src={product.imageUrl} alt={product.productName} />
                                )}

                                <div>

                                    <h3>
                                        {product.productName}
                                    </h3>

                                    <p>
                                        {product.description ||
                                            "No description available."}
                                    </p>

                                    <p>
                                        <span className="product-category">{product.categoryName}</span>
                                    </p>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}

export default RoomDetails;
