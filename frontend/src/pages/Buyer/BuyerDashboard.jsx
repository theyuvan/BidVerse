import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBuyerId, saveBuyerId } from "../../services/buyerSession";
import {
    getAvailableRooms,
    getBuyerBookings,
    getBuyerDeals
} from "../../services/buyerService";
import "./BuyerDashboard.css";
function BuyerDashboard() {
    const { buyerId: urlBuyerId } = useParams();
    const isBookingRoomsPage = !urlBuyerId;
    const [buyerId, setBuyerId] = useState(
        urlBuyerId ? Number(urlBuyerId) : getBuyerId()
    );
    const [buyerIdInput, setBuyerIdInput] = useState(
        String(urlBuyerId ? Number(urlBuyerId) : getBuyerId())
    );

    const [username, setUsername] = useState("User");

    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [wonDeals, setWonDeals] = useState([]);

    // Full dashboard starts with All
    const [activeTab, setActiveTab] = useState("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    /* =========================
       FETCH USERNAME
    ========================= */

    const fetchBuyerName = async (id) => {
        try {
            /*
             * Replace this URL with your existing
             * user API endpoint.
             *
             * Example:
             * GET /users/{id}
             */

            const response = await fetch(
                `http://localhost:8080/users/${id}`
            );

            if (!response.ok) {
                throw new Error("Unable to fetch user");
            }

            const user = await response.json();

            setUsername(
                user.name ||
                user.username ||
                `User ${id}`
            );

        } catch (err) {
            console.error("Unable to fetch buyer name:", err);

            // Fallback
            setUsername(`User ${id}`);
        }
    };


    /* =========================
       LOAD BUYER DATA
    ========================= */

    useEffect(() => {
        let cancelled = false;

        setLoading(true);

        if (buyerId) {
            fetchBuyerName(buyerId);
        }

        Promise.all([
            getAvailableRooms(),
            getBuyerBookings(buyerId),
            getBuyerDeals(buyerId)
        ])
            .then(([roomsResponse, bookingsResponse, dealsResponse]) => {

                if (cancelled) return;

                setRooms(roomsResponse.data);
                setBookings(bookingsResponse.data);
                setWonDeals(dealsResponse.data);
                setError("");
            })
            .catch(() => {

                if (!cancelled) {
                    setError("Unable to load buyer rooms.");
                }
            })
            .finally(() => {

                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };

    }, [buyerId]);


    /* =========================
       CHANGE BUYER
    ========================= */

    const changeBuyer = (event) => {

        event.preventDefault();

        const nextBuyerId = Number(buyerIdInput);

        if (
            !Number.isInteger(nextBuyerId) ||
            nextBuyerId <= 0
        ) {
            setError("Enter a valid buyer ID.");
            return;
        }

        saveBuyerId(nextBuyerId);

        setLoading(true);

        setBuyerId(nextBuyerId);
    };


    /* =========================
       UPCOMING ROOMS
    ========================= */

    const upcomingRooms = rooms.filter((room) => {

        const status = room.status?.toLowerCase();

        return (
            status === "upcoming" ||
            status === "open"
        );
    });


    /* =========================
       BOOKED ROOMS
    ========================= */

    const bookedRooms = bookings.filter((booking) => {

        const status =
            booking.roomStatus?.toLowerCase();

        return (
            status === "waiting" ||
            status === "live" ||
            status === "upcoming" ||
            status === "open"
        );
    });


    /* =========================
       COMPLETED ROOMS
    ========================= */

    const completedRooms = bookings.filter((booking) => {

        const status =
            booking.roomStatus?.toLowerCase();

        return (
            status === "completed" ||
            status === "cancelled"
        );
    });


    /* =========================
       ROOM CARD
    ========================= */

    const renderRoomCard = (room) => (

        <Link
            key={room.roomId}
            to={`/buyer/rooms/${room.roomId}`}
            className="room-card"
        >

            <h3>
                {room.title}
            </h3>

            <p>
                Room #{room.roomId}
            </p>

            <p>
                Seats: {room.seatLimit}
            </p>

            <p>
                Advance: ₹{room.advanceAmount}
            </p>

            <p>
                {room.startTime
                    ? new Date(
                        room.startTime
                    ).toLocaleString()
                    : "Start time not set"}
            </p>

            <strong>
                View and book
            </strong>

        </Link>
    );


    /* =========================
       BOOKING CARD
    ========================= */

    const renderBookingCard = (booking) => (

        <article
            className="room-card"
            key={booking.roomSeatId}
        >

            <span
                className={`buyer-room-status ${booking.roomStatus}`}
            >
                {booking.roomStatus}
            </span>

            <h3>
                {booking.roomTitle}
            </h3>

            <p>
                Room #{booking.roomId}
            </p>

            <p>
                {booking.startTime
                    ? new Date(
                        booking.startTime
                    ).toLocaleString()
                    : "Start time not set"}
            </p>

            <p>
                Advance paid: ₹
                {booking.advanceAmount}
            </p>

            {booking.attendanceStatus === "missed" && (

                <p className="form-error">
                    Entry missed. Advance forfeited.
                </p>

            )}

            {[
                "waiting",
                "live",
                "upcoming",
                "open"
            ].includes(
                booking.roomStatus?.toLowerCase()
            ) ? (

                <Link
                    className="enter-room-link"
                    to={`/buyer/rooms/${booking.roomId}/live`}
                >
                    {booking.canJoin
                        ? "Enter auction room"
                        : "Open waiting page"}
                </Link>

            ) : (

                <span className="room-complete-label">
                    Auction finished
                </span>

            )}

        </article>
    );


    /* =========================
       WON PRODUCT CARD
    ========================= */

    const renderWonDealCard = (deal) => (

        <article
            className="won-deal-card"
            key={deal.dealId}
        >

            {deal.imageUrl && (

                <img
                    src={deal.imageUrl}
                    alt={deal.productName}
                />

            )}

            <div className="won-deal-content">

                <span className="buyer-room-status completed">
                    Won · Room #{deal.roomId}
                </span>

                <h3>
                    {deal.productName}
                </h3>

                <p>
                    {deal.productDescription ||
                        "No product description available."}
                </p>

                <dl className="won-deal-details">

                    <div>
                        <dt>
                            Winning bid
                        </dt>

                        <dd>
                            ₹{deal.finalPrice}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Seller
                        </dt>

                        <dd>
                            {deal.sellerName ||
                                `Seller #${deal.sellerId}`}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Email
                        </dt>

                        <dd>
                            {deal.sellerEmail ||
                                "Unavailable"}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Phone
                        </dt>

                        <dd>
                            {deal.sellerPhone ||
                                "Unavailable"}
                        </dd>
                    </div>

                </dl>

                <Link
                    className="enter-room-link"
                    to={`/buyer/deals/${deal.dealId}`}
                >
                    Review deal
                </Link>

            </div>

        </article>
    );


    /* =========================
       PAGE
    ========================= */

    return (

        <main className="buyer-page">

            {/* ==================================================
                /buyer
                BOOKING ROOMS PAGE
            ================================================== */}

            {isBookingRoomsPage && (

                <>

                    <header className="buyer-header">

                        <div className="buyer-welcome">

                            <h1>
                                Welcome back, {username}
                            </h1>

                            <p>
                                Find auctions, place bids and track your wins.
                            </p>

                        </div>

                    </header>


                    {/* ERROR */}

                    {error && (

                        <p
                            className="form-error"
                            role="alert"
                        >
                            {error}
                        </p>

                    )}


                    <section className="buyer-section">

                        <div className="section-heading">

                            <h2>
                                Rooms
                            </h2>

                            <span>
                                {upcomingRooms.length} rooms
                            </span>

                        </div>


                        {loading ? (

                            <p className="buyer-empty">
                                Loading rooms...
                            </p>

                        ) : upcomingRooms.length === 0 ? (

                            <p className="buyer-empty">
                                No rooms available.
                            </p>

                        ) : (

                            <div className="rooms-grid">

                                {upcomingRooms.map(
                                    renderRoomCard
                                )}

                            </div>

                        )}

                    </section>

                </>

            )}


            {/* ==================================================
                /buyer/:buyerId
                FULL BUYER DASHBOARD
            ================================================== */}

            {!isBookingRoomsPage && (

                <>

                    {/* =========================
                        HEADER
                    ========================= */}

                    <header className="buyer-header">

                        <div>

                            <h1>
                                Buyer Auction Rooms
                            </h1>

                            <p>
                                Book a room, wait for the host, then bid live.
                            </p>

                        </div>


                        {/* BUYER ID SWITCHER */}

                        <form
                            className="buyer-switcher"
                            onSubmit={changeBuyer}
                        >

                            <label htmlFor="buyer-id">
                                Testing as buyer
                            </label>

                            <div>

                                <input
                                    id="buyer-id"
                                    type="number"
                                    min="1"
                                    value={buyerIdInput}
                                    onChange={(event) =>
                                        setBuyerIdInput(
                                            event.target.value
                                        )
                                    }
                                />

                                <button type="submit">
                                    Load
                                </button>

                            </div>

                        </form>

                    </header>


                    {/* ERROR */}

                    {error && (

                        <p
                            className="form-error"
                            role="alert"
                        >
                            {error}
                        </p>

                    )}


                    {/* =========================
                        TABS
                    ========================= */}

                    <div className="buyer-tabs">

                        <button
                            type="button"
                            className={
                                activeTab === "all"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("all")
                            }
                        >
                            All
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === "upcoming"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("upcoming")
                            }
                        >
                            Upcoming
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === "booked"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("booked")
                            }
                        >
                            Booked
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === "completed"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("completed")
                            }
                        >
                            Completed
                        </button>

                    </div>


                    {/* =========================
                        LOADING
                    ========================= */}

                    {loading ? (

                        <p className="buyer-empty">
                            Loading...
                        </p>

                    ) : (

                        <>

                            {/* =========================
                                ALL
                            ========================= */}

                            {activeTab === "all" && (

                                <>

                                    {/* AVAILABLE ROOMS */}

                                    <section className="buyer-section">

                                        <div className="section-heading">

                                            <h2>
                                                Rooms Available to Book
                                            </h2>

                                            <span>
                                                {rooms.length} rooms
                                            </span>

                                        </div>

                                        {rooms.length === 0 ? (

                                            <p className="buyer-empty">
                                                No rooms are open for booking.
                                            </p>

                                        ) : (

                                            <div className="rooms-grid">

                                                {rooms.map(
                                                    renderRoomCard
                                                )}

                                            </div>

                                        )}

                                    </section>


                                    {/* BOOKED ROOMS */}

                                    <section className="buyer-section">

                                        <div className="section-heading">

                                            <h2>
                                                My Booked Rooms
                                            </h2>

                                            <span>
                                                {bookings.length} bookings
                                            </span>

                                        </div>

                                        {bookings.length === 0 ? (

                                            <p className="buyer-empty">
                                                You have not booked an auction room yet.
                                            </p>

                                        ) : (

                                            <div className="rooms-grid">

                                                {bookings.map(
                                                    renderBookingCard
                                                )}

                                            </div>

                                        )}

                                    </section>


                                    {/* WON PRODUCTS */}

                                    <section className="buyer-section">

                                        <div className="section-heading">

                                            <h2>
                                                Products I Won
                                            </h2>

                                            <span>
                                                {wonDeals.length} products
                                            </span>

                                        </div>

                                        {wonDeals.length === 0 ? (

                                            <p className="buyer-empty">
                                                You have not won an auction product yet.
                                            </p>

                                        ) : (

                                            <div className="won-deals-grid">

                                                {wonDeals.map(
                                                    renderWonDealCard
                                                )}

                                            </div>

                                        )}

                                    </section>

                                </>

                            )}


                            {/* =========================
                                UPCOMING
                            ========================= */}

                            {activeTab === "upcoming" && (

                                <section className="buyer-section">

                                    <div className="section-heading">

                                        <h2>
                                            Upcoming Rooms
                                        </h2>

                                        <span>
                                            {upcomingRooms.length} rooms
                                        </span>

                                    </div>

                                    {upcomingRooms.length === 0 ? (

                                        <p className="buyer-empty">
                                            No upcoming rooms.
                                        </p>

                                    ) : (

                                        <div className="rooms-grid">

                                            {upcomingRooms.map(
                                                renderRoomCard
                                            )}

                                        </div>

                                    )}

                                </section>

                            )}


                            {/* =========================
                                BOOKED
                            ========================= */}

                            {activeTab === "booked" && (

                                <section className="buyer-section">

                                    <div className="section-heading">

                                        <h2>
                                            My Booked Rooms
                                        </h2>

                                        <span>
                                            {bookedRooms.length} bookings
                                        </span>

                                    </div>

                                    {bookedRooms.length === 0 ? (

                                        <p className="buyer-empty">
                                            You have no active bookings.
                                        </p>

                                    ) : (

                                        <div className="rooms-grid">

                                            {bookedRooms.map(
                                                renderBookingCard
                                            )}

                                        </div>

                                    )}

                                </section>

                            )}


                            {/* =========================
                                COMPLETED
                            ========================= */}

                            {activeTab === "completed" && (

                                <>

                                    {/* COMPLETED ROOMS */}

                                    <section className="buyer-section">

                                        <div className="section-heading">

                                            <h2>
                                                Completed Rooms
                                            </h2>

                                            <span>
                                                {completedRooms.length} rooms
                                            </span>

                                        </div>

                                        {completedRooms.length === 0 ? (

                                            <p className="buyer-empty">
                                                No completed rooms.
                                            </p>

                                        ) : (

                                            <div className="rooms-grid">

                                                {completedRooms.map(
                                                    renderBookingCard
                                                )}

                                            </div>

                                        )}

                                    </section>


                                    {/* WON PRODUCTS */}

                                    <section className="buyer-section">

                                        <div className="section-heading">

                                            <h2>
                                                Products I Won
                                            </h2>

                                            <span>
                                                {wonDeals.length} products
                                            </span>

                                        </div>

                                        {wonDeals.length === 0 ? (

                                            <p className="buyer-empty">
                                                You have not won any products.
                                            </p>

                                        ) : (

                                            <div className="won-deals-grid">

                                                {wonDeals.map(
                                                    renderWonDealCard
                                                )}

                                            </div>

                                        )}

                                    </section>

                                </>

                            )}

                        </>

                    )}

                </>

            )}

        </main>
    );
}

export default BuyerDashboard;