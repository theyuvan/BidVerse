import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { saveAuthSession } from "../services/authSession";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("buyer");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleSubmit = async(e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try{
            const response = await loginUser({email: email.trim(),password,role});
            const user = response.data;
            saveAuthSession(user);

            if(user.role === "buyer"){
                navigate("/buyer");
            }
            else if(user.role === "seller"){
                navigate("/seller");
            }
            else if(user.role === "host"){
                navigate("/host/dashboard");
            }
        }
        catch(error){
            setError(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Login failed. Check your email, password and role."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <h1>BidVerse</h1>
            <h2>Welcome Back</h2>
            <p>Good to see you again. Your next great find awaits.</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="login-email">Email address</label>
                <input id="login-email" autoComplete="email" placeholder="you@example.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />

                <label htmlFor="login-password">Password</label>
                <input id="login-password" autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />

                <label htmlFor="login-role">Sign in as</label>
                <select id="login-role" value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                </select>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            <div className="auth-links">New to Bidverse? <Link to="/register">Create an account →</Link></div>
        </main>
    );
}

export default Login;
