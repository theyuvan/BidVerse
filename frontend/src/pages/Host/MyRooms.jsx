import { useEffect, useState } from "react";
import { getRooms } from "../../services/hostService";

function MyRooms() {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        getRooms()
            .then((response) => setRooms(response.data))
            .catch((error) => console.error("Error fetching rooms:", error));
    }, []);

    return (
        <main className="host-page rooms-page">
            <header className="page-header">
                <h1>My Rooms</h1>
                <p>View and manage rooms</p>
            </header>
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
                            <article className="room-card" key={room.roomId}>
                                <h3>{room.title}</h3>
                                <span className="room-status">{room.status}</span>
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