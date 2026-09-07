import {useNavigate} from "react-router-dom";
import "./Landing.css";

function Landing(){
    const navigate = useNavigate();

    return(
        <main className = "landing-page">
            <h1>Bidverse</h1>;
            <p>Connect. Bid. Win</p>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={()=> navigate("/register")}>Sign Up</button>
        </main>
    )
}
export default Landing;