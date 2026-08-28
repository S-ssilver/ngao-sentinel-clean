import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  MapPin,
  AlertTriangle,
  Users,
  Activity,
  Radio,
  Clock,
  ArrowUpRight,
} from "lucide-react";

type Site = {
  id: string;
  name: string;
  location: string;
  status: string;
};

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [incidents, setIncidents] = useState(0);
  const [guards, setGuards] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const [sitesResult, incidentsResult, attendanceResult] =
        await Promise.all([
          supabase.from("sites").select("*"),
          supabase.from("incident_logs").select("id"),
          supabase.from("attendance_logs").select("id"),
        ]);

      if (!sitesResult.error) {
        setSites(sitesResult.data || []);
      } else {
        console.error(sitesResult.error);
      }

      if (!incidentsResult.error) {
        setIncidents(incidentsResult.data?.length || 0);
      } else {
        console.error(incidentsResult.error);
      }

      if (!attendanceResult.error) {
        setGuards(attendanceResult.data?.length || 0);
      } else {
        console.error(attendanceResult.error);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <p className="page-eyebrow">OPERATIONS CENTER</p>
          <h1>Security Dashboard</h1>
          <p className="page-subtitle">
            Central overview of protected sites and security operations.
          </p>
        </div>

        <div className="live-badge">
          <span className="live-dot" />
          <Radio size={16} />
          LIVE MONITORING
        </div>
      </header>

      {/* METRICS */}
      <section className="metrics-grid">
        <Metric
          icon={<MapPin />}
          label="Protected Sites"
          value={loading ? "—" : sites.length.toString()}
          description="Registered locations"
        />

        <Metric
          icon={<AlertTriangle />}
          label="Active Incidents"
          value={loading ? "—" : incidents.toString()}
          description="Recorded incidents"
          warning
        />

        <Metric
          icon={<Users />}
          label="Attendance"
          value={loading ? "—" : guards.toString()}
          description="Attendance records"
        />

        <Metric
          icon={<Activity />}
          label="System Status"
          value="ONLINE"
          description="All systems operational"
          good
        />
      </section>

      {/* MAIN CONTENT */}
      <section className="dashboard-grid">
        {/* SITES */}
        <div className="dashboard-card sites-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">MONITORING</p>
              <h2>Protected Sites</h2>
            </div>

            <span className="card-count">
              {sites.length} {sites.length === 1 ? "site" : "sites"}
            </span>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              <div className="loading-spinner" />
              <span>Loading protected sites...</span>
            </div>
          ) : sites.length === 0 ? (
            <div className="dashboard-empty">
              <MapPin size={32} />
              <strong>No protected sites</strong>
              <span>Add a site through Supabase to see it here.</span>
            </div>
          ) : (
            <div className="site-list">
              {sites.map((site) => (
                <div className="site-row" key={site.id}>
                  <div className="site-marker">
                    <MapPin size={18} />
                  </div>

                  <div className="site-details">
                    <strong>{site.name}</strong>
                    <span>{site.location}</span>
                  </div>

                  <div className="site-right">
                    <span className="active-status">
                      <span />
                      {site.status || "ACTIVE"}
                    </span>

                    <ArrowUpRight size={17} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SYSTEM STATUS */}
        <div className="dashboard-card status-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">SYSTEM</p>
              <h2>Live Status</h2>
            </div>

            <div className="status-icon">
              <Activity size={19} />
            </div>
          </div>

          <div className="operational">
            <span className="operational-pulse" />
            <div>
              <strong>Operational</strong>
              <span>Systems are running normally</span>
            </div>
          </div>

          <div className="status-list">
            <StatusRow
              icon={<Activity size={17} />}
              label="Database"
              value="Connected"
            />

            <StatusRow
              icon={<Radio size={17} />}
              label="Monitoring"
              value="Active"
            />

            <StatusRow
              icon={<Clock size={17} />}
              label="Last Sync"
              value="Just now"
            />
          </div>
        </div>
      </section>

      {/* FOOTER INFO */}
      <div className="dashboard-footer">
        <span>NGAO Sentinel Operations Platform</span>
        <span>Secure monitoring environment</span>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  description,
  warning,
  good,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  warning?: boolean;
  good?: boolean;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${warning ? "warning" : ""}`}>
        {icon}
      </div>

      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <strong className={good ? "metric-good" : ""}>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="status-row">
      <div className="status-label">
        {icon}
        <span>{label}</span>
      </div>

      <div className="status-value">
        <span className="status-check" />
        {value}
      </div>
    </div>
  );
}

