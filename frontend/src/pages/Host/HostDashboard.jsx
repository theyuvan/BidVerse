import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRooms } from "../../services/hostService";
import "./HostDashboard.css";
import Showcase from "../../components/Showcase";
import HostRoomCard from "../../components/HostRoomCard";

function HostDashboard(){
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        getRooms()
            .then((roomsResponse) => {
                setRooms(roomsResponse.data);
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
                <h1>Dashboard</h1>
                    <Link className="create-room-button" to="/host/rooms/create">+ Create Room</Link>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Showcase role="host" />
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
            </div>

            <div className="host-room-grid">
{upcomingRooms.map(room => <HostRoomCard key={room.roomId} room={room} />)}
</div>
</section>

            <section className="dashboard-section">
                <div className="section-heading">
                    <h2>Live Rooms</h2>
                </div>

                <div className="host-room-grid">
{liveRooms.map(room => <HostRoomCard key={room.roomId} room={room} />)}
</div>
</section>
        </main>
    );
}
export default HostDashboard;
