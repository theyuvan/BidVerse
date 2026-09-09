import { Link, NavLink } from "react-router-dom";
import { clearAuthSession } from "../../services/authSession";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar seller-navbar" aria-label="Seller navigation">
            <Link className="navbar-brand" to="/seller">Bidverse</Link>
            <div className="navbar-links">
                <NavLink end to="/seller">Dashboard</NavLink>
                <NavLink to="/seller/list-product">List Product</NavLink>
                <NavLink to="/seller/products">My Products</NavLink>
                <NavLink to="/seller/deals">Deals</NavLink>
                <Link className="logout-link" to="/login" onClick={clearAuthSession}>Logout</Link>
            </div>
        </nav>
    );
}

export default Navbar;
