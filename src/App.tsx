import { useEffect, useState } from "react";
import splashVideo from "./assets/ngao-splash.mp4";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Dashboard from "./Dashboard";
import Sites from "./pages/Sites";
import Incidents from "./pages/Incidents";
import Personnel from "./pages/Personnel";
import Activity from "./pages/Activity";
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Users,
  Activity as ActivityIcon,
  Shield,
  Radio,
  LogOut,
} from "lucide-react";
import "./App.css";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  company_id: string | null;
};

type Page =
  | "dashboard"
  | "sites"
  | "incidents"
  | "personnel"
  | "activity";

const rolePermissions: Record<string, Page[]> = {
  "Operations Manager": [
    "dashboard",
    "sites",
    "incidents",
    "personnel",
    "activity",
  ],

  Supervisor: [
    "dashboard",
    "sites",
    "incidents",
    "personnel",
    "activity",
  ],

  Client: [
    "dashboard",
    "sites",
    "incidents",
    "activity",
  ],
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("dashboard");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
  setShowSplash(false);
}, 3000);
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await loadProfile(session.user.id);
      }

      setLoading(false);
    }

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("Profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile error:", error);
      } else {
        setProfile(data);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
  clearTimeout(splashTimer);
  subscription.unsubscribe();
};
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (showSplash) {
  return (
    <div className="splash-screen">
      <video
        src={splashVideo}
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}

  if (loading) {
    return (
      <div className="auth-loading">
        <div>
          <strong>NGAO</strong>
          <span>Loading secure environment...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const role = profile?.role || "User";

  const permissions = rolePermissions[role] || ["dashboard"];

  // If the current page isn't allowed for this role,
  // return the user to the dashboard.
  const safePage = permissions.includes(page) ? page : "dashboard";

  function canAccess(targetPage: Page) {
    return permissions.includes(targetPage);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        {/* BRAND */}
        <div className="brand">
          <div className="brand-mark">
            <Shield size={24} />
          </div>

          <div className="brand-text">
            <strong>NGAO</strong>
            <span>SENTINEL</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="nav-section">
          <p className="nav-label">{role.toUpperCase()}</p>

          <nav className="nav">
            {canAccess("dashboard") && (
              <button
                className={
                  safePage === "dashboard"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => setPage("dashboard")}
              >
                <LayoutDashboard size={19} />
                <span>Dashboard</span>
              </button>
            )}

            {canAccess("sites") && (
              <button
                className={
                  safePage === "sites"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => setPage("sites")}
              >
                <MapPin size={19} />
                <span>Protected Sites</span>
              </button>
            )}

            {canAccess("incidents") && (
              <button
                className={
                  safePage === "incidents"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => setPage("incidents")}
              >
                <AlertTriangle size={19} />
                <span>Incidents</span>
              </button>
            )}

            {canAccess("personnel") && (
              <button
                className={
                  safePage === "personnel"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => setPage("personnel")}
              >
                <Users size={19} />
                <span>Personnel</span>
              </button>
            )}

            {canAccess("activity") && (
              <button
                className={
                  safePage === "activity"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => setPage("activity")}
              >
                <ActivityIcon size={19} />
                <span>Activity</span>
              </button>
            )}
          </nav>
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">
          <div className="system-online">
            <span className="online-dot" />
            <span>System Online</span>
          </div>

          <div className="system-info">
            <Radio size={14} />
            <span>Live monitoring active</span>
          </div>

          <div className="user-info">
            <strong>{profile?.name || profile?.email}</strong>
            <span>{role}</span>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={15} />
            Sign out
          </button>

          <small>NGAO Sentinel v1.0</small>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        {safePage === "dashboard" && (
  <Dashboard profile={profile} />
)}

        {safePage === "sites" && <Sites profile={profile} />}

        {safePage === "incidents" && (
  <Incidents profile={profile} />
)}

        {safePage === "personnel" && (
  <Personnel profile={profile} />
)}

        {safePage === "activity" && (
  <Activity profile={profile} />
)}
      </main>
    </div>
  );
}

export default App;

