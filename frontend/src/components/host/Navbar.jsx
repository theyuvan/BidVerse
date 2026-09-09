import { Link } from "react-router-dom";
import { clearAuthSession } from "../../services/authSession";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-brand">Bidverse</div>

            <div className="navbar-links">
                <Link to="/host/dashboard">Dashboard</Link>
                <Link to="/host/rooms/create">Create Room</Link>
                <Link to="/host/rooms">My Rooms</Link>
                <Link to="/host/products">Products</Link>
                <Link to="/host/login" onClick={clearAuthSession}>Logout</Link>
            </div>
        </nav>
    );
}

export default Navbar;
