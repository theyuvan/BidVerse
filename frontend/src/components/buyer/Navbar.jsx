import { Link } from "react-router-dom";
import "../host/Navbar.css";

function Navbar() {
    return (
        <nav className="navbar" aria-label="Buyer navigation">
            <div className="navbar-brand">Bidverse</div>
            <div className="navbar-links">
                <Link to="/buyer">Available Rooms</Link>
                <Link to="/host/dashboard">Host workspace</Link>
            </div>
        </nav>
    );
}

export default Navbar;
