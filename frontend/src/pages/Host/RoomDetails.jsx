import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	assignProductToRoom,
	getProducts,
	getRoomDetails,
	getRoomProducts,
} from "../../services/hostService";

function RoomDetails() {
	const { roomId } = useParams();
	const [room, setRoom] = useState(null);
	const [assignedProducts, setAssignedProducts] = useState([]);
	const [approvedProducts, setApprovedProducts] = useState([]);
	const [selectedProductId, setSelectedProductId] = useState("");
	const [loading, setLoading] = useState(true);
	const [assigning, setAssigning] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	const loadRoom = async () => {
		const [roomResponse, roomProductsResponse, productsResponse] = await Promise.all([
			getRoomDetails(roomId),
			getRoomProducts(roomId),
			getProducts(),
		]);

		const roomProducts = roomProductsResponse.data;
		const assignedIds = new Set(roomProducts.map((product) => product.productId));

		setRoom(roomResponse.data);
		setAssignedProducts(roomProducts);
		setApprovedProducts(productsResponse.data.filter(
			(product) => product.status?.toLowerCase() === "approved"
				&& !assignedIds.has(product.productId)
		));
	};

	useEffect(() => {
		loadRoom()
			.catch(() => setError("Unable to load room details."))
			.finally(() => setLoading(false));
	}, [roomId]);

	const handleAssign = async (event) => {
		event.preventDefault();
		if (!selectedProductId) return;

		setAssigning(true);
		setError("");
		setMessage("");

		try {
			await assignProductToRoom(Number(selectedProductId), Number(roomId));
			await loadRoom();
			setSelectedProductId("");
			setMessage("Product added to this room.");
		} catch (requestError) {
			const responseData = requestError.response?.data;
			setError(typeof responseData === "string"
				? responseData
				: responseData?.message || "Unable to add product to this room.");
		} finally {
			setAssigning(false);
		}
	};

	if (loading) {
		return <main className="host-page"><p className="empty-state">Loading room details...</p></main>;
	}

	if (error && !room) {
		return <main className="host-page"><p className="form-error" role="alert">{error}</p></main>;
	}

	return (
		<main className="host-page room-details-page">
			<Link className="back-link" to="/host/rooms">Back to My Rooms</Link>
			<header className="page-header">
				<h1>{room.title}</h1>
				<p>Room #{room.roomId} · Manage auction products</p>
			</header>

			<section className="room-summary">
				<span className="room-status">{room.status}</span>
				<dl>
					<div><dt>Host ID</dt><dd>{room.hostId}</dd></div>
					<div><dt>Seats</dt><dd>{room.seatLimit}</dd></div>
					<div><dt>Advance</dt><dd>₹{room.advanceAmount}</dd></div>
					<div><dt>Starts</dt><dd>{room.startTime ? new Date(room.startTime).toLocaleString() : "Not scheduled"}</dd></div>
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
							<article className="assigned-product" key={product.auctionItemId}>
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
					<span>{approvedProducts.length} available</span>
				</div>
				<form className="assign-product-form" onSubmit={handleAssign}>
					<label htmlFor="approved-product">Approved product</label>
					<select
						id="approved-product"
						value={selectedProductId}
						onChange={(event) => setSelectedProductId(event.target.value)}
						disabled={assigning || approvedProducts.length === 0}
					>
						<option value="">Choose a product</option>
						{approvedProducts.map((product) => (
							<option key={product.productId} value={product.productId}>
								{product.name} · ₹{product.basePrice}
							</option>
						))}
					</select>
					<button type="submit" disabled={assigning || !selectedProductId}>
						{assigning ? "Adding..." : "Add Product"}
					</button>
				</form>
				{approvedProducts.length === 0 && <p className="empty-state">No approved products are available.</p>}
				{message && <p className="form-success" role="status">{message}</p>}
				{error && <p className="form-error" role="alert">{error}</p>}
			</section>
		</main>
	);
}

export default RoomDetails;