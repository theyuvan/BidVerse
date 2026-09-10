import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthUser } from "../../services/authSession";
import {
    getAvailableRooms,
    getBuyerBookings,
    getBuyerDeals
} from "../../services/buyerService";
import "./BuyerDashboard.css";
import Showcase from "../../components/Showcase";
import useLiveResource from "../../hooks/useLiveResource";
import { watchRoomCatalogue } from "../../services/auctionSocket";

const formatMoney = (amount) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
}).format(Number(amount) || 0);

const formatDate = (date) => date
    ? new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    })
    : "Start time not set";

function BuyerDashboard({ roomsOnly = false }) {
    const user = getAuthUser();
    const roomState = useLiveResource("rooms", getAvailableRooms);
    const bookingState = useLiveResource("bookings", getBuyerBookings);
    const dealState = useLiveResource("deals", getBuyerDeals);
    const rooms = roomState.data;
    const bookings = bookingState.data;
    const wonDeals = dealState.data;
    const [activeTab, setActiveTab] = useState("upcoming");
    const error = roomState.error || bookingState.error || dealState.error;
    const loading = roomsOnly && activeTab !== "upcoming" ? bookingState.loading : roomState.loading;

    useEffect(() => watchRoomCatalogue(), []);

    const upcomingRooms = rooms.filter((room) =>
        ["upcoming", "open"].includes(room.status?.toLowerCase())
    );
    const bookedRooms = bookings.filter((booking) =>
        ["waiting", "live", "upcoming", "open"].includes(
            booking.roomStatus?.toLowerCase()
        )
    );
    const liveRooms = bookings.filter(
        (booking) => booking.roomStatus?.toLowerCase() === "live"
    );
    const completedRooms = bookings.filter((booking) =>
        ["completed", "cancelled"].includes(booking.roomStatus?.toLowerCase())
    );

    const renderRoomCard = (room) => (
        <Link
            key={room.roomId}
            to={`/buyer/rooms/${room.roomId}`}
            className="room-card auction-room-card"
            aria-label={`View and book ${room.title}`}
        >
            <div className="auction-card-topline">
                <span className={`buyer-room-status ${room.status?.toLowerCase() || "upcoming"}`}>
                    {room.status || "Upcoming"}
                </span>
                <span className="auction-room-number">Room #{room.roomId}</span>
            </div>

            <h3>{room.title}</h3>

            <div className="auction-card-details">
                <div>
                    <span>Seats</span>
                    <strong>{room.seatLimit}</strong>
                </div>
                <div>
                    <span>Advance</span>
                    <strong>{formatMoney(room.advanceAmount)}</strong>
                </div>
            </div>

            <div className="auction-start-time">
                <span>Starts</span>
                <strong>{formatDate(room.startTime)}</strong>
            </div>

            <span className="view-book-button">
                View &amp; Book <span aria-hidden="true">→</span>
            </span>
        </Link>
    );

    const renderBookingCard = (booking) => {
        const isActive = ["waiting", "live", "upcoming", "open"].includes(
            booking.roomStatus?.toLowerCase()
        );

        return (
            <article className="room-card booking-room-card" key={booking.roomSeatId}>
                <div className="auction-card-topline">
                    <span className={`buyer-room-status ${booking.roomStatus?.toLowerCase()}`}>
                        {booking.roomStatus}
                    </span>
                    <span className="auction-room-number">Room #{booking.roomId}</span>
                </div>

                <h3>{booking.roomTitle}</h3>
                <div className="booking-card-info">
                    <p><span>Starts</span>{formatDate(booking.startTime)}</p>
                    <p><span>Advance paid</span>{formatMoney(booking.advanceAmount)}</p>
                </div>

                {booking.attendanceStatus === "missed" && (
                    <p className="booking-warning">Entry missed. Advance forfeited.</p>
                )}

                {isActive ? (
                    <Link className="enter-room-link" to={`/buyer/rooms/${booking.roomId}/live`}>
                        {booking.canJoin ? "Enter Auction Room" : "Open Waiting Page"}
                    </Link>
                ) : (
                    <span className="room-complete-label">Auction finished</span>
                )}
            </article>
        );
    };

    const renderWonDealCard = (deal) => (
        <article className="won-deal-card" key={deal.dealId}>
            {deal.imageUrl ? (
                <img src={deal.imageUrl} alt={deal.productName} />
            ) : (
                <div className="won-deal-image-placeholder" aria-hidden="true">Won</div>
            )}

            <div className="won-deal-content">
                <span className="buyer-room-status completed">Won · Room #{deal.roomId}</span>
                <h3>{deal.productName}</h3>
                <p>{deal.productDescription || "No product description available."}</p>
                <dl className="won-deal-details">
                    <div><dt>Winning bid</dt><dd>{formatMoney(deal.finalPrice)}</dd></div>
                    <div><dt>Seller</dt><dd>{deal.sellerName || `Seller #${deal.sellerId}`}</dd></div>
                    <div><dt>Phone</dt><dd>{deal.sellerPhone || "Unavailable"}</dd></div>
                </dl>
                <Link className="enter-room-link" to={`/buyer/deals/${deal.dealId}`}>
                    Review Deal
                </Link>
            </div>
        </article>
    );

    const renderRoomCollection = (items, emptyMessage, renderer) => {
        if (loading) return <p className="buyer-empty">Loading rooms...</p>;
        if (items.length === 0) return <p className="buyer-empty">{emptyMessage}</p>;
        return <div className="rooms-grid">{items.map(renderer)}</div>;
    };

    if (roomsOnly) {
        const tabContent = {
            upcoming: {
                title: "Upcoming Auctions",
                items: upcomingRooms,
                empty: "No upcoming rooms are available right now.",
                renderer: renderRoomCard
            },
            booked: {
                title: "My Booked Rooms",
                items: bookedRooms,
                empty: "You have no active room bookings.",
                renderer: renderBookingCard
            },
            completed: {
                title: "Completed Auctions",
                items: completedRooms,
                empty: "You have no completed auctions yet.",
                renderer: renderBookingCard
            }
        }[activeTab];

        return (
            <main className="buyer-page booking-rooms-page">
                <header className="buyer-header booking-page-header">
                    <div>
                        <h1>Find Your Next Auction</h1>
                        <p>Reserve a seat, join live bidding, and review past rooms.</p>
                    </div>
                </header>

                {error && <p className="form-error" role="alert">{error}</p>}

                <nav className="buyer-tabs booking-tabs" aria-label="Booking room filters">
                    {["upcoming", "booked", "completed"].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={activeTab === tab ? "active" : ""}
                            data-status={tab}
                            aria-pressed={activeTab === tab}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab[0].toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>

                <section className="buyer-section">
                    <div className="section-heading">
                        <h2>{tabContent.title}</h2>
                    </div>
                    {renderRoomCollection(
                        tabContent.items,
                        tabContent.empty,
                        tabContent.renderer
                    )}
                </section>
            </main>
        );
    }

    const featuredRooms = rooms.slice(0, 3);

    return (
        <main className="buyer-page buyer-dashboard-page">
            <header className="buyer-header dashboard-hero">
                <div className="buyer-welcome">
                    <h1>Welcome back, {user?.name || "Buyer"}</h1>
                    <p>Find auctions, place bids and track your wins.</p>
                </div>
            </header>

            <Showcase role="buyer" />
            <section className="buyer-stats" aria-label="Buyer activity summary">
                <article className="buyer-stat-box bookings-stat">
                    <div><span className="buyer-stat-title">Bookings</span><span className="stat-index">01</span></div>
                    <strong className="buyer-stat-number">{bookingState.loading ? "…" : bookings.length}</strong>
                    <small>Total rooms reserved</small>
                </article>
                <article className="buyer-stat-box live-stat">
                    <div><span className="buyer-stat-title">Live</span><span className="stat-index">02</span></div>
                    <strong className="buyer-stat-number">{bookingState.loading ? "…" : liveRooms.length}</strong>
                    <small>Auctions happening now</small>
                </article>
                <article className="buyer-stat-box won-stat">
                    <div><span className="buyer-stat-title">Deals Won</span><span className="stat-index">03</span></div>
                    <strong className="buyer-stat-number">{dealState.loading ? "…" : wonDeals.length}</strong>
                    <small>Products you have won</small>
                </article>
            </section>

            {error && <p className="form-error" role="alert">{error}</p>}

            <section className="buyer-section dashboard-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">Discover</span>
                        <h2>Available Rooms</h2>
                    </div>
                    <Link className="section-link" to="/buyer/rooms">View all rooms →</Link>
                </div>
                {renderRoomCollection(
                    featuredRooms,
                    "No rooms are available for booking right now.",
                    renderRoomCard
                )}
            </section>

            <section className="buyer-section dashboard-section won-products-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">Your results</span>
                        <h2>Products I Won</h2>
                    </div>
                    {wonDeals.length > 0 && (
                        <Link className="section-link" to="/buyer/deals">View all deals →</Link>
                    )}
                </div>

                {dealState.loading ? (
                    <p className="buyer-empty">Loading won products...</p>
                ) : wonDeals.length === 0 ? (
                    <p className="buyer-empty">Your winning products will appear here.</p>
                ) : (
                    <div className="won-deals-grid">{wonDeals.map(renderWonDealCard)}</div>
                )}
            </section>
        </main>
    );
}

export default BuyerDashboard;
