import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar seller-navbar" aria-label="Seller navigation">
            <div className="navbar-brand">Bidverse</div>
            <div className="navbar-links">
                <Link to="/seller">Dashboard</Link>
                <Link to="/seller/list-product">List New Product</Link>
                <Link to="/seller/products">My Products</Link>
                <Link to="/seller/deals">Deals</Link>
            </div>
        </nav>
    );
}

export default Navbar;
