import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HostLogin from "./pages/Host/HostLogin";
import { useLayoutEffect } from "react";
import AppNavigation from "./components/AppNavigation";
import Footer from "./components/Footer";
import { AuthVisual } from "./components/Showcase";
import HostDashboard from "./pages/Host/HostDashboard";
import MyRooms from "./pages/Host/MyRooms";
import Products from "./pages/Host/Products";
import CreateRoom from "./pages/Host/CreateRoom";
import RoomDetails from "./pages/Host/RoomDetails";
import SellerDashboard from "./pages/Seller/SellerDashboard";
import ListProduct from "./pages/Seller/ListProduct";
import MyProducts from "./pages/Seller/MyProducts";
import SellerDeals from "./pages/Seller/SellerDeals";
import SellerDealDetails from "./pages/Seller/SellerDealDetails";
import BuyerDashboard from "./pages/Buyer/BuyerDashboard";
import BuyerRoomDetails from "./pages/Buyer/RoomDetails";
import LiveAuctionRoom from "./pages/Buyer/LiveAuctionRoom";
import BuyerDeals, { BuyerDealDetails } from "./pages/Buyer/BuyerDeals";
import { getAuthUser } from "./services/authSession";
import "./pages/Seller/Seller.css";
import "./Theme.css";
import "./HostWorkspace.css";

const roleHome = {
    buyer: "/buyer",
    seller: "/seller",
    host: "/host/dashboard"
};

function RequireRole({ role, children }) {
    const user = getAuthUser();
    const currentRole = user?.role?.toLowerCase();

    if (!user) {
        return <Navigate to={role === "host" ? "/host/login" : "/login"} replace />;
    }

    if (currentRole !== role) {
        return <Navigate to={roleHome[currentRole] || "/login"} replace />;
    }

    return children;
}

function AppShell() {
    const location = useLocation();
    const isAuthRoute = ["/login", "/register", "/host/login"].includes(location.pathname);
    useLayoutEffect(() => {
        if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    }, [location.pathname, location.hash]);

    return (
        <div className={`app-shell ${isAuthRoute ? "auth-shell" : ""}`}>
            <a className="skip-link" href="#page-content">Skip to content</a>
            {isAuthRoute ? null : <AppNavigation key={location.pathname} />}
            <div id="page-content" className={isAuthRoute ? "page-content auth-layout" : "page-content"}>
                {isAuthRoute && <AuthVisual />}
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Signup />} />
                    <Route path="/host/login" element={<HostLogin />} />
                    <Route path="/host/dashboard" element={<RequireRole role="host"><HostDashboard /></RequireRole>} />
                    <Route path="/host/rooms/create" element={<RequireRole role="host"><CreateRoom /></RequireRole>} />
                    <Route path="/host/rooms" element={<RequireRole role="host"><MyRooms /></RequireRole>} />
                    <Route path="/host/rooms/:roomId" element={<RequireRole role="host"><RoomDetails /></RequireRole>} />
                    <Route path="/host/products" element={<RequireRole role="host"><Products /></RequireRole>} />
                    <Route path="/seller" element={<RequireRole role="seller"><SellerDashboard /></RequireRole>} />
                    <Route path="/seller/list-product" element={<RequireRole role="seller"><ListProduct /></RequireRole>} />
                    <Route path="/seller/products" element={<RequireRole role="seller"><MyProducts /></RequireRole>} />
                    <Route path="/seller/deals" element={<RequireRole role="seller"><SellerDeals /></RequireRole>} />
                    <Route path="/seller/deals/:dealId" element={<RequireRole role="seller"><SellerDealDetails /></RequireRole>} />
                    <Route path="/buyer" element={<RequireRole role="buyer"><BuyerDashboard /></RequireRole>} />
                    <Route path="/buyer/rooms" element={<RequireRole role="buyer"><BuyerDashboard roomsOnly /></RequireRole>} />
                    <Route path="/buyer/rooms/:roomId" element={<RequireRole role="buyer"><BuyerRoomDetails /></RequireRole>} />
                    <Route path="/buyer/rooms/:roomId/live" element={<RequireRole role="buyer"><LiveAuctionRoom /></RequireRole>} />
                    <Route  path="/buyer/deals"  element={ <RequireRole role="buyer"> <BuyerDeals /> </RequireRole>}/> 
                    <Route path="/buyer/deals/:dealId" element={ <RequireRole role="buyer"> <BuyerDealDetails /> </RequireRole>}/>
                </Routes>
            </div>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}

export default App;
