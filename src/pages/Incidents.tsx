import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle,
} from "lucide-react";

type Incident = {
  id: string;
  site_id: string;
  incident_type: string;
  description: string;
  severity: string;
  status: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
};

type Site = {
  id: string;
  name: string;
  location: string;
};

export default function Incidents({
  profile,
}: {
  profile: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
  } | null;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clearingId, setClearingId] = useState<string | null>(null);

  async function loadIncidents() {
    setLoading(true);

    let sitesQuery = supabase
      .from("sites")
      .select("id, name, location");

    // Clients can only see their own sites
    if (profile?.role === "Client") {
      sitesQuery = sitesQuery.eq("client_id", profile.id);
    }

    // Supervisors can only see their assigned sites
    if (profile?.role === "Supervisor") {
      sitesQuery = sitesQuery.eq("supervisor_id", profile.id);
    }

    const sitesResult = await sitesQuery;

    if (sitesResult.error) {
      console.error("Sites error:", sitesResult.error);
      setSites([]);
      setIncidents([]);
      setLoading(false);
      return;
    }

    const allowedSites = sitesResult.data || [];
    setSites(allowedSites);

    const allowedSiteIds = allowedSites.map((site) => site.id);

    // Clients and Supervisors only see incidents
    // belonging to their allowed sites
    if (
      (profile?.role === "Client" ||
        profile?.role === "Supervisor") &&
      allowedSiteIds.length === 0
    ) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    let incidentsQuery = supabase
      .from("incident_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (
      profile?.role === "Client" ||
      profile?.role === "Supervisor"
    ) {
      incidentsQuery = incidentsQuery.in(
        "site_id",
        allowedSiteIds,
      );
    }

    const incidentsResult = await incidentsQuery;

    if (incidentsResult.error) {
      console.error(
        "Incidents error:",
        incidentsResult.error,
      );
    } else {
      setIncidents(incidentsResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadIncidents();
  }, [profile?.id, profile?.role]);

  function getSite(siteId: string) {
    return sites.find((site) => site.id === siteId);
  }

  async function clearIncident(incidentId: string) {
    const confirmed = window.confirm(
      "Are you sure this incident has been resolved and the site is secure?",
    );

    if (!confirmed) {
      return;
    }

    setClearingId(incidentId);

    const { error } = await supabase
      .from("incident_logs")
      .update({ status: "Cleared" })
      .eq("id", incidentId);

    if (error) {
      console.error("Clear incident error:", error);
      alert("Unable to clear the incident. Please try again.");
      setClearingId(null);
      return;
    }

    setIncidents((current) =>
      current.map((incident) =>
        incident.id === incidentId
          ? { ...incident, status: "Cleared" }
          : incident,
      ),
    );

    setClearingId(null);
  }

  const filteredIncidents = incidents.filter((incident) => {
    const site = getSite(incident.site_id);

    const text = `
      ${incident.incident_type}
      ${incident.description}
      ${incident.severity}
      ${incident.status}
      ${site?.name || ""}
      ${site?.location || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="incidents-page">
      <header className="incidents-header">
        <div>
          <p className="page-eyebrow">OPERATIONS CENTER</p>

          <h1>Incidents</h1>

          <p className="page-subtitle">
            Monitor and manage security incidents across protected sites.
          </p>
        </div>

        <button className="refresh-button" onClick={loadIncidents}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="incident-summary">
        <div className="incident-summary-card">
          <div className="summary-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>Total Incidents</span>
            <strong>{incidents.length}</strong>
          </div>
        </div>

        <div className="incident-summary-card">
          <div className="summary-icon high">
            <ShieldAlert size={20} />
          </div>

          <div>
            <span>High / Critical</span>
            <strong>
              {
                incidents.filter(
                  (incident) =>
                    incident.severity?.toLowerCase() === "high" ||
                    incident.severity?.toLowerCase() === "critical",
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="incident-summary-card">
          <div className="summary-icon open">
            <Clock size={20} />
          </div>

          <div>
            <span>Open</span>
            <strong>
              {
                incidents.filter(
                  (incident) =>
                    incident.status?.toLowerCase() === "open",
                ).length
              }
            </strong>
          </div>
        </div>
      </section>

      <div className="incidents-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="incident-count">
          {filteredIncidents.length}{" "}
          {filteredIncidents.length === 1
            ? "incident"
            : "incidents"}
        </span>
      </div>

      {loading ? (
        <div className="incidents-empty">
          <div className="loading-spinner" />
          <span>Loading incidents...</span>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="incidents-empty">
          <AlertTriangle size={40} />

          <h2>No incidents found</h2>

          <p>
            {search
              ? "Try a different search term."
              : "No security incidents have been recorded."}
          </p>
        </div>
      ) : (
        <div className="incident-list">
          {filteredIncidents.map((incident) => {
            const site = getSite(incident.site_id);

            const canClear =
              profile?.role === "Supervisor" &&
              incident.status?.toLowerCase() !== "cleared";

            return (
              <div className="incident-card" key={incident.id}>
                <div className="incident-card-top">
                  <div className="incident-type">
                    <div className="incident-icon">
                      <AlertTriangle size={20} />
                    </div>

                    <div>
                      <h2>{incident.incident_type}</h2>

                      <span className="incident-site">
                        <MapPin size={14} />
                        {site?.name || "Unknown site"}

                        {site?.location
                          ? ` · ${site.location}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="incident-badges">
                    <span
                      className={`severity severity-${incident.severity?.toLowerCase()}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`incident-status status-${incident.status?.toLowerCase()}`}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>

                <p className="incident-description">
                  {incident.description}
                </p>

                <div className="incident-footer">
                  <span>
                    <Clock size={14} />
                    {new Date(
                      incident.created_at,
                    ).toLocaleString()}
                  </span>

                  {incident.image_url && (
                    <span className="media-indicator">
                      Image attached
                    </span>
                  )}

                  {incident.video_url && (
                    <span className="media-indicator">
                      Video attached
                    </span>
                  )}
                </div>

                {canClear && (
                  <div className="incident-actions">
                    <button
                      className="clear-incident-button"
                      onClick={() =>
                        clearIncident(incident.id)
                      }
                      disabled={clearingId === incident.id}
                    >
                      <CheckCircle size={16} />

                      {clearingId === incident.id
                        ? "Clearing..."
                        : "Clear Incident"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

