import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRooms, startRoom } from "../../services/hostService";
import { apiErrorMessage } from "../../services/api";
import { IconCreate, IconGavel } from "../../components/layout/icons";
import "../shared.css";

const FILTERS = ["all", "upcoming", "waiting", "live", "completed"];

function startButtonText(room, startingRoomId) {
    if (startingRoomId === room.roomId) return "Opening...";
    const status = room.status?.toLowerCase();
    if (status === "waiting") return "Waiting room open";
    if (status === "live") return "Room ongoing";
    if (status === "completed") return "Finished";
    return "Start now";
}

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [filter, setFilter] = useState("all");
    const [startingRoomId, setStartingRoomId] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        getRooms()
            .then((response) => setRooms(response.data))
            .catch((requestError) => setError(apiErrorMessage(requestError, "Unable to load rooms.")));
    }, []);

    const filteredRooms = filter === "all" ? rooms : rooms.filter((room) => room.status?.toLowerCase() === filter);

    const handleStartRoom = async (event, roomId) => {
        event.stopPropagation();
        setStartingRoomId(roomId);
        setError("");
        try {
            const response = await startRoom(roomId);
            setRooms((current) => current.map((room) => (room.roomId === roomId ? response.data : room)));
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to start this room."));
        } finally {
            setStartingRoomId(null);
        }
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Host workspace</span>
                    <h1>Rooms</h1>
                    <p>Rooms auto-start once their time hits, or start one early yourself.</p>
                </div>
                <Link className="btn btn-primary" to="/host/rooms/new"><IconCreate width={16} height={16} /> Create room</Link>
            </div>

            {error && <p className="alert alert-error">{error}</p>}

            <div className="tabs" style={{ marginBottom: 22 }}>
                {FILTERS.map((key) => (
                    <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)} style={{ textTransform: "capitalize" }}>
                        {key}
                    </button>
                ))}
            </div>

            {filteredRooms.length === 0 ? (
                <div className="empty-state">No rooms here.</div>
            ) : (
                <div className="grid-cards">
                    {filteredRooms.map((room) => (
                        <article className="card room-card" key={room.roomId} onClick={() => navigate(`/host/rooms/${room.roomId}`)}>
                            <div className="room-card-top">
                                <div className="thumb" style={{ width: 40, height: 40 }}>
                                    <span className="thumb-fallback"><IconGavel width={18} height={18} /></span>
                                </div>
                                <span className={`badge ${room.status === "live" ? "badge-danger" : room.status === "completed" ? "badge-neutral" : "badge-info"}`}>
                                    {room.status}
                                </span>
                            </div>
                            <h3>{room.title}</h3>
                            <div className="room-card-meta">
                                <span>Seats <strong>{room.seatLimit}</strong></span>
                                <span>Advance <strong>₹{room.advanceAmount}</strong></span>
                            </div>
                            <div className="room-card-meta">
                                <span>Starts <strong>{new Date(room.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong></span>
                            </div>
                            <div className="room-card-footer">
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    disabled={startingRoomId === room.roomId || !["upcoming", "open"].includes(room.status?.toLowerCase())}
                                    onClick={(event) => handleStartRoom(event, room.roomId)}
                                >
                                    {startButtonText(room, startingRoomId)}
                                </button>
                                <span className="badge badge-neutral">Manage →</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
