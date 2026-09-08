import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireRole from "./components/RequireRole";
import DashboardLayout from "./components/layout/DashboardLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HostLogin from "./pages/HostLogin";
import Profile from "./pages/Profile";

import BuyerRooms from "./pages/Buyer/Rooms";
import BuyerRoomDetails from "./pages/Buyer/RoomDetails";
import LiveAuctionRoom from "./pages/Buyer/LiveAuctionRoom";
import BuyerBookings from "./pages/Buyer/Bookings";
import BuyerDeals from "./pages/Buyer/Deals";
import BuyerDealDetails from "./pages/Buyer/DealDetails";

import SellerAddProduct from "./pages/Seller/AddProduct";
import SellerProducts from "./pages/Seller/Products";
import SellerDeals from "./pages/Seller/Deals";
import SellerDealDetails from "./pages/Seller/DealDetails";

import HostRooms from "./pages/Host/Rooms";
import HostCreateRoom from "./pages/Host/CreateRoom";
import HostRoomDetails from "./pages/Host/RoomDetails";
import HostVerifyProducts from "./pages/Host/VerifyProducts";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Signup />} />
                    <Route path="/host/login" element={<HostLogin />} />

                    <Route
                        path="/buyer"
                        element={<RequireRole role="buyer"><DashboardLayout /></RequireRole>}
                    >
                        <Route path="rooms" element={<BuyerRooms />} />
                        <Route path="rooms/:roomId" element={<BuyerRoomDetails />} />
                        <Route path="rooms/:roomId/live" element={<LiveAuctionRoom />} />
                        <Route path="bookings" element={<BuyerBookings />} />
                        <Route path="deals" element={<BuyerDeals />} />
                        <Route path="deals/:dealId" element={<BuyerDealDetails />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route
                        path="/seller"
                        element={<RequireRole role="seller"><DashboardLayout /></RequireRole>}
                    >
                        <Route path="products/new" element={<SellerAddProduct />} />
                        <Route path="products" element={<SellerProducts />} />
                        <Route path="deals" element={<SellerDeals />} />
                        <Route path="deals/:dealId" element={<SellerDealDetails />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route
                        path="/host"
                        element={<RequireRole role="host"><DashboardLayout /></RequireRole>}
                    >
                        <Route path="rooms" element={<HostRooms />} />
                        <Route path="rooms/new" element={<HostCreateRoom />} />
                        <Route path="rooms/:roomId" element={<HostRoomDetails />} />
                        <Route path="products" element={<HostVerifyProducts />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
