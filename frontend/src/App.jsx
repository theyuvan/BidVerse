import {BrowserRouter, Routes, Route} from "react-router-dom";

import Sidebar from "./components/host/Sidebar";
import HostDashboard from "./pages/Host/HostDashboard";
import MyRooms from "./pages/Host/MyRooms";
import Products from "./pages/Host/Products";
import CreateRoom from "./pages/Host/CreateRoom";
import RoomDetails from "./pages/Host/RoomDetails";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="page-content">
          <Routes>
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/create-room" element={<CreateRoom />} />
            <Route path="/host/rooms" element={<MyRooms />} />
            <Route path="/host/rooms/:roomId" element={<RoomDetails />} />
            <Route path="/host/products" element={<Products />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;