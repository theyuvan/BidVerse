import { Link } from "react-router-dom";
import { clearAuthSession } from "../../services/authSession";
import "../host/Navbar.css";

function BuyerNavbar() {
    return (
        <nav className="navbar" aria-label="Buyer navigation">
            <Link className="navbar-brand" to="/buyer">Bidverse</Link>
            <div className="navbar-links">
                <Link to="/buyer/rooms">Booking Rooms</Link>
                <Link to="/buyer/deals">Deals</Link>
                <Link to="/login" onClick={clearAuthSession}>Logout</Link>
            </div>
        </nav>
    );
}

export default BuyerNavbar;
