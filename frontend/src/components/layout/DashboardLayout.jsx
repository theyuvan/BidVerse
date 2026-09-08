import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import "./layout.css";

export default function DashboardLayout() {
    return (
        <div className="app-shell">
            <TopNav />
            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}
