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

function AppShell() {
  const location = useLocation();
  const isSellerRoute = location.pathname.startsWith("/seller");

  return (
    <div className="app-shell">
      {isSellerRoute ? <SellerNavbar /> : <Navbar />}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/seller" replace />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/create-room" element={<CreateRoom />} />
          <Route path="/host/rooms" element={<MyRooms />} />
          <Route path="/host/rooms/:roomId" element={<RoomDetails />} />
          <Route path="/host/products" element={<Products />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/list-product" element={<ListProduct />} />
          <Route path="/seller/products" element={<MyProducts />} />
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