import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRooms } from "../../services/hostService";
import HostRoomCard from "../../components/HostRoomCard";
import "./MyRooms.css";

export default function MyRooms() {
    const [rooms, setRooms] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let stopped = false, refreshing = false;
        const refresh = async () => {
            if (refreshing) return;
            refreshing = true;
            try {
                const response = await getRooms();
                if (!stopped) { setRooms(response.data); setError(""); }
            } catch { if (!stopped) setError("Unable to refresh rooms."); }
            finally { refreshing = false; if (!stopped) setLoading(false); }
        };
        refresh();
        const timer = setInterval(refresh, 5000);
        return () => { stopped = true; clearInterval(timer); };
    }, []);
    const visible = rooms.filter(room => filter === "all" || room.status?.toLowerCase() === filter);
    return <main className="host-page rooms-page">
        <header className="page-header"><div><span className="overline">YOUR AUCTION WORKSPACE</span><h1>Auction rooms</h1><p>Rooms open automatically at their scheduled time. Bidding follows a 20-second waiting period.</p></div><Link className="button-primary" to="/host/rooms/create">Create room +</Link></header>
        <div className="room-filters" aria-label="Room status filters">{["all", "upcoming", "waiting", "live", "completed"].map(status => <button key={status} type="button" data-status={status} className={filter === status ? "active" : ""} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status[0].toUpperCase() + status.slice(1)}</button>)}</div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <p className="empty-state">Loading rooms…</p> : !visible.length ? <p className="empty-state">No rooms in this view.</p>
            : <div className="host-room-grid">{visible.map(room => <HostRoomCard key={room.roomId} room={room} />)}</div>}
    </main>;
}
