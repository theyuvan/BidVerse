import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getAvailableProducts, getRoomDetails, getRoomProducts, saveRoomProducts } from "../../services/hostService";
import { getAuthUser } from "../../services/authSession";
import ProductPicker from "../../components/ProductPicker";
import ProductPhoto from "../../components/ProductPhoto";
import "./RoomDetails.css";

const errorMessage = error => error.response?.data?.detail || error.response?.data?.message || "Unable to update this room. Please refresh and try again.";
async function fetchData(id) {
    const [room, assigned, available] = await Promise.all([getRoomDetails(id), getRoomProducts(id), getAvailableProducts()]);
    return { room: room.data, assigned: assigned.data, available: available.data };
}
export default function RoomDetails() {
    const { roomId } = useParams();
    const location = useLocation();
    const [room, setRoom] = useState(null);
    const [assigned, setAssigned] = useState([]);
    const [available, setAvailable] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState(location.state?.message || "");
    const applyData = data => {
        setRoom(data.room); setAssigned(data.assigned); setAvailable(data.available);
        setSelectedIds(data.assigned.map(product => product.productId));
    };
    useEffect(() => {
        let stopped = false;
        fetchData(roomId).then(data => { if (!stopped) applyData(data); })
            .catch(error => { if (!stopped) setError(errorMessage(error)); })
            .finally(() => { if (!stopped) setLoading(false); });
        return () => { stopped = true; };
    }, [roomId]);
    useEffect(() => {
        let stopped = false, refreshing = false;
        const timer = setInterval(async () => {
            if (refreshing) return;
            refreshing = true;
            try {
                const response = await getRoomDetails(roomId);
                if (!stopped) {
                    setRoom(response.data);
                    if (!["upcoming", "open"].includes(response.data.status?.toLowerCase())) setEditing(false);
                }
            } catch { return; }
            finally { refreshing = false; }
        }, 5000);
        return () => { stopped = true; clearInterval(timer); };
    }, [roomId]);
    const isOwner = String(getAuthUser()?.userId) === String(room?.hostId);
    const editable = isOwner && ["upcoming", "open"].includes(room?.status?.toLowerCase());
    const choices = [...assigned, ...available.filter(product => !assigned.some(item => item.productId === product.productId))];
    const save = async () => {
        setBusy(true); setError(""); setMessage("");
        try {
            const response = await saveRoomProducts(roomId, selectedIds);
            setAssigned(response.data);
            setEditing(false); setMessage("Room collection updated.");
            setAvailable((await getAvailableProducts()).data);
        } catch (error) { setError(errorMessage(error)); }
        finally { setBusy(false); }
    };
    if (loading) return <main className="host-page"><p className="empty-state">Loading your auction workspace…</p></main>;
    if (!room) return <main className="host-page"><Link to="/host/rooms">Back to rooms</Link><p role="alert" className="form-error">{error}</p></main>;
    return <main className="host-page host-room-workspace">
        <Link className="back-link" to="/host/rooms">← Back to rooms</Link>
        <section className="host-workspace-hero">
            <div><span className="overline">AUCTION ROOM #{room.roomId}</span><h1>{room.title}</h1><p>One collection. One shared bidding experience.</p><span className={`host-status ${room.status}`}>{room.status}</span></div>
            <div className="host-workspace-action"><strong>Scheduled automatic start</strong><small>The waiting room opens at the scheduled time. Bidding starts 90 seconds later while the backend is running.</small>{editable ? <small>{editing ? "Save your product selection before the scheduled time." : !assigned.length ? "Add approved products: an empty room cannot start automatically." : "The product collection locks when the waiting room opens."}</small> : <small>{isOwner ? "Product selection is locked for this auction." : "Only this room’s host can change its collection."}</small>}</div>
        </section>
        <dl className="host-workspace-facts"><div><dt>Buyer seats</dt><dd>{room.seatLimit}</dd></div><div><dt>Reservation advance</dt><dd>₹{Number(room.advanceAmount).toLocaleString("en-IN")}</dd></div><div><dt>Scheduled start</dt><dd>{new Date(room.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</dd></div></dl>
        {message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
        <section className="host-builder-panel">
            <div className="host-collection-heading"><div><span className="overline">THE AUCTION COLLECTION</span><h2>{editing ? "Choose your products" : "Products in this room"}</h2><p>{editing ? "Select to include. Uncheck to remove. Changes apply only when you save." : "Review each piece before welcoming your buyers."}</p></div>
                {editable && !editing && <button className="button-outline" type="button" onClick={() => { setSelectedIds(assigned.map(item => item.productId)); setEditing(true); }}>Edit collection</button>}</div>
            {editing ? <><ProductPicker products={choices} selectedIds={selectedIds} onChange={setSelectedIds} disabled={busy} />
                <div className="host-edit-actions"><button type="button" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save collection"}</button><button className="button-outline" type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button></div></>
                : !assigned.length ? <p className="empty-state">Your collection is empty. Use Edit collection to add approved products.</p>
                    : <div className="host-product-grid">{assigned.map((product, index) => <article className="host-product-tile" key={product.productId}>
                        <ProductPhoto src={product.imageUrl} name={product.name} /><div className="host-product-body"><span className="overline">LOT {String(index + 1).padStart(2, "0")}</span><h2>{product.name}</h2><p>{product.description || "Product details available from the seller."}</p><dl><div><dt>Starting price</dt><dd>₹{Number(product.basePrice).toLocaleString("en-IN")}</dd></div><div><dt>Auction status</dt><dd>{product.auctionStatus}</dd></div></dl></div>
                    </article>)}</div>}
        </section>
    </main>;
}
