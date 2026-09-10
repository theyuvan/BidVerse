import { Link } from "react-router-dom";
import { getAuthUser } from "../services/authSession";
import Brand from "./Brand";

export default function Footer() {
    const role = getAuthUser()?.role?.toLowerCase();
    return <footer className="site-footer">
        <div className="footer-main"><div><Brand />
            <p>A new home for remarkable finds.<br />Discover. Bid. Make it yours.</p></div>
            <div><span className="footer-label">Explore Bidverse</span><Link to={role === "buyer" ? "/buyer/rooms" : "/login"}>Discover auctions</Link><Link to={role === "seller" ? "/seller/list-product" : "/register"}>Become a seller</Link></div>
            <div><span className="footer-label">Your workspace</span>{role === "host" ? <Link to="/host/dashboard">Manage auctions</Link> : <Link to={role === "seller" ? "/seller/deals" : role === "buyer" ? "/buyer/deals" : "/login"}>Manage your deals</Link>}<Link to="/">About Bidverse</Link></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Bidverse. All rights reserved.</span><span>Made for the thrill of discovery.</span></div>
    </footer>;
}
