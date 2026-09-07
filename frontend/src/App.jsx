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
import BuyerDashboard from "./pages/Buyer/BuyerDashboard";
import BuyerRoomDetails from "./pages/Buyer/RoomDetails";
import LiveAuctionRoom from "./pages/Buyer/LiveAuctionRoom";
import BuyerNavbar from "./components/buyer/Navbar";

function AppShell() {
    const location = useLocation();
    const isSellerRoute = location.pathname.startsWith("/seller");
    const isBuyerRoute = location.pathname.startsWith("/buyer");

    let navbar = <Navbar />;
    if (isSellerRoute) navbar = <SellerNavbar />;
    if (isBuyerRoute) navbar = <BuyerNavbar />;

    return (
        <div className="app-shell">
            {navbar}
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
                    {/* BUYER */}
                    <Route path="/buyer" element={<BuyerDashboard />}/>
                    <Route path="/buyer/rooms/:roomId" element={<BuyerRoomDetails />} />
                    <Route path="/buyer/rooms/:roomId/live" element={<LiveAuctionRoom />} />
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
