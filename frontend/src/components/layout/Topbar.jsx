import { useAuth } from "../../context/AuthContext";
import { IconBell } from "./icons";
import "./layout.css";

function initials(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function Topbar() {
    const { session } = useAuth();

    return (
        <header className="topbar">
            <div className="topbar-right">
                <button type="button" className="topbar-icon-btn" aria-label="Notifications">
                    <IconBell />
                    <span className="topbar-icon-dot" />
                </button>
                <div className="topbar-user">
                    <span className="topbar-avatar">{initials(session?.name)}</span>
                    <div className="topbar-user-meta">
                        <strong>{session?.name || "Account"}</strong>
                        <span className="badge badge-neutral">{session?.role}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
