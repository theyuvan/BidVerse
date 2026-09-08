import { Link, NavLink } from "react-router-dom";
import { clearAuthSession } from "../../services/authSession";
import "../host/Navbar.css";

function BuyerNavbar() {
    return (
        <nav className="navbar buyer-navbar" aria-label="Buyer navigation">
            <Link className="navbar-brand" to="/buyer">Bidverse</Link>
            <div className="navbar-links">
                <NavLink to="/buyer/rooms">Booking Rooms</NavLink>
                <NavLink to="/buyer/deals">Deals</NavLink>
                <Link className="logout-link" to="/login" onClick={clearAuthSession}>Logout</Link>
            </div>
        </nav>
    );
}

export default BuyerNavbar;
