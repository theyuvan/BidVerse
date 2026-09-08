import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
            const response = await loginUser({email,password,role});
            const user = response.data;
            saveAuthSession(user, password);

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
            <p>Login to your account</p>

            <form onSubmit={handleSubmit}>
                <label>Email</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />

                <label>Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />

                <label>Role</label>
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="host">Host</option>
                </select>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </main>
    );
}

export default Login;
