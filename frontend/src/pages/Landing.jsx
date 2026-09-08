import { useNavigate } from "react-router-dom";
import { IconGavel } from "../components/layout/icons";
import "./auth.css";

function Landing() {
    const navigate = useNavigate();

    return (
        <main className="auth-shell">
            <section className="auth-showcase">
                <div className="auth-brand">
                    <span className="brand-mark" style={{
                        background: "linear-gradient(160deg, var(--accent-strong), var(--accent))",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff"
                    }}><IconGavel /></span>
                    <span className="brand-word">BidVerse</span>
                </div>

                <div className="auth-showcase-copy">
                    <span className="eyebrow" style={{ color: "var(--accent-strong)" }}>Live auction rooms</span>
                    <h1>Connect. Bid. Win.</h1>
                    <p>
                        Hosts open the room, sellers bring the goods, buyers battle it out in real time.
                        One platform for the whole auction, start to sold.
                    </p>
                </div>

                <div className="auth-stat-row">
                    <div><strong>90s</strong><span>Room warm-up</span></div>
                    <div><strong>20s</strong><span>Anti-snipe window</span></div>
                    <div><strong>Live</strong><span>Real-time bidding</span></div>
                </div>
            </section>

            <section className="auth-panel">
                <div className="auth-card">
                    <span className="eyebrow">Get started</span>
                    <h2>Welcome to BidVerse</h2>
                    <p>Sign in as a buyer or seller to jump into the action.</p>
                    <div className="stack">
                        <button className="btn btn-primary btn-block" onClick={() => navigate("/login")}>Log in</button>
                        <button className="btn btn-ghost btn-block" onClick={() => navigate("/register")}>Create an account</button>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Landing;
