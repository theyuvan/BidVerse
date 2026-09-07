import { useEffect, useState } from "react";
import { getRooms, getProducts } from "../../services/hostService";
import { Link } from "react-router-dom";
import "./HostDashboard.css";

function HostDashboard(){
    const [rooms, setRooms] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([getRooms(), getProducts()])
            .then(([roomsResponse, productsResponse]) => {
                setRooms(roomsResponse.data);
                setProducts(productsResponse.data);
            })
            .catch(() => setError("Unable to load dashboard data. Make sure the backend is running on port 8080."));
    }, []);
    const upcomingRooms = rooms.filter(
        (room) =>room.status?.toLowerCase() === "upcoming"
    );
    const liveRooms= rooms.filter(
        (room) => room.status?.toLowerCase() === "live"
    );

    return(
        <main className="host-page dashboard-page">
            <header className="page-header">
                <h1>Host Dashboard</h1>
                <Link to="/host/rooms/create" className="create-room-button">+ Create Room</Link>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            <section className="dashboard-overview">
                <div className="overview-card">
                    <h3>Total Rooms</h3>
                    <strong>{rooms.length}</strong>
                </div>

                <div className="overview-card">
                    <h3>Upcoming rooms</h3>
                    <strong>{rooms.filter((room) => room.status === "upcoming").length}</strong>
                </div>
                <div className="overview-card">
                    <h3>Live rooms</h3>
                    <strong>{rooms.filter((room) => room.status === "live").length}</strong>
                </div>
                <div className="overview-card">
                    <h3>Completed rooms</h3>
                    <strong>{rooms.filter((room) => room.status === "completed").length}</strong>
                </div>
            </section>

            <section className="dashboard-section">
            <div className="section-heading">
                <h2>Upcoming Rooms</h2>
                <span>{upcomingRooms.length} rooms</span>
            </div>

            <div className="dashboard-room-grid">
                {upcomingRooms.map((room) => (
                    <Link
                        to={`/host/rooms/${room.roomId}`}
                        className="dashboard-room-card"
                        key={room.roomId}
                    >
                <h3>{room.title}</h3>
                <span className={`room-status ${room.status?.trim().toLowerCase()}`}>{room.status}</span>
                <dl>
                    <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                    <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                </dl>
            </Link>
        ))}
    </div>
</section>

            <section className="dashboard-section">
                <div className="section-heading">
                    <h2>Live Rooms</h2>
                    <span>{liveRooms.length} rooms</span>
                </div>

                <div className="dashboard-room-grid">
                    {liveRooms.map((room) => (
                        <Link
                            to={`/host/rooms/${room.roomId}`}
                            className="dashboard-room-card"
                            key={room.roomId}
                        >
                            <h3>{room.title}</h3>
                            <span className={`room-status ${room.status?.trim().toLowerCase()}`}>{room.status}</span>
                            <dl>
                                <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                                <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                            </dl>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="dashboard-products">
                <div className="section-heading">
                    <h3>Products</h3>
                    <strong> Total count:{products.length}</strong>
                </div>

                <div className="product-summary">

                    <div className="product-summary-card">
                        <span>Approved</span>
                        <strong>
                            {products.filter((product) => product.status === "approved").length}
                        </strong>
                    </div>

                    <div className="product-summary-card">
                        <span>Pending</span>
                        <strong>
                            {products.filter((product) => product.status === "pending").length}
                        </strong>
                    </div>

                    <div className="product-summary-card">
                        <span>Rejected</span>
                        <strong>
                            {products.filter((product) => product.status === "rejected").length}
                        </strong>
                    </div>

                </div>
            </section>
        </main>
    );
}
export default HostDashboard;