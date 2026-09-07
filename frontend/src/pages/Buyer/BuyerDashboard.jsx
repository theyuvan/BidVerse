import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAvailableRooms } from "../../services/buyerService";
import "./BuyerDashboard.css";

function BuyerDashboard() {

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchRooms = async () => {

            try {
                const response = await getAvailableRooms();
                setRooms(response.data);
            } catch (error) {
                setError("Unable to load rooms.");
            } finally {
                setLoading(false);
            }

        };

        fetchRooms();

    }, []);

    if (loading) {
        return <main className="buyer-page">Loading rooms...</main>;
    }

    if (error) {
        return <main className="buyer-page">{error}</main>;
    }

    return (
        <main className="buyer-page">

            <h1>Available Auction Rooms</h1>

            <p>{rooms.length} rooms available</p>

            <div className="rooms-grid">

                {rooms.map((room) => (

                    <Link
                        key={room.roomId}
                        to={`/buyer/rooms/${room.roomId}`}
                        className="room-card"
                    >

                        <h2>{room.title}</h2>

                        <p>Room ID: {room.roomId}</p>

                        <p>Seats: {room.seatLimit}</p>

                        <p>Advance: ₹{room.advanceAmount}</p>

                        <p>Status: {room.status}</p>

                        <p>
                            Start:{" "}
                            {room.startTime
                                ? new Date(room.startTime).toLocaleString()
                                : "Not scheduled"}
                        </p>

                        <strong>View Room →</strong>

                    </Link>

                ))}

            </div>

        </main>
    );
}

export default BuyerDashboard;