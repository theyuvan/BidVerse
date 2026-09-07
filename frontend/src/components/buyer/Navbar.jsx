import { Link } from "react-router-dom";
import "../host/Navbar.css";

function BuyerNavbar() {
    return (
        <nav className="navbar">
            <Link className="navbar-brand" to="/buyer">Bidverse</Link>
            <div className="navbar-links">
                <Link to="/buyer">Auction rooms</Link>
            </div>
        </nav>
    );
}

export default BuyerNavbar;
