import {Link} from "react-router-dom";
function Navbar(){
    return(
        <nav>
            <Link to="/host">Dashboard</Link>
            <Link to="/host/create-room">Create Room</Link>
            <Link to="/host/rooms">My Rooms</Link>
            <Link to="/host/products">Products</Link>
        </nav>
    );
}
export default Navbar;