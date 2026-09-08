import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { apiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { IconGavel } from "../components/layout/icons";
import "./auth.css";

// Host accounts are provisioned directly in the database, not through self-service
// signup -- this page is intentionally not linked from the public nav or landing page.
// A host is simply given this URL.
function HostLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { setSession } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const session = await loginUser({ email, password, role: "host" });
            setSession(session);
            navigate("/host/rooms", { replace: true });
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Invalid host credentials."));
        } finally {
            setSubmitting(false);
        }
    };

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
                    <span className="eyebrow" style={{ color: "var(--accent-strong)" }}>Host Panel</span>
                    <h1>Run the room.</h1>
                    <p>Verify products, build the lineup, and open the floor.</p>
                </div>
                <div />
            </section>

            <section className="auth-panel">
                <div className="auth-card">
                    <span className="eyebrow">Host access</span>
                    <h2>Host sign in</h2>
                    <p>Host accounts are set up by the BidVerse team.</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="field">
                            <span className="field-label">Email</span>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                        </label>
                        <label className="field">
                            <span className="field-label">Password</span>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </label>

                        {error && <p className="alert alert-error" role="alert">{error}</p>}

                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {submitting ? "Signing in..." : "Enter host panel"}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default HostLogin;
