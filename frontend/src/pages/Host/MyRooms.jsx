import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms } from "../../services/hostService";
import "./MyRooms.css";
function MyRooms() {
    const [rooms, setRooms] = useState([]);
    const [filter,setFilter]=useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        getRooms()
            .then((response) =>{ console.log(response.data); setRooms(response.data)})
            .catch((error) => console.error("Error fetching rooms:", error));
    }, []);

    const filteredRooms = filter === "all" ? rooms : rooms.filter((room) => room.status?.toLowerCase() === filter);
    return (
        <main className="host-page rooms-page">
            <header className="page-header">
                <h1>Auction Rooms</h1>
            </header>
            <section className="rooms-section">
                <div className="room-filters">
                    <button className ={filter ==="all"? "active" : ""} onClick={() => setFilter("all")}>All</button>
                    <button className ={filter ==="live"? "active" : ""} onClick={() => setFilter("live")}>Live</button>
                    <button className ={filter ==="upcoming"? "active" : ""} onClick={() => setFilter("upcoming")}>Upcoming</button>
                    <button className ={filter ==="completed"? "active" : ""} onClick={() => setFilter("completed")}>Completed</button>

                </div>
                <div className="section-heading">
                    <span>{filteredRooms.length} rooms</span>
                </div>
                {filteredRooms.length === 0 ? (
                    <p className="empty-state">No rooms available.</p>
                ) : (
                    <div className="room-grid">
                        {filteredRooms.map((room) => (
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
                                <span className={`room-status ${room.status?.trim().toLowerCase()}`}>{room.status}</span>
                                <dl>
                                    <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                                    <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                                    <div><dt>Starts</dt><dd>{new Date(room.startTime).toLocaleString()}</dd></div>
                                </dl>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default MyRooms;