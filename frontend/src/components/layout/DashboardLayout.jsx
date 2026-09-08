import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function DashboardLayout() {
    return (
        <div className="app-frame">
            <Sidebar />
            <div className="app-main">
                <Topbar />
                <div className="app-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
