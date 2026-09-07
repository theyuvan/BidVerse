import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

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
import SellerDeals from "./pages/Seller/SellerDeals";
import SellerDealDetails from "./pages/Seller/SellerDealDetails";
import BuyerDashboard from "./pages/Buyer/BuyerDashboard";
import BuyerRoomDetails from "./pages/Buyer/RoomDetails";
import BuyerNavbar from "./components/buyer/Navbar";
import "./pages/Seller/Seller.css";

function AppShell() {
    const location = useLocation();
    const isSellerRoute = location.pathname.startsWith("/seller");
    const isBuyerRoute = location.pathname.startsWith("/buyer");

    return (
        <div className="app-shell">
            {isSellerRoute ? <SellerNavbar /> : isBuyerRoute ? <BuyerNavbar /> : <Navbar />}
            <div className="page-content">
                <Routes>
                    <Route path="/" element={<Navigate to="/host/dashboard" replace />} />
                    <Route path="/host/dashboard" element={<HostDashboard />} />
                    <Route path="/host/rooms/create" element={<CreateRoom />} />
                    <Route path="/host/rooms" element={<MyRooms />} />
                    <Route path="/host/rooms/:roomId" element={<RoomDetails />} />
                    <Route path="/host/products" element={<Products />} />
                    <Route path="/seller" element={<SellerDashboard />} />
                    <Route path="/seller/list-product" element={<ListProduct />} />
                    <Route path="/seller/products" element={<MyProducts />} />
                    <Route path="/seller/deals" element={<SellerDeals />} />
                    <Route path="/seller/deals/:dealId" element={<SellerDealDetails />} />
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