import {useState} from "react";
import { useNavigate } from "react-router-dom";
import { SignupUser } from "../services/authService";
import "./Signup.css";

function Signup(){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("buyer");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await SignupUser({ name, email, phone, password, role });
            console.log(response.data);
            if (response.data === "Registration successful") navigate("/login");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <main className="signup-page">
            <h1>BidVerse</h1>
            <h2>Create Account</h2>
            <p>Join BidVerse and start bidding</p>
            <form onSubmit={handleSubmit}>
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="host">Host</option>
                </select>
                <button type="submit">Sign Up</button>
            </form>
        </main>
    );
}
export default Signup;