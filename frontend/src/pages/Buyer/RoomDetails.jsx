import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getRoomDetails,
    getRoomCatalog,
    bookRoom,
    joinRoom
} from "../../services/buyerService";
import "./RoomDetails.css";

function RoomDetails() {

    const { roomId } = useParams();

    const [room, setRoom] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [booking, setBooking] = useState(false);
    const [bookingMessage, setBookingMessage] = useState("");
    const [liveItems, setLiveItems] = useState([]);
    const [joining, setJoining] = useState(false);

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

            // Temporary buyer ID
            const buyerId = 2;

            await bookRoom(roomId, buyerId);

            setBookingMessage("Room booked successfully.");

        } catch (error) {

            const responseData = error.response?.data;

            setError(
                typeof responseData === "string"
                    ? responseData
                    : responseData?.message || "Unable to book room."
            );

        } finally {

            setBooking(false);

        }
    };

    const handleJoinRoom = async () => {
        setJoining(true);
        setError("");
        try {
            const response = await joinRoom(roomId, 2);
            setLiveItems(response.data);
            setBookingMessage("You joined the live auction.");
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.message || "Unable to join the live auction.");
        } finally {
            setJoining(false);
        }
    };


    if (loading) {

        return (
            <main className="room-details-page">
                <p>Loading room details...</p>
            </main>
        );

    }


    if (error && !room) {

        return (
            <main className="room-details-page">
                <p className="form-error">
                    {error}
                </p>
            </main>
        );

    }


    if (!room) {

        return (
            <main className="room-details-page">
                <p>Room not found.</p>
            </main>
        );

    }


    const canBook =
        room.status?.toLowerCase() === "upcoming" ||
        room.status?.toLowerCase() === "open";


    return (
        <main className="room-details-page">

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
                    <button onClick={handleJoinRoom} disabled={joining}>
                        {joining ? "Joining..." : "Join live auction"}
                    </button>
                    {liveItems.length > 0 && (
                        <div className="assigned-product-list">
                            {liveItems.map((item) => (
                                <article className="assigned-product" key={item.auctionItemId}>
                                    <div>
                                        <h3>{item.productName}</h3>
                                        <p>{item.categoryName || "Uncategorized"} · Seller {item.sellerName || "Unknown"}</p>
                                    </div>
                                    <strong>₹{item.currentPrice}</strong>
                                </article>
                            ))}
                        </div>
                    )}
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