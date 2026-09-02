import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

type Incident = {
  id: string;
  site_id: string;
  incident_type: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
};

type Attendance = {
  id: string;
  site_id: string;
  guard_name: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  created_at: string;
};


type ActivityEvent = {
  id: string;
  type: "incident" | "checkin" | "checkout";
  title: string;
  description: string;
  timestamp: string;
  siteName: string;
  severity?: string;
};

export default function Activity({
  profile,
}: {
  profile: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
  } | null;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadActivity() {
    setLoading(true);

    // First get the sites this user is allowed to see
    let sitesQuery = supabase
      .from("sites")
      .select("id, name, location");

    if (profile?.role === "Client") {
      sitesQuery = sitesQuery.eq("client_id", profile.id);
    }

    const sitesResult = await sitesQuery;

    if (sitesResult.error) {
      console.error("Activity sites error:", sitesResult.error);
      setEvents([]);
      setLoading(false);
      return;
    }

    const sites = sitesResult.data || [];
    const allowedSiteIds = sites.map((site) => site.id);

    // A Client with no assigned sites should see no activity
    if (
      profile?.role === "Client" &&
      allowedSiteIds.length === 0
    ) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Build incident query
    let incidentsQuery = supabase
      .from("incident_logs")
      .select(
        "id, site_id, incident_type, description, severity, status, created_at"
      );

    // Clients only see incidents from their assigned sites
    if (profile?.role === "Client") {
      incidentsQuery = incidentsQuery.in(
        "site_id",
        allowedSiteIds
      );
    }

    // Build attendance query
    let attendanceQuery = supabase
      .from("attendance_logs")
      .select(
        "id, site_id, guard_name, check_in, check_out, status, created_at"
      );

    // Clients only see attendance from their assigned sites
    if (profile?.role === "Client") {
      attendanceQuery = attendanceQuery.in(
        "site_id",
        allowedSiteIds
      );
    }

    const [incidentsResult, attendanceResult] = await Promise.all([
      incidentsQuery,
      attendanceQuery,
    ]);

    if (incidentsResult.error) {
      console.error(
        "Activity incidents error:",
        incidentsResult.error
      );
    }

    if (attendanceResult.error) {
      console.error(
        "Activity attendance error:",
        attendanceResult.error
      );
    }

    const incidents = incidentsResult.data || [];
    const attendance = attendanceResult.data || [];

    function getSiteName(siteId: string) {
      return (
        sites.find((site) => site.id === siteId)?.name ||
        "Unknown site"
      );
    }

    const incidentEvents: ActivityEvent[] = incidents.map(
      (incident: Incident) => ({
        id: `incident-${incident.id}`,
        type: "incident",
        title: incident.incident_type,
        description: incident.description,
        timestamp: incident.created_at,
        siteName: getSiteName(incident.site_id),
        severity: incident.severity,
      })
    );

    const attendanceEvents: ActivityEvent[] = [];

    attendance.forEach((person: Attendance) => {
      if (person.check_in) {
        attendanceEvents.push({
          id: `checkin-${person.id}`,
          type: "checkin",
          title: `${person.guard_name} checked in`,
          description: `Personnel attendance recorded as ${person.status}.`,
          timestamp: person.check_in,
          siteName: getSiteName(person.site_id),
        });
      }

      if (person.check_out) {
        attendanceEvents.push({
          id: `checkout-${person.id}`,
          type: "checkout",
          title: `${person.guard_name} checked out`,
          description: "Personnel checkout was recorded.",
          timestamp: person.check_out,
          siteName: getSiteName(person.site_id),
        });
      }
    });

    const combinedEvents = [
      ...incidentEvents,
      ...attendanceEvents,
    ];

    combinedEvents.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    );

    setEvents(combinedEvents);
    setLoading(false);
  }

  useEffect(() => {
    loadActivity();
  }, [profile?.id, profile?.role]);

  const filteredEvents = events.filter((event) => {
    const text = `
      ${event.title}
      ${event.description}
      ${event.siteName}
      ${event.type}
      ${event.severity || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="activity-page">
      <header className="activity-header">
        <div>
          <p className="page-eyebrow">OPERATIONS CENTER</p>

          <h1>Activity</h1>

          <p className="page-subtitle">
            Security audit trail of events across the NGAO Sentinel platform.
          </p>
        </div>

        <button className="refresh-button" onClick={loadActivity}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="activity-overview">
        <div className="activity-overview-card">
          <div className="activity-overview-icon">
            <ActivityIcon size={20} />
          </div>

          <div>
            <span>Total Events</span>
            <strong>{events.length}</strong>
          </div>
        </div>

        <div className="activity-overview-card">
          <div className="activity-overview-icon incident">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>Incidents</span>
            <strong>
              {events.filter((event) => event.type === "incident").length}
            </strong>
          </div>
        </div>

        <div className="activity-overview-card">
          <div className="activity-overview-icon personnel">
            <UserCheck size={20} />
          </div>

          <div>
            <span>Personnel Events</span>
            <strong>
              {
                events.filter(
                  (event) =>
                    event.type === "checkin" ||
                    event.type === "checkout"
                ).length
              }
            </strong>
          </div>
        </div>
      </section>

      <div className="activity-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="activity-count">
          {filteredEvents.length}{" "}
          {filteredEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {loading ? (
        <div className="activity-empty">
          <div className="loading-spinner" />
          <span>Loading activity...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="activity-empty">
          <ActivityIcon size={40} />

          <h2>No activity found</h2>

          <p>
            {search
              ? "Try a different search term."
              : "No security activity has been recorded yet."}
          </p>
        </div>
      ) : (
        <div className="activity-card">
          <div className="activity-card-header">
            <div>
              <p className="card-eyebrow">AUDIT TRAIL</p>
              <h2>Recent Activity</h2>
            </div>

            <span className="activity-live">
              <span />
              LIVE
            </span>
          </div>

          <div className="activity-timeline">
            {filteredEvents.map((event) => (
              <div className="activity-event" key={event.id}>
                <div className={`activity-event-icon ${event.type}`}>
                  {event.type === "incident" && (
                    <AlertTriangle size={18} />
                  )}

                  {event.type === "checkin" && (
                    <UserCheck size={18} />
                  )}

                  {event.type === "checkout" && (
                    <UserX size={18} />
                  )}
                </div>

                <div className="activity-event-content">
                  <div className="activity-event-top">
                    <div>
                      <h3>{event.title}</h3>

                      <span className="activity-site">
                        <MapPin size={13} />
                        {event.siteName}
                      </span>
                    </div>

                    {event.severity && (
                      <span
                        className={`severity severity-${event.severity.toLowerCase()}`}
                      >
                        {event.severity}
                      </span>
                    )}
                  </div>

                  <p>{event.description}</p>

                  <span className="activity-time">
                    <Clock size={13} />
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="activity-footer">
        <span>NGAO Sentinel Operations Platform</span>
        <span>Security audit environment</span>
      </div>
    </div>
  );
}