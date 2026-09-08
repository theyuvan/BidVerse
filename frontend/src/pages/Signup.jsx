import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { apiErrorMessage } from "../services/api";
import { IconGavel } from "../components/layout/icons";
import "./auth.css";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("buyer");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            await registerUser({ name, email, phone, password, role });
            navigate("/login", { state: { registered: true } });
        } catch (requestError) {
            setError(apiErrorMessage(requestError, "Unable to create your account."));
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
                    <span className="eyebrow" style={{ color: "var(--accent-strong)" }}>Join the room</span>
                    <h1>List it, or win it.</h1>
                    <p>Sellers bring products to auction, buyers compete for them live. Pick your side.</p>
                </div>
                <div />
            </section>

            <section className="auth-panel">
                <div className="auth-card">
                    <span className="eyebrow">Create account</span>
                    <h2>Join BidVerse</h2>
                    <p>Start bidding or start selling in minutes.</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="role-toggle" role="radiogroup" aria-label="Account type">
                            <button type="button" className={role === "buyer" ? "active" : ""} onClick={() => setRole("buyer")}>Buyer</button>
                            <button type="button" className={role === "seller" ? "active" : ""} onClick={() => setRole("seller")}>Seller</button>
                        </div>

                        <label className="field">
                            <span className="field-label">Full name</span>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </label>
                        <label className="field">
                            <span className="field-label">Email</span>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </label>
                        <label className="field">
                            <span className="field-label">Phone</span>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                        </label>
                        <label className="field">
                            <span className="field-label">Password</span>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        </label>

                        {error && <p className="alert alert-error" role="alert">{error}</p>}

                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {submitting ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Log in</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Signup;
