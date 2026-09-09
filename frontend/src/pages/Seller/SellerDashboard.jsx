import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerProductHistory } from "../../services/sellerService";
import { getSellerProfile } from "../../services/sellerSession";
import "./Seller.css";
import Showcase from "../../components/Showcase";

function SellerDashboard() {
    const [error, setError] = useState("");
    const [products, setProducts] = useState([]);
    const profile = getSellerProfile();
    const sellerId = profile?.id;
    const sellerName = profile?.name || "Seller";

    useEffect(() => {
        let cancelled = false;

        if (sellerId) {
            getSellerProductHistory(sellerId).then((response) => {
                if (!cancelled) setProducts(response.data);
            }).catch(() => {
                if (!cancelled) setError("Unable to load seller activity.");
            });
        }

        return () => {
            cancelled = true;
        };
    }, [sellerId]);

    return (
        <main className="seller-page">
            <header className="page-header seller-page-header seller-welcome">
                <div><h1>Welcome back, {sellerName}!</h1><p>Here's what's happening with your auctions today.</p></div>
            </header>
            <Showcase role="seller" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <section className="seller-stat-grid" aria-label="Seller summary">
                <div className="seller-stat"><span className="seller-stat-label">Total listings</span><strong>{products.length}</strong><small>Products in your workspace</small></div>
                <div className="seller-stat"><span className="seller-stat-label">Active auctions</span><strong>{products.filter((product) => ["active", "live", "running"].includes(product.auctionStatus?.toLowerCase())).length}</strong><small>Currently accepting bids</small></div>
                <div className="seller-stat"><span className="seller-stat-label">Pending review</span><strong>{products.filter((product) => product.productStatus?.toLowerCase() === "pending").length}</strong><small>Awaiting host verification</small></div>
                <div className="seller-stat"><span className="seller-stat-label">Completed sales</span><strong>{products.filter((product) => ["sold", "completed"].includes(product.dealStatus?.toLowerCase())).length}</strong><small>Successful deal records</small></div>
            </section>
            <section className="seller-action-grid">
                <Link className="seller-action-card" to="/seller/list-product">
                    <span className="seller-action-number">01</span>
                    <h2>List a new product</h2>
                    <p>Send a product to the host for approval.</p>
                </Link>
                <Link className="seller-action-card" to="/seller/products">
                    <span className="seller-action-number">02</span>
                    <h2>Track your products</h2>
                    <p>See approval, auction, and buyer details in one place.</p>
                </Link>
                <Link className="seller-action-card seller-action-card-accent" to="/seller/deals">
                    <span className="seller-action-number">03</span>
                    <h2>Verify buyer deals</h2>
                    <p>Review the winning offer and confirm or cancel the deal.</p>
                </Link>
            </section>

            <section className="seller-section" aria-labelledby="recent-auctions-heading">
                <div className="section-heading"><div><span className="eyebrow">Your activity</span><h2 id="recent-auctions-heading">Recent auctions</h2></div></div>
                {products.length === 0 ? <p className="empty-state">Your auction activity will appear here after you list a product.</p> : <div className="recent-list">{products.slice(0, 5).map((product) => <div className="recent-item" key={product.productId}><div><strong>{product.name}</strong><span>{product.categoryName || "Uncategorized"} · Base price Rs. {product.basePrice}</span></div><span className={`product-status ${(product.auctionStatus || product.productStatus || "pending").toLowerCase()}`}>{product.auctionStatus || product.productStatus || "Pending"}</span></div>)}</div>}
            </section>

        </main>
    );
}

export default SellerDashboard;
