import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">Bidverse</div>

            <nav className="sidebar-links">
                <Link to="/host/dashboard">Dashboard</Link>
                <Link to="/host/rooms/create">Create Room</Link>
                <Link to="/host/rooms">My Rooms</Link>
                <Link to="/host/products">Products</Link>
            </nav>
        </aside>
    );
}

export default Sidebar;