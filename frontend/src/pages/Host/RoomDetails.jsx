import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    assignProductToRoom,
    getAvailableProducts,
    getRoomDetails,
    getRoomProducts,
    startRoom
} from "../../services/hostService";
import { apiErrorMessage } from "../../services/api";
import { IconGavel } from "../../components/layout/icons";
import "../shared.css";

async function fetchRoomData(roomId) {
    const [roomResponse, roomProductsResponse, availableResponse] = await Promise.all([
        getRoomDetails(roomId),
        getRoomProducts(roomId),
        getAvailableProducts()
    ]);
    return {
        room: roomResponse.data,
        assignedProducts: roomProductsResponse.data,
        availableProducts: availableResponse.data
    };
}

export default function RoomDetails() {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const [assignedProducts, setAssignedProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const reloadRoom = async () => {
        const data = await fetchRoomData(roomId);
        setRoom(data.room);
        setAssignedProducts(data.assignedProducts);
        setAvailableProducts(data.availableProducts);
    };

    useEffect(() => {
        let cancelled = false;
        fetchRoomData(roomId)
            .then((data) => {
                if (cancelled) return;
                setRoom(data.room);
                setAssignedProducts(data.assignedProducts);
                setAvailableProducts(data.availableProducts);
            })
            .catch((requestError) => { if (!cancelled) setError(apiErrorMessage(requestError, "Unable to load room details.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [roomId]);

    const handleAddProduct = async (event) => {
        event.preventDefault();
        if (!selectedProductId) return;
        setAdding(true);
        setError("");
        setMessage("");
        try {
            await assignProductToRoom(Number(selectedProductId), Number(roomId));
            setSelectedProductId("");
            await reloadRoom();
            setMessage("Product added to this room.");
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to add product to this room."));
        } finally {
            setAdding(false);
        }
    };

    const handleStartRoom = async () => {
        setStarting(true);
        setError("");
        setMessage("");
        try {
            await startRoom(roomId);
            await reloadRoom();
            setMessage("Waiting room opened. Bidding starts automatically in 90 seconds.");
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to start this room."));
        } finally {
            setStarting(false);
        }
    };

    if (loading) return <p className="spinner-row">Loading room details...</p>;
    if (!room) return <p className="alert alert-error">{error || "Room not found."}</p>;

    const status = room.status?.toLowerCase();
    const roomHasStarted = ["waiting", "live", "completed"].includes(status);
    const roomCanStart = ["upcoming", "open"].includes(status);

    return (
        <div>
            <Link className="back-link" to="/host/rooms">← Back to rooms</Link>

            <div className="page-head">
                <div>
                    <span className="eyebrow">Room #{room.roomId}</span>
                    <h1>{room.title}</h1>
                </div>
                <div className="page-head-actions">
                    <span className={`badge ${status === "live" ? "badge-danger" : status === "completed" ? "badge-neutral" : "badge-info"}`}>{room.status}</span>
                    {roomCanStart && (
                        <button className="btn btn-primary" onClick={handleStartRoom} disabled={starting}>
                            {starting ? "Starting..." : "Start auction now"}
                        </button>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <dl className="fact-list">
                    <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                    <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                    <div><dt>Starts</dt><dd>{new Date(room.startTime).toLocaleString()}</dd></div>
                    <div><dt>Status</dt><dd style={{ textTransform: "capitalize" }}>{room.status}</dd></div>
                </dl>
            </div>

            {message && <p className="alert alert-success">{message}</p>}
            {error && <p className="alert alert-error">{error}</p>}

            <div className="section-block">
                <div className="section-block-head">
                    <h2>Products in this room</h2>
                    <span>{assignedProducts.length} products</span>
                </div>

                {assignedProducts.length === 0 ? (
                    <div className="empty-state">No products have been added yet.</div>
                ) : (
                    <div className="grid-cards">
                        {assignedProducts.map((product) => (
                            <article className="card" style={{ padding: 14 }} key={product.auctionItemId}>
                                <div className="thumb" style={{ marginBottom: 10 }}>
                                    {product.imageUrl
                                        ? <img src={product.imageUrl} alt={product.name} />
                                        : <span className="thumb-fallback"><IconGavel width={22} height={22} /></span>}
                                </div>
                                <h3 style={{ fontSize: 14.5, marginBottom: 4 }}>{product.name || "Product unavailable"}</h3>
                                <p style={{ fontSize: 12.5, marginBottom: 8 }}>{product.description || "No description available."}</p>
                                <strong style={{ fontFamily: "var(--font-display)" }}>₹{product.basePrice}</strong>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <div className="section-block">
                <div className="section-block-head">
                    <h2>Add an approved product</h2>
                    <span>{availableProducts.length} available</span>
                </div>

                {roomHasStarted ? (
                    <p className="alert alert-error">Products can only be added before this room starts.</p>
                ) : (
                    <form className="card" style={{ padding: 18, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }} onSubmit={handleAddProduct}>
                        <label className="field" style={{ flex: 1, minWidth: 240 }}>
                            <span className="field-label">Approved product</span>
                            <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} disabled={adding || availableProducts.length === 0}>
                                <option value="">Choose a product</option>
                                {availableProducts.map((product) => (
                                    <option key={product.productId} value={product.productId}>
                                        {product.productName} · {product.categoryName || "Uncategorized"} · ₹{product.basePrice}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button type="submit" className="btn btn-primary" disabled={adding || !selectedProductId}>
                            {adding ? "Adding..." : "Add product"}
                        </button>
                    </form>
                )}
                {!roomHasStarted && availableProducts.length === 0 && (
                    <p style={{ fontSize: 13, color: "var(--text-faint)" }}>No approved, unassigned products are available right now.</p>
                )}
            </div>
        </div>
    );
}
