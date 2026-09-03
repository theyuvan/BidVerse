import { useEffect, useState } from "react";
import { getRooms } from "../../services/hostService";

function HostDashboard(){
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        getRooms().then((response) => {
            setRooms(response.data);
        });
    }, []);

    return(
        <main className="host-page dashboard-page">
            <header className="page-header">
                <h1>Host Dashboard</h1>
                <p>Keep track of your auction rooms and listings.</p>
            </header>

            <section className="dashboard-section">
                <div className="section-heading">
                    <h2>My Rooms</h2>
                    <span>{rooms.length} rooms</span>
                </div>
                <div className="dashboard-room-grid">
                    {rooms.slice(0, 4).map((room) =>(
                    <article className="dashboard-room-card" key={room.roomId}>
                        <h3>{room.title}</h3>
                        <span className="room-status">{room.status}</span>
                        <dl>
                            <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                            <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                        </dl>
                    </article>
                    ))}
                </div>
            </section>

            <section className="dashboard-products">
                <h2>Products</h2>
                <p>Verify Seller products and assign them to rooms.</p>
            </section>
        </main>
    );
}
export default HostDashboard;