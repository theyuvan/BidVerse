import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerCategories } from "../../services/sellerService";
import "./SellerDashboard.css";

function SellerDashboard() {
    const [categories, setCategories] = useState([]);
    const [categoryError, setCategoryError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getSellerCategories()
            .then((response) => {
                if (!cancelled) setCategories(response.data);
            })
            .catch(() => {
                if (!cancelled) setCategoryError("Unable to load categories.");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="host-page seller-page">
            <header className="page-header seller-page-header">
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
                <Link className="seller-action-card seller-action-card-accent" to="/seller/deals">
                    <span className="seller-action-number">03</span>
                    <h2>Verify buyer deals</h2>
                    <p>Review the winning offer and confirm or cancel the deal.</p>
                </Link>
            </section>

            <section className="category-panel">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Product setup</span>
                        <h2>Categories</h2>
                    </div>

                    <select className="category-dropdown">
                        <option value="">Choose a category</option>

                        {categories.map((category) => (
                            <option
                                key={category.categoryId}
                                value={category.categoryId}
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {categoryError && (
                    <p className="form-error" role="alert">
                        {categoryError}
                    </p>
                )}
            </section>
        </main>
    );
}

export default SellerDashboard;
