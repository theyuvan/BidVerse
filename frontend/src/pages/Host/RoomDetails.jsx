import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    assignProductToRoom,
    getAvailableProducts,
    getProducts,
    getRoomDetails,
    getRoomProducts,
    startRoom
} from "../../services/hostService";
import "./RoomDetails.css";

function getErrorMessage(error, fallback) {
    const data = error.response?.data;
    return typeof data === "string" ? data : data?.detail || data?.message || fallback;
}

async function fetchRoomData(roomId) {
    const [roomResponse, roomProductsResponse, availableResponse, productsResponse] = await Promise.all([
        getRoomDetails(roomId),
        getRoomProducts(roomId),
        getAvailableProducts(),
        getProducts()
    ]);

    return {
        room: roomResponse.data,
        assignedProducts: roomProductsResponse.data,
        availableProducts: availableResponse.data,
        approvedProducts: productsResponse.data.filter(
            (product) => product.status?.toLowerCase() === "approved"
        )
    };
}

function RoomDetails() {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const [assignedProducts, setAssignedProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [approvedProducts, setApprovedProducts] = useState([]);
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
        setApprovedProducts(data.approvedProducts);
    };

    useEffect(() => {
        let cancelled = false;

        fetchRoomData(roomId)
            .then((data) => {
                if (!cancelled) {
                    setRoom(data.room);
                    setAssignedProducts(data.assignedProducts);
                    setAvailableProducts(data.availableProducts);
                    setApprovedProducts(data.approvedProducts);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(getErrorMessage(requestError, "Unable to load room details."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
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
            setError(getErrorMessage(requestError, "Unable to add product to this room."));
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
            setMessage("Auction started. The first product is now live.");
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Unable to start this room."));
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return <main className="host-page"><p className="empty-state">Loading room details...</p></main>;
    }

    if (!room) {
        return <main className="host-page"><p className="form-error">{error || "Room not found."}</p></main>;
    }

    const roomIsLive = room.status?.toLowerCase() === "live";
    const roomCanStart = ["upcoming", "open"].includes(room.status?.toLowerCase());

    return (
        <main className="host-page room-details-page">
            <Link className="back-link" to="/host/rooms">Back to My Rooms</Link>

            <header className="page-header">
                <h1>{room.title}</h1>
                <p>Room {room.roomId} · Manage auction products</p>
            </header>

            <section className="room-summary">
                <div className="room-summary-heading">
                    <span className="room-status">{room.status}</span>
                    {roomCanStart && (
                        <button type="button" onClick={handleStartRoom} disabled={starting}>
                            {starting ? "Starting..." : "Start auction now"}
                        </button>
                    )}
                </div>
                <dl>
                    <div><dt>Host ID</dt><dd>{room.hostId}</dd></div>
                    <div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
                    <div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
                    <div><dt>Starts</dt><dd>{new Date(room.startTime).toLocaleString()}</dd></div>
                </dl>
            </section>

            <section className="room-products-section">
                <div className="section-heading">
                    <h2>Products in this room</h2>
                    <span>{assignedProducts.length} products</span>
                </div>

                {assignedProducts.length === 0 ? (
                    <p className="empty-state">No products have been added yet.</p>
                ) : (
                    <div className="assigned-product-list">
                        {assignedProducts.map((product) => (
                            <article className="assigned-product" key={product.productId}>
                                {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
                                <div>
                                    <h3>{product.name || "Product unavailable"}</h3>
                                    <p>{product.description || "No description available."}</p>
                                </div>
                                <strong>₹{product.basePrice}</strong>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="assign-product-section">
                <div className="section-heading">
                    <h2>Add an approved product</h2>
                    <span>{availableProducts.length} available</span>
                </div>

                {roomIsLive && (
                    <p className="form-error" role="alert">Products cannot be added after this room has started.</p>
                )}

                <form className="assign-product-form" onSubmit={handleAddProduct}>
                    <label htmlFor="approved-product">
                        Approved product
                        <select
                            id="approved-product"
                            value={selectedProductId}
                            onChange={(event) => setSelectedProductId(event.target.value)}
                            disabled={adding || roomIsLive || availableProducts.length === 0}
                        >
                            <option value="">Choose a product</option>
                            {availableProducts.map((product) => (
                                <option key={product.productId} value={product.productId}>
                                    {product.productName} - {product.categoryName || "Uncategorized"} - ₹{product.basePrice}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" disabled={adding || roomIsLive || !selectedProductId}>
                        {adding ? "Adding..." : "Add Product"}
                    </button>
                </form>

                {message && <p className="form-success" role="status">{message}</p>}
                {error && <p className="form-error" role="alert">{error}</p>}
                {!roomIsLive && availableProducts.length === 0 && approvedProducts.length > 0 && (
                    <p className="empty-state">All approved products are already assigned to rooms.</p>
                )}
                {!roomIsLive && approvedProducts.length === 0 && (
                    <p className="empty-state">No approved products found in the database.</p>
                )}
            </section>
        </main>
    );
}

export default RoomDetails;
