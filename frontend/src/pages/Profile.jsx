import { useAuth } from "../context/AuthContext";
import { IconGavel } from "../components/layout/icons";
import "./shared.css";

function initials(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

const ROLE_COPY = {
    buyer: "Book seats, join live rooms, and bid.",
    seller: "List products and settle deals once they sell.",
    host: "Verify products and run the auction floor."
};

export default function Profile() {
    const { session, logout } = useAuth();

    return (
        <div>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Account</span>
                    <h1>Profile</h1>
                </div>
            </div>

            <div className="card" style={{ padding: 28, maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(160deg, var(--accent-strong), var(--accent))",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22
                    }}>
                        {initials(session?.name)}
                    </div>
                    <div>
                        <h2 style={{ fontSize: 19 }}>{session?.name}</h2>
                        <span className="badge badge-info" style={{ marginTop: 6, textTransform: "capitalize" }}>{session?.role}</span>
                    </div>
                </div>

                <dl className="fact-list">
                    <div><dt>Email</dt><dd>{session?.email}</dd></div>
                    <div><dt>User ID</dt><dd>#{session?.userId}</dd></div>
                </dl>

                <p style={{ fontSize: 13 }}>
                    <IconGavel width={14} height={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                    {ROLE_COPY[session?.role]}
                </p>

                <button className="btn btn-danger" onClick={logout} style={{ alignSelf: "flex-start" }}>Log out</button>
            </div>
        </div>
    );
}
