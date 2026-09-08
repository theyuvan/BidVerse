import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function homeFor(role) {
    if (role === "seller") return "/seller/products";
    if (role === "host") return "/host/rooms";
    return "/buyer/rooms";
}

export default function RequireRole({ role, children }) {
    const { session } = useAuth();
    const location = useLocation();

    if (!session) {
        const loginPath = role === "host" ? "/host/login" : "/login";
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (session.role !== role) {
        return <Navigate to={homeFor(session.role)} replace />;
    }

    return children;
}
