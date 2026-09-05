import { useEffect, useState } from "react";
import { getProducts, verifyProduct } from "../../services/hostService";
import "./Products.css";
function Products(){
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const[filter,setFilter] = useState("all");

    useEffect(() => {
        getProducts()
            .then((response) => setProducts(response.data))
            .catch(() => setError("Unable to load pending products."))
            .finally(() => setLoading(false));
    }, []);

    const handleDecision = async (productId, status) => {
        setUpdatingId(productId);
        setError("");

        try {
            await verifyProduct(productId, status);

            setProducts((currentProducts) =>
                currentProducts.filter(
                    (product) => product.productId !== productId
                )
            );
        } catch (requestError) {
            console.log("VERIFY ERROR:", requestError);
            console.log("RESPONSE:", requestError.response?.data);

            const responseData = requestError.response?.data;

            setError(
                typeof responseData === "string"
                    ? responseData
                    : responseData?.message || "Unable to update product status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredProducts = filter === "all" ? products : products.filter((product) => product.status?.toLowerCase() === filter );
    return(
        <main className="host-page products-page">
            <header className="page-header">
                <h1>Products</h1>
            </header>

            <section className="products-section">
                {/* <div className="section-heading">
                    <span>{products.length} products</span>
                </div> */}
                <div className ="product-filters">
                    <button className={filter === "all" ? "active" : ""}  onClick={() =>setFilter ("all")} >All </button>
                    <button className={filter === "approved" ? "active" : ""}  onClick={() =>setFilter ("approved")} >Approved </button>
                    <button className={filter === "pending" ? "active" : ""}  onClick={() =>setFilter ("pending")} >Pending </button>
                    <button className={filter === "rejected" ? "active" : ""}  onClick={() =>setFilter ("rejected")} >Rejected</button>
                    
                </div>
                {loading && <p className="empty-state">Loading products...</p>}
                {!loading && error && <p className="form-error" role="alert">{error}</p>}
                {!loading && !error && products.length === 0 && (
                    <p className="empty-state">No products available.</p>
                )}
                {!loading && products.length > 0 && (
                    <div className="product-table-wrapper">
                        <table className="product-table">
                           <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Description</th>
                                <th>Seller Name</th>
                                <th>Base Price</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.productId}>
                                <td className="product-name">{product.name}</td>
                                <td>{product.description || "No description"}</td>
                                <td>{product.sellerName || "Unknown"}</td>
                                <td>₹{product.basePrice}</td>
                                <td><span className={`product-status ${product.status}`}>{product.status}</span></td>
                                <td>
                                    {product.status?.toLowerCase() === "pending" ? (
                                        <div className="product-actions">
                                            <button
                                                type="button"
                                                className="approve-button"
                                                disabled={updatingId === product.productId}
                                                onClick={() => handleDecision(product.productId, "approved")}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                className="reject-button"
                                                disabled={updatingId === product.productId}
                                                onClick={() => handleDecision(product.productId, "rejected")}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="action-complete">Reviewed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default Products;