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
                {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
                    <p className="empty-state">No products found.</p>
                )}
                <div className="product-card-grid">
                    {filteredProducts.map((product) => (
                        <div className="product-card" key={product.productId}>

                    <div className="product-image">
                        <img
                            src={product.imageUrl}
                            alt={product.productName}
                        />
                    </div>

                    <div className="product-details">
                        <h2>{product.productName}</h2>

                        <p>{product.description || "No description"}</p>

                        <p>Seller: {product.sellerName || "Unknown"}</p>

                        <p>Base Price: ₹{product.basePrice}</p>

                        <span className={`product-status ${product.status?.toLowerCase()}`}>
                            {product.status}
                        </span>

                        {product.status?.toLowerCase() === "pending" && (
                            <div className="product-actions">
                                <button
                                    onClick={() =>
                                        handleDecision(product.productId, "approved")
                                    }
                                    disabled={updatingId === product.productId}
                                >
                                    Approve
                                </button>

                                <button
                                    onClick={() =>
                                        handleDecision(product.productId, "rejected")
                                    }
                                    disabled={updatingId === product.productId}
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>

                </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Products;