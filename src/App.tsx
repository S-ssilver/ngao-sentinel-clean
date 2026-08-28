import { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Users,
  Activity,
  Shield,
  Radio,
} from "lucide-react";

import Dashboard from "./Dashboard";
import Sites from "./pages/Sites";
import "./App.css";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Shield size={25} />
          </div>

          <div className="brand-text">
            <strong>NGAO</strong>
            <span>SENTINEL</span>
          </div>
        </div>

        <div className="nav-section">
          <p className="nav-label">OPERATIONS</p>

          <nav className="nav">
            <button
              className={page === "dashboard" ? "nav-item active" : "nav-item"}
              onClick={() => setPage("dashboard")}
            >
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </button>

            <button
              className={page === "sites" ? "nav-item active" : "nav-item"}
              onClick={() => setPage("sites")}
            >
              <MapPin size={19} />
              <span>Protected Sites</span>
            </button>

            <button className="nav-item">
              <AlertTriangle size={19} />
              <span>Incidents</span>
              <span className="nav-soon">SOON</span>
            </button>

            <button className="nav-item">
              <Users size={19} />
              <span>Personnel</span>
              <span className="nav-soon">SOON</span>
            </button>

            <button className="nav-item">
              <Activity size={19} />
              <span>Activity</span>
              <span className="nav-soon">SOON</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="system-online">
            <span className="online-dot" />
            <span>System Online</span>
          </div>

          <div className="system-info">
            <Radio size={14} />
            <span>Live monitoring active</span>
          </div>

          <small>NGAO Sentinel v1.0</small>
        </div>
      </aside>

      <main className="main">
        {page === "dashboard" && <Dashboard />}
        {page === "sites" && <Sites />}
      </main>
    </div>
  );
}

export default App;

