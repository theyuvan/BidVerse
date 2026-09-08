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
    const [bookingMessage, setBookingMessage] = useState("");

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


    const handleBookRoom = async () => {

        setBooking(true);
        setError("");
        setBookingMessage("");

        try {

            await bookRoom(roomId, buyerId);

            setBookingMessage(`Room booked for buyer #${buyerId}. Return to buyer rooms to open the waiting room.`);

        } catch (error) {

            const responseData = error.response?.data;

            setError(
                typeof responseData === "string"
                    ? responseData
                    : responseData?.detail || responseData?.message || "Unable to book room."
            );

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

            <Link
                className="back-link"
                to="/buyer"
            >
                ← Back to Rooms
            </Link>


            {/* ROOM INFORMATION */}

            <header className="page-header">

                <h1>{room.title}</h1>

                <p>
                    Room #{room.roomId}
                </p>

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


            {/* BOOK ROOM */}

            {canBook && (

                <section className="booking-section">

                    <h2>Book This Room</h2>

                    <p>
                        Advance amount: ₹{room.advanceAmount}
                    </p>

                    <button
                        onClick={handleBookRoom}
                        disabled={booking}
                    >
                        {booking
                            ? "Booking..."
                            : "Book Room"}
                    </button>

                    {bookingMessage && (
                        <p
                            className="form-success"
                            role="status"
                        >
                            {bookingMessage}
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

                </section>

            )}

            {room.status?.toLowerCase() === "live" && (
                <section className="booking-section">
                    <h2>Live auction</h2>
                    <p>Enter as buyer #{buyerId} to watch the timer and place bids.</p>
                    <Link className="enter-room-link" to={`/buyer/rooms/${roomId}/live`}>
                        Enter live auction
                    </Link>
                </section>
            )}


            {/* PRODUCTS */}

            <section className="room-products-section">

                <div className="section-heading">

                    <h2>Products Available</h2>

                    <span>
                        {products.length} products
                    </span>

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
                                        Category:{" "}
                                        {product.categoryName}
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
