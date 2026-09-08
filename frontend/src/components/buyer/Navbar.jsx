import { Link } from "react-router-dom";
import "../host/Navbar.css";

function BuyerNavbar() {
    return (
        <nav className="navbar" aria-label="Buyer navigation">
            <Link className="navbar-brand" to="/buyer">Bidverse</Link>
            <div className="navbar-links">
                <Link to="/buyer">Available Rooms</Link>
                <Link to="/buyer/deals">Deals</Link>
                <Link to="/host/dashboard">Host workspace</Link>
            </div>
        </nav>
    );
}

export default BuyerNavbar;
