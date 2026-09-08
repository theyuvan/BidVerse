import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
        { to: "/buyer/deals", label: "Deals", icon: IconDeals }
    ],
    seller: [
        { to: "/seller/products/new", label: "Add Product", icon: IconAdd },
        { to: "/seller/products", label: "My Products", icon: IconList },
        { to: "/seller/deals", label: "Deals", icon: IconDeals }
    ],
    host: [
        { to: "/host/rooms", label: "Rooms", icon: IconRooms },
        { to: "/host/products", label: "Verify Products", icon: IconVerify },
        { to: "/host/rooms/new", label: "Create Room", icon: IconCreate }
    ]
};

function initials(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function TopNav() {
    const { session, logout } = useAuth();
    const navigate = useNavigate();
    const items = NAV_BY_ROLE[session?.role] || [];
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [menuOpen]);

    const viewProfile = () => {
        setMenuOpen(false);
        navigate(`/${session.role}/profile`);
    };

    return (
        <header className="topnav">
            <div className="topnav-brand">
                <span className="brand-mark"><IconGavel /></span>
                <span className="brand-word">BidVerse</span>
            </div>

            <nav className="topnav-links">
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} end className={({ isActive }) => `topnav-link${isActive ? " active" : ""}`}>
                        <Icon width={16} height={16} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="topnav-user" ref={menuRef}>
                <button type="button" className="topnav-avatar-btn" onClick={() => setMenuOpen((open) => !open)}>
                    <span className="topbar-avatar">{initials(session?.name)}</span>
                </button>

                {menuOpen && (
                    <div className="user-dropdown">
                        <div className="user-dropdown-head">
                            <strong>{session?.name || "Account"}</strong>
                            <span className="badge badge-neutral">{session?.role}</span>
                        </div>
                        <button type="button" className="user-dropdown-item" onClick={viewProfile}>
                            <IconProfile width={16} height={16} />
                            <span>View profile</span>
                        </button>
                        <button type="button" className="user-dropdown-item user-dropdown-item-danger" onClick={logout}>
                            <IconLogout width={16} height={16} />
                            <span>Log out</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
