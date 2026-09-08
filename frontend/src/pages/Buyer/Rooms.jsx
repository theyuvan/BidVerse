import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableRooms, searchRooms } from "../../services/buyerService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel, IconSearch } from "../../components/layout/icons";
import "../shared.css";

function formatDate(value) {
    if (!value) return "Not scheduled";
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        getAvailableRooms()
            .then((response) => { if (!cancelled) setRooms(response.data); })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load rooms.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const runSearch = async (event) => {
        event.preventDefault();
        if (!query.trim()) {
            setSearching(false);
            setLoading(true);
            try {
                const response = await getAvailableRooms();
                setRooms(response.data);
                setError("");
            } catch (requestError) {
                setError(apiErrorMessage(requestError, "Unable to load rooms."));
            } finally {
                setLoading(false);
            }
            return;
        }

        setSearching(true);
        setLoading(true);
        setError("");
        try {
            const response = await searchRooms(query.trim());
            setRooms(response.data);
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to search rooms."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Auction rooms</span>
                    <h1>Rooms available to book</h1>
                    <p>Every room here is open for booking and you haven't reserved a seat in it yet.</p>
                </div>
                <form className="search-bar" onSubmit={runSearch}>
                    <IconSearch width={16} height={16} />
                    <input
                        placeholder="Search by title, product, or room #"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </form>
            </div>

            {error && <p className="alert alert-error" role="alert">{error}</p>}

            {loading ? (
                <p className="spinner-row">Loading rooms...</p>
            ) : rooms.length === 0 ? (
                <div className="empty-state">
                    {searching ? "No rooms match your search." : "No rooms are open for booking right now."}
                </div>
            ) : (
                <div className="grid-cards">
                    {rooms.map((room) => (
                        <article className="card room-card" key={room.roomId} onClick={() => navigate(`/buyer/rooms/${room.roomId}`)}>
                            <div className="room-card-top">
                                <div className="thumb" style={{ width: 44, height: 44 }}>
                                    <span className="thumb-fallback"><IconGavel width={20} height={20} /></span>
                                </div>
                                <span className={`badge ${room.status === "live" ? "badge-danger" : "badge-info"}`}>
                                    {room.status}
                                </span>
                            </div>
                            <h3>{room.title}</h3>
                            <div className="room-card-meta">
                                <span>Room <strong>#{room.roomId}</strong></span>
                                <span>Seats <strong>{room.seatLimit}</strong></span>
                            </div>
                            <div className="room-card-footer">
                                <span className="room-card-meta"><span>Starts <strong>{formatDate(room.startTime)}</strong></span></span>
                                <span className="room-card-meta"><span>Advance <strong>₹{room.advanceAmount}</strong></span></span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
