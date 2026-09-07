import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {assignProductToRoom,getAvailableProducts,getProducts,getRoomDetails,getRoomProducts,} from "../../services/hostService";
import "./RoomDetails.css";

async function fetchRoomData(roomId) {
	const [roomResponse, roomProductsResponse, productsResponse] = await Promise.all([
		getRoomDetails(roomId),
		getRoomProducts(roomId),
		getProducts(),
	]);

	const assignedProducts = roomProductsResponse.data;
	const assignedIds = new Set(assignedProducts.map((product) => product.productId));
	const approvedProducts = productsResponse.data.filter(
		(product) => product.status?.toLowerCase() === "approved"
			&& !assignedIds.has(product.productId)
	);

	return { room: roomResponse.data, assignedProducts, approvedProducts };
}

function RoomDetails() {
	const { roomId } = useParams();
	const [room, setRoom] = useState(null);
	const [assignedProducts, setAssignedProducts] = useState([]);
	const [approvedProducts, setApprovedProducts] = useState([]);
	const [allApprovedProducts, setAllApprovedProducts] = useState([]);
	const [selectedProduct, setSelectedProduct] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	const loadRoom = useCallback(async () => {
		try{
			const [roomResponse, roomProductsResponse, productsResponse] = await Promise.all([
				getRoomDetails(roomId),
				getRoomProducts(roomId),
				getAvailableProducts(),
			]);
			const allProductsResponse = await getProducts();

			const roomProducts = roomProductsResponse.data;

			setRoom(roomResponse.data);
			setAssignedProducts(roomProducts);
			setApprovedProducts(productsResponse.data);
			setAllApprovedProducts(allProductsResponse.data.filter(
				(product) => product.status?.toLowerCase() === "approved"
			));
		} catch(error){
			console.error("Error loading room:",error);
		}
	}, [roomId]);

	useEffect(() => {
		loadRoom();
	}, [loadRoom]);


	const handleAddProduct = async (event) => {
		event.preventDefault();
		if (!selectedProduct){
			return;
		}
		setError("");
		setMessage("");

		try {
			await assignProductToRoom(Number(selectedProduct), Number(roomId));
			setSelectedProduct("");
			await loadRoom();
			setMessage("Product added to this room.");
		} catch (error) {
			const responseData = error.response?.data;
			setError(
				typeof responseData === "string"
					? responseData
					: responseData?.message || "Unable to add product to this room."
			);
		} 
	};

	if (!room) {
		return <p>Loading room details...</p>;
	}

	return (
		<main className="host-page room-details-page">
			<Link className="back-link" to="/host/rooms">Back to My Rooms</Link>
			<header className="page-header">
				<h1>{room.title}</h1>
				<p>Room {room.roomId} · Manage auction products</p>
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
							<article className="assigned-product" key={product.productId}>
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
				{room.status?.toLowerCase() === "live" && (
					<p className="form-error" role="alert">Products cannot be added after this room has started.</p>
				)}
				<form className="assign-product-form" onSubmit={handleAddProduct}>
					<label htmlFor="approved-product">Approved product</label>
					<select
						id="approved-product"
						value={selectedProduct}
						onChange={(event) => setSelectedProduct(event.target.value)}
						disabled={approvedProducts.length === 0 || room.status?.toLowerCase() === "live"}
					>
						<option value="">Choose a product</option>
						{approvedProducts.map((product) => (
							<option key={product.productId} value={product.productId}>
										{product.productName} - {product.categoryName || "Uncategorized"} - ₹{product.basePrice}
							</option>
						))}
					</select>
					<button
						type="submit"
						disabled={!selectedProduct || room.status?.toLowerCase() === "live"}
					>
						Add Product
					</button>
				</form>
				{message && <p className="form-success" role="status">{message}</p>}
				{error && <p className="form-error" role="alert">{error}</p>}
				{approvedProducts.length === 0 && allApprovedProducts.length > 0 && (
					<p className="empty-state">All approved products are already assigned to rooms.</p>
				)}
				{/* {allApprovedProducts.length > 0 && (
					<div className="approved-product-list">
						<h3>Approved products from the database</h3>
						{allApprovedProducts.map((product) => (
							<p key={product.productId}>
								{product.productName} - ₹{product.basePrice}
								{approvedProducts.some((availableProduct) => availableProduct.productId === product.productId)
									? " (Available)"
									: " (Already assigned)"}
							</p>
						))}
					</div>
				)} */}
				{allApprovedProducts.length === 0 && (
					<p className="empty-state">No approved products found in the database.</p>
				)}
			</section>
		</main>
	);
}

export default RoomDetails;
