import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { signOut, getAuthUser } from "../services/authSession";

const navigation = {
    buyer: [["/buyer", "Overview"], ["/buyer/rooms", "Auction rooms"], ["/buyer/deals", "My deals"]],
    seller: [["/seller", "Overview"], ["/seller/list-product", "List a product"], ["/seller/products", "My products"], ["/seller/deals", "My deals"]],
    host: [["/host/dashboard", "Overview"], ["/host/rooms", "Auction rooms"], ["/host/rooms/create", "Create room"], ["/host/products", "Products"]]
};

export default function AppNavigation() {
    const user = getAuthUser();
    const { pathname } = useLocation();
    const role = pathname.split("/")[1];
    const links = user ? navigation[role] : null;
    const [open, setOpen] = useState(false);
    return <header className="app-navigation">
        <Link className="brand" to={links ? navigation[role][0][0] : "/"} aria-label="Bidverse home">
            <span className="brand-mark" aria-hidden="true">b.</span> bidverse<span className="brand-period">.</span>
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>Menu {open ? "−" : "+"}</button>
        <nav id="main-navigation" className={open ? "app-nav-links is-open" : "app-nav-links"} aria-label="Main navigation">
            {links ? links.map(([to, label]) => <NavLink key={to} to={to} end
                className={({ isActive }) => isActive || ((to.endsWith("/rooms") || to.endsWith("/deals"))
                    && pathname.startsWith(`${to}/`) && !pathname.endsWith("/create")) ? "active" : ""}
                onClick={() => setOpen(false)}>{label}</NavLink>) : <>
                <a href="/#collections" onClick={() => setOpen(false)}>Explore collections</a>
                <a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>
            </>}
        </nav>
        <div className="nav-account">
            {links ? <><span className="account-avatar" title={user.name}>{user.name?.charAt(0)?.toUpperCase() || "B"}</span>
                <div className="account-copy"><strong>{user.name}</strong><small>{role} account</small></div>
                <Link className="nav-signout" to={role === "host" ? "/host/login" : "/login"} onClick={signOut}>Sign out</Link></>
                : <><Link to="/login">Sign in</Link><Link className="button-primary" to="/register">Get started ↗</Link></>}
        </div>
    </header>;
}
