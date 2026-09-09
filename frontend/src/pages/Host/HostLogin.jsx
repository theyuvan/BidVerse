import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { saveAuthSession } from "../../services/authSession";
import "./HostLogin.css";

function HostLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await loginUser({
                email: email.trim(),
                password,
                role: "host"
            });
            const user = response.data;

            if (user.role?.toLowerCase() !== "host") {
                setError("This account does not have host access.");
                return;
            }

            saveAuthSession(user, password);
            navigate("/host/dashboard", { replace: true });
        } catch (requestError) {
            const data = requestError.response?.data;
            setError(
                data?.detail ||
                data?.message ||
                "Invalid host email or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="host-login-page">
            <section className="host-login-card" aria-labelledby="host-login-title">
                <Link className="host-login-brand" to="/">Bidverse</Link>
                <span className="host-login-label">Host access</span>
                <h1 id="host-login-title">Welcome back</h1>
                <p>Sign in to manage your auction rooms and products.</p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="host-email">Host email</label>
                    <input
                        id="host-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="host@example.com"
                        autoComplete="username"
                        required
                        autoFocus
                    />

                    <label htmlFor="host-password">Host password</label>
                    <input
                        id="host-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />

                    {error && <p className="host-login-error" role="alert">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Login as Host"}
                    </button>
                </form>

                <Link className="host-login-back" to="/">← Back to home</Link>
            </section>
        </main>
    );
}

export default HostLogin;
