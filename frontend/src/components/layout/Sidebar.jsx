import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    IconRooms, IconBookings, IconDeals, IconProfile,
    IconAdd, IconList, IconVerify, IconCreate, IconLogout, IconGavel
} from "./icons";
import "./layout.css";

const NAV_BY_ROLE = {
    buyer: [
        { to: "/buyer/rooms", label: "Rooms", icon: IconRooms },
        { to: "/buyer/bookings", label: "Bookings", icon: IconBookings },
        { to: "/buyer/deals", label: "Deals", icon: IconDeals },
        { to: "/buyer/profile", label: "Profile", icon: IconProfile }
    ],
    seller: [
        { to: "/seller/products/new", label: "Add Product", icon: IconAdd },
        { to: "/seller/products", label: "My Products", icon: IconList },
        { to: "/seller/deals", label: "Deals", icon: IconDeals },
        { to: "/seller/profile", label: "Profile", icon: IconProfile }
    ],
    host: [
        { to: "/host/rooms", label: "Rooms", icon: IconRooms },
        { to: "/host/products", label: "Verify Products", icon: IconVerify },
        { to: "/host/rooms/new", label: "Create Room", icon: IconCreate },
        { to: "/host/profile", label: "Profile", icon: IconProfile }
    ]
};

export default function Sidebar() {
    const { session, logout } = useAuth();
    const items = NAV_BY_ROLE[session?.role] || [];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="brand-mark"><IconGavel /></span>
                <span className="brand-word">BidVerse</span>
            </div>

            <nav className="sidebar-nav">
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    >
                        <Icon />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <button type="button" className="sidebar-logout" onClick={logout}>
                <IconLogout />
                <span>Log out</span>
            </button>
        </aside>
    );
}
