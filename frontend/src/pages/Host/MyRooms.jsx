import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms, startRoom } from "../../services/hostService";
import "./MyRooms.css";
function MyRooms() {
    const [rooms, setRooms] = useState([]);
    const [startingRoomId, setStartingRoomId] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        getRooms()
            .then((response) => setRooms(response.data))
            .catch(() => setError("Unable to load rooms."));
    }, []);

    const handleStartRoom = async (event, roomId) => {
        event.stopPropagation();
        setStartingRoomId(roomId);
        setError("");

        try {
            const response = await startRoom(roomId);
            setRooms((currentRooms) => currentRooms.map((room) =>
                room.roomId === roomId ? response.data : room
            ));
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.message || "Unable to start this room.");
        } finally {
            setStartingRoomId(null);
        }
    };

    return (
        <main className="host-page rooms-page">
            <header className="page-header">
                <h1>My Rooms</h1>
                <p>Start an upcoming room and manage its approved auction products.</p>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            <section className="rooms-section">
                <div className="section-heading">
                    <h2>Auction Rooms</h2>
                    <span>{rooms.length} rooms</span>
                </div>
                {rooms.length === 0 ? (
                    <p className="empty-state">No rooms available.</p>
                ) : (
                    <div className="room-grid">
                        {rooms.map((room) => (
                            <article
                                className="room-card room-card-clickable"
                                key={room.roomId}
                                onClick={() => navigate(`/host/rooms/${room.roomId}`)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        navigate(`/host/rooms/${room.roomId}`);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <h3>{room.title}</h3>
                                <span className="room-status">{room.status}</span>
                                <dl>
                                    <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                                    <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                                    <div><dt>Starts</dt><dd>{new Date(room.startTime).toLocaleString()}</dd></div>
                                </dl>
                                <div className="room-card-actions">
                                    <button
                                        type="button"
                                        className="start-room-button"
                                        disabled={startingRoomId === room.roomId || !["upcoming", "open"].includes(room.status?.toLowerCase())}
                                        onClick={(event) => handleStartRoom(event, room.roomId)}
                                    >
                                        {startingRoomId === room.roomId ? "Starting..." : room.status?.toLowerCase() === "live" ? "Room ongoing" : "Start room"}
                                    </button>
                                    <button
                                        type="button"
                                        className="manage-room-button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            navigate(`/host/rooms/${room.roomId}`);
                                        }}
                                    >
                                        Manage products
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default MyRooms;