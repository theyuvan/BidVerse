import {BrowserRouter, Routes, Route} from "react-router-dom";

import Navbar from "./components/host/Navbar";
import HostDashboard from "./pages/Host/HostDashboard";
import MyRooms from "./pages/Host/MyRooms";
import Products from "./pages/Host/Products";
import CreateRoom from "./pages/Host/CreateRoom";

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/create-room" element={<CreateRoom />} />
        <Route path="/host/rooms" element={<MyRooms />} />
        <Route path="/host/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;