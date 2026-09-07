import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("buyer");
    const navigate = useNavigate();
    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            const response = await loginUser({email,password,role});
            console.log(response.data);

            if(response.data === "Login successful"){
                if(role === "buyer"){
                    navigate("/buyer/dashboard");
                }
                else if(role === "seller"){
                    navigate("/seller");
                }
                else if( role === "host"){
                    navigate("/host/dashboard"); 
                }
            }
        }
        catch(error){
            console.error(error);
        }
    };

    return (
        <main className="login-page">
            <h1>BidVerse</h1>
            <h2>Welcome Back</h2>
            <p>Login to your account</p>

            <form onSubmit={handleSubmit}>
                <label>Email</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

                <label>Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

                <label>Role</label>
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="host">Host</option>
                </select>

                <button type="submit">Login</button>
            </form>
        </main>
    );
}

export default Login;