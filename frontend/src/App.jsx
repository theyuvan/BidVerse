import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/host/Navbar";
import HostDashboard from "./pages/Host/HostDashboard";
import MyRooms from "./pages/Host/MyRooms";
import Products from "./pages/Host/Products";
import CreateRoom from "./pages/Host/CreateRoom";
import RoomDetails from "./pages/Host/RoomDetails";
import SellerNavbar from "./components/seller/Navbar";
import SellerDashboard from "./pages/Seller/SellerDashboard";
import ListProduct from "./pages/Seller/ListProduct";
import MyProducts from "./pages/Seller/MyProducts";
import BuyerDashboard from "./pages/Buyer/BuyerDashboard";
import BuyerRoomDetails from "./pages/Buyer/RoomDetails";

function AppShell() {
    const location = useLocation();
    const isLoginRoute = location.pathname === "/login";
    const isSellerRoute = location.pathname.startsWith("/seller");

    return (
        <div className="app-shell">
            {isLoginRoute ? null : isSellerRoute ? <SellerNavbar /> : <Navbar />}
            <div className="page-content">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Signup />} />
                    <Route path="/host/dashboard" element={<HostDashboard />} />
                    <Route path="/host/rooms/create" element={<CreateRoom />} />
                    <Route path="/host/rooms" element={<MyRooms />} />
                    <Route path="/host/rooms/:roomId" element={<RoomDetails />} />
                    <Route path="/host/products" element={<Products />} />
                    <Route path="/seller" element={<SellerDashboard />} />
                    <Route path="/seller/list-product" element={<ListProduct />} />
                    <Route path="/seller/products" element={<MyProducts />} />
                    {/* BUYER */}
                    <Route path="/buyer" element={<BuyerDashboard />}/>
                    <Route path="/buyer/rooms/:roomId" element={<BuyerRoomDetails />} />
                </Routes>
            </div>
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