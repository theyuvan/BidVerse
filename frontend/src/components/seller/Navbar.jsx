import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="sidebar" aria-label="Seller navigation">
            <div className="sidebar-brand">Bidverse</div>
            <div className="sidebar-role">Seller workspace</div>
            <div className="sidebar-links">
                <Link to="/seller">Dashboard</Link>
                <Link to="/seller/list-product">List New Product</Link>
                <Link to="/seller/products">My Products</Link>
                <Link to="/host">Host workspace</Link>
            </div>
        </nav>
    );
}

export default Navbar;
