import {Link} from "react-router-dom";
function Navbar(){
    return(
        <nav className="sidebar" aria-label="Host navigation">
            <div className="sidebar-brand">Bidverse</div>
            <div className="sidebar-links">
                <Link to="/host">Dashboard</Link>
                <Link to="/host/create-room">Create Room</Link>
                <Link to="/host/rooms">My Rooms</Link>
                <Link to="/host/products">Products</Link>
            </div>
        </nav>
    );
}
export default Navbar;