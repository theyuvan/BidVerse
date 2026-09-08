import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthUser } from "../../services/authSession";
import {
    getAvailableRooms,
    getBuyerBookings,
    getBuyerDeals
} from "../../services/buyerService";
import "./BuyerDashboard.css";
function BuyerDashboard({ roomsOnly = false }) {
    const user = getAuthUser();
    const username = user?.name || "Buyer";
    const isBookingRoomsPage = roomsOnly;

    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [wonDeals, setWonDeals] = useState([]);

    // Full dashboard starts with All
    const [activeTab, setActiveTab] = useState("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* =========================
       LOAD BUYER DATA
    ========================= */

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            getAvailableRooms(),
            getBuyerBookings(),
            getBuyerDeals()
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

    }, []);


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

    const liveRooms = bookings.filter(
        (booking) => booking.roomStatus?.toLowerCase() === "live"
    );


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
                /buyer/rooms
                BOOKING ROOMS PAGE
            ================================================== */}

            {isBookingRoomsPage && (

                <>

                    <header className="buyer-header">

                        <div>

                            <h1>
                                Booking Rooms
                            </h1>

                            <p>
                                Browse upcoming auctions and reserve your seat.
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
                /buyer
                FULL BUYER DASHBOARD
            ================================================== */}

            {!isBookingRoomsPage && (

                <>

                    {/* =========================
                        HEADER
                    ========================= */}

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

                    <section className="buyer-stats" aria-label="Buyer activity summary">
                        <article className="buyer-stat-box">
                            <span className="buyer-stat-title">Bookings</span>
                            <strong className="buyer-stat-number">{bookings.length}</strong>
                        </article>
                        <article className="buyer-stat-box">
                            <span className="buyer-stat-title">Live</span>
                            <strong className="buyer-stat-number">{liveRooms.length}</strong>
                        </article>
                        <article className="buyer-stat-box">
                            <span className="buyer-stat-title">Deals Won</span>
                            <strong className="buyer-stat-number">{wonDeals.length}</strong>
                        </article>
                    </section>


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
