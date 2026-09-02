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

type DashboardProps = {
  profile: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
  } | null;
};

export default function Dashboard({ profile }: DashboardProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [incidents, setIncidents] = useState(0);
  const [guards, setGuards] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [profile?.id, profile?.role]);

  async function loadDashboard() {
    setLoading(true);

    // Get the current user's allowed sites
    let allowedSiteIds: string[] | null = null;

    // Clients and Supervisors need their site IDs first
    if (
      profile?.role === "Client" ||
      profile?.role === "Supervisor"
    ) {
      let sitesQuery = supabase
        .from("sites")
        .select("id");

      if (profile.role === "Client") {
        sitesQuery = sitesQuery.eq(
          "client_id",
          profile.id,
        );
      }

      if (profile.role === "Supervisor") {
        sitesQuery = sitesQuery.eq(
          "supervisor_id",
          profile.id,
        );
      }

      const {
        data: allowedSites,
        error: allowedSitesError,
      } = await sitesQuery;

      if (allowedSitesError) {
        console.error(
          "Allowed sites error:",
          allowedSitesError,
        );

        setSites([]);
        setIncidents(0);
        setGuards(0);
        setLoading(false);
        return;
      }

      allowedSiteIds = (allowedSites || []).map(
        (site) => site.id,
      );

      // User has no assigned sites
      if (allowedSiteIds.length === 0) {
        setSites([]);
        setIncidents(0);
        setGuards(0);
        setLoading(false);
        return;
      }
    }

    // Build sites query
    let sitesQuery = supabase
      .from("sites")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (
      profile?.role === "Client" &&
      profile?.id
    ) {
      sitesQuery = sitesQuery.eq(
        "client_id",
        profile.id,
      );
    }

    if (
      profile?.role === "Supervisor" &&
      profile?.id
    ) {
      sitesQuery = sitesQuery.eq(
        "supervisor_id",
        profile.id,
      );
    }

    // Build incidents query
    let incidentsQuery =
      supabase
        .from("incident_logs")
        .select("id", {
          count: "exact",
        });

    if (
      allowedSiteIds &&
      allowedSiteIds.length > 0
    ) {
      incidentsQuery = incidentsQuery.in(
        "site_id",
        allowedSiteIds,
      );
    }

    // Build attendance query
    let attendanceQuery =
      supabase
        .from("attendance_logs")
        .select("id", {
          count: "exact",
        });

    if (
      allowedSiteIds &&
      allowedSiteIds.length > 0
    ) {
      attendanceQuery = attendanceQuery.in(
        "site_id",
        allowedSiteIds,
      );
    }

    const [
      sitesResult,
      incidentsResult,
      attendanceResult,
    ] = await Promise.all([
      sitesQuery,
      incidentsQuery,
      attendanceQuery,
    ]);

    // SITES
    console.log(
      "SITES RESULT:",
      sitesResult,
    );

    if (!sitesResult.error) {
      setSites(sitesResult.data || []);
    } else {
      console.error(
        "Sites error:",
        sitesResult.error,
      );
      setSites([]);
    }

    // INCIDENTS
    if (incidentsResult.error) {
      console.error(
        "Incidents error:",
        incidentsResult.error,
      );
      setIncidents(0);
    } else {
      setIncidents(
        incidentsResult.count ?? 0,
      );
    }

    // ATTENDANCE
    if (attendanceResult.error) {
      console.error(
        "Attendance error:",
        attendanceResult.error,
      );
      setGuards(0);
    } else {
      setGuards(
        attendanceResult.count ?? 0,
      );
    }

    setLoading(false);
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="page-eyebrow">
            OPERATIONS CENTER
          </p>

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

      <section className="metrics-grid">
        <Metric
          icon={<MapPin />}
          label="Protected Sites"
          value={
            loading
              ? "—"
              : sites.length.toString()
          }
          description="Registered locations"
        />

        <Metric
          icon={<AlertTriangle />}
          label="Active Incidents"
          value={
            loading
              ? "—"
              : incidents.toString()
          }
          description="Recorded incidents"
          warning
        />

        <Metric
          icon={<Users />}
          label="Attendance"
          value={
            loading
              ? "—"
              : guards.toString()
          }
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

      <section className="dashboard-grid">
        <div className="dashboard-card sites-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">
                MONITORING
              </p>

              <h2>Protected Sites</h2>
            </div>

            <span className="card-count">
              {sites.length}{" "}
              {sites.length === 1
                ? "site"
                : "sites"}
            </span>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              <div className="loading-spinner" />

              <span>
                Loading protected sites...
              </span>
            </div>
          ) : sites.length === 0 ? (
            <div className="dashboard-empty">
              <MapPin size={32} />

              <strong>
                No protected sites
              </strong>

              <span>
                No protected sites are currently assigned to this account.
              </span>
            </div>
          ) : (
            <div className="site-list">
              {sites.map((site) => (
                <div
                  className="site-row"
                  key={site.id}
                >
                  <div className="site-marker">
                    <MapPin size={18} />
                  </div>

                  <div className="site-details">
                    <strong>
                      {site.name}
                    </strong>

                    <span>
                      {site.location}
                    </span>
                  </div>

                  <div className="site-right">
                    <span className="active-status">
                      <span />

                      {site.status ||
                        "ACTIVE"}
                    </span>

                    <ArrowUpRight size={17} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card status-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">
                SYSTEM
              </p>

              <h2>Live Status</h2>
            </div>

            <div className="status-icon">
              <Activity size={19} />
            </div>
          </div>

          <div className="operational">
            <span className="operational-pulse" />

            <div>
              <strong>
                Operational
              </strong>

              <span>
                Systems are running normally
              </span>
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

      <div className="dashboard-footer">
        <span>
          NGAO Sentinel Operations Platform
        </span>

        <span>
          Secure monitoring environment
        </span>
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
      <div
        className={`metric-icon ${
          warning ? "warning" : ""
        }`}
      >
        {icon}
      </div>

      <div className="metric-content">
        <span className="metric-label">
          {label}
        </span>

        <strong
          className={
            good ? "metric-good" : ""
          }
        >
          {value}
        </strong>

        <small>
          {description}
        </small>
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

