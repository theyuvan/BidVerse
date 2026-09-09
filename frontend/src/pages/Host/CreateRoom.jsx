import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, getAvailableProducts } from "../../services/hostService";
import ProductPicker from "../../components/ProductPicker";
import "./CreateRoom.css";

export default function CreateRoom() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: "", seatLimit: "", advanceAmount: "", startTime: "" });
    const [products, setProducts] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState("");
    useEffect(() => {
        let stopped = false;
        getAvailableProducts().then(response => {
            if (stopped) return;
            setProducts(response.data);
            setSelectedIds(response.data.map(product => product.productId));
        }).catch(() => { if (!stopped) setLoadError("Unable to load approved products. Refresh this page to try again."); })
            .finally(() => { if (!stopped) setLoading(false); });
        return () => { stopped = true; };
    }, []);
    const change = event => setForm({ ...form, [event.target.name]: event.target.value });
    const submit = async event => {
        event.preventDefault(); setSaving(true); setError("");
        try {
            const response = await createRoom({ title: form.title.trim(), seatLimit: Number(form.seatLimit),
                advanceAmount: Number(form.advanceAmount), startTime: new Date(form.startTime).toISOString(), productIds: selectedIds });
            navigate(`/host/rooms/${response.data.roomId}`, { state: { message: "Room created with your selected products." } });
        } catch (error) { setError(error.response?.data?.detail || error.response?.data?.message || "Unable to create room. No changes were saved."); }
        finally { setSaving(false); }
    };
    return <main className="host-page host-room-builder">
        <header className="page-header"><div><span className="overline">SET THE STAGE</span><h1>Create an auction room</h1><p>Your approved, unassigned products are selected automatically. Make the collection your own.</p></div></header>
        <form onSubmit={submit}>
            <section className="host-builder-panel"><div className="host-step-heading"><span>01</span><div><h2>Room essentials</h2><p>A clear title and schedule help buyers plan ahead.</p></div></div>
                <div className="host-builder-fields">
                    <label>Room title<input name="title" value={form.title} onChange={change} required maxLength={200} disabled={saving} placeholder="e.g. The weekend collectors’ edit" /></label>
                    <label>Start time<input type="datetime-local" name="startTime" value={form.startTime} onChange={change} required disabled={saving} /><small>The room opens automatically, then bidding starts after 90 seconds.</small></label>
                    <label>Seat limit<input type="number" name="seatLimit" min="1" step="1" value={form.seatLimit} onChange={change} required disabled={saving} placeholder="Maximum buyers" /></label>
                    <label>Advance amount (₹)<input type="number" name="advanceAmount" min="0" step="0.01" value={form.advanceAmount} onChange={change} required disabled={saving} placeholder="Reservation advance" /></label>
                </div>
            </section>
            <section className="host-builder-panel"><div className="host-step-heading"><span>02</span><div><h2>Curate your products</h2><p>Uncheck anything you do not want. You can change the collection until the waiting room opens.</p></div></div>
                {loading ? <p className="empty-state">Finding approved products…</p> : loadError ? <p className="form-error" role="alert">{loadError}</p>
                    : <ProductPicker products={products} selectedIds={selectedIds} onChange={setSelectedIds} disabled={saving} />}
            </section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="host-builder-submit"><p>{selectedIds.length ? "Your selected products will be added when the room is created." : "An empty room cannot start until products are added."}</p><button type="submit" disabled={loading || saving || !!loadError}>{saving ? "Creating room…" : "Create auction room →"}</button></div>
        </form>
    </main>;
}
