import { Link } from "react-router-dom";

function SellerDashboard() {
    return (
        <main className="host-page seller-page">
            <header className="page-header">
                <span className="eyebrow">Seller workspace</span>
                <h1>Turn your products into auctions.</h1>
                <p>Submit products for host verification, then track every listing through the sale.</p>
            </header>
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
            </section>
        </main>
    );
}

export default SellerDashboard;
