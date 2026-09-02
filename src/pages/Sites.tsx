import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Navigation,
  MoreHorizontal,
  X,
  Users,
  AlertTriangle,
  Activity,
  ArrowLeft,
  Trash2,
  ExternalLink,
  UserRound,
} from "lucide-react";

type Site = {
  id: string;
  name: string;
  location: string;
  status: string;
  client_id: string | null;
  supervisor_id: string | null;
};

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
};

type Incident = {
  id: string;
  incident_type: string;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: string;
};

type Attendance = {
  id: string;
  guard_name: string;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
};

export default function Sites({ profile }: { profile: Profile | null }) {
  const isOperationsManager =
    profile?.role === "Operations Manager";

  const isSupervisor =
    profile?.role === "Supervisor";

  const [sites, setSites] = useState<Site[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [siteName, setSiteName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [siteStatus, setSiteStatus] = useState("ACTIVE");
  const [clientId, setClientId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [formError, setFormError] = useState("");

  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function loadSites() {
    setLoading(true);

    let query = supabase
      .from("sites")
      .select("*")
      .order("created_at", { ascending: false });

    // Clients can only see their own sites
    if (profile?.role === "Client") {
      query = query.eq("client_id", profile.id);
    }

    // Supervisors can only see sites assigned to them
    if (isSupervisor && profile?.id) {
      query = query.eq("supervisor_id", profile.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Sites error:", error);
    } else {
      setSites(data || []);
    }

    setLoading(false);
  }

  async function loadProfiles() {
    setProfilesLoading(true);

    const { data, error } = await supabase
      .from("Profiles")
      .select("id, email, name, role")
      .in("role", ["Client", "Supervisor"])
      .order("name", { ascending: true });

    if (error) {
      console.error("Profiles error:", error);
      setFormError("Unable to load clients and supervisors.");
    } else {
      setProfiles(data || []);
    }

    setProfilesLoading(false);
  }

  useEffect(() => {
    loadSites();
  }, [profile?.id, profile?.role]);

  async function openAddModal() {
    setFormError("");
    setSiteName("");
    setSiteLocation("");
    setSiteStatus("ACTIVE");
    setClientId("");
    setSupervisorId("");
    setShowAddModal(true);

    if (profiles.length === 0) {
      await loadProfiles();
    }
  }

  async function addSite(e: React.FormEvent) {
    e.preventDefault();

    if (!siteName.trim() || !siteLocation.trim()) {
      setFormError(
        "Please enter both the site name and location.",
      );
      return;
    }

    setAdding(true);
    setFormError("");

    const { error } = await supabase.from("sites").insert({
      name: siteName.trim(),
      location: siteLocation.trim(),
      status: siteStatus,
      client_id: clientId || null,
      supervisor_id: supervisorId || null,
    });

    if (error) {
      console.error("Add site error:", error);
      setFormError(error.message);
      setAdding(false);
      return;
    }

    setSiteName("");
    setSiteLocation("");
    setSiteStatus("ACTIVE");
    setClientId("");
    setSupervisorId("");
    setAdding(false);
    setShowAddModal(false);

    await loadSites();
  }

  async function deleteSite() {
    if (!siteToDelete) return;

    setDeleting(true);
    setDeleteError("");

    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", siteToDelete.id);

    if (error) {
      console.error("Delete site error:", error);
      setDeleteError(error.message);
      setDeleting(false);
      return;
    }

    setSites((currentSites) =>
      currentSites.filter(
        (site) => site.id !== siteToDelete.id,
      ),
    );

    setSiteToDelete(null);
    setDeleting(false);
    setOpenMenu(null);
  }

  function getProfileName(profile: Profile) {
    return profile.name?.trim() || profile.email;
  }

  const clients = profiles.filter(
    (profile) =>
      profile.role?.toLowerCase() === "client",
  );

  const supervisors = profiles.filter(
    (profile) =>
      profile.role?.toLowerCase() === "supervisor",
  );

  if (selectedSite) {
    return (
      <SiteOperations
        site={selectedSite}
        onBack={() => setSelectedSite(null)}
      />
    );
  }

  return (
    <div
      className="sites-page"
      onClick={() => setOpenMenu(null)}
    >
      {/* HEADER */}
      <header className="sites-top">
        <div>
          <div className="breadcrumb">
            NGAO SENTINEL <span>/</span> SITE MANAGEMENT
          </div>

          <h1>Protected Sites</h1>

          <p>
            Monitor and manage locations under NGAO Sentinel protection.
          </p>
        </div>

        <div className="sites-top-actions">
          <button
            className="sites-refresh"
            onClick={loadSites}
          >
            <RefreshCw
              size={16}
              className={loading ? "spin" : ""}
            />
            Refresh
          </button>

          {isOperationsManager && (
            <button
              className="sites-add"
              onClick={(e) => {
                e.stopPropagation();
                openAddModal();
              }}
            >
              <Plus size={17} />
              Add Protected Site
            </button>
          )}
        </div>
      </header>

      {/* OVERVIEW */}
      <div className="sites-overview">
        <div className="overview-item">
          <div className="overview-symbol blue">
            <MapPin size={19} />
          </div>

          <div>
            <span>PROTECTED SITES</span>
            <strong>
              {loading ? "—" : sites.length}
            </strong>
          </div>
        </div>

        <div className="overview-divider" />

        <div className="overview-item">
          <div className="overview-symbol green">
            <ShieldCheck size={19} />
          </div>

          <div>
            <span>ACTIVE PROTECTION</span>
            <strong>
              {loading
                ? "—"
                : sites.filter(
                    (site) =>
                      !site.status ||
                      site.status.toLowerCase() === "active",
                  ).length}
            </strong>
          </div>
        </div>

        <div className="overview-divider" />

        <div className="overview-item">
          <div className="overview-symbol purple">
            <Navigation size={19} />
          </div>

          <div>
            <span>MONITORING</span>
            <strong className="monitoring-live">
              LIVE
            </strong>
          </div>
        </div>
      </div>

      {/* DIRECTORY HEADER */}
      <div className="sites-heading">
        <div>
          <span>REGISTERED LOCATIONS</span>
          <h2>Site Directory</h2>
        </div>

        <div className="directory-count">
          {sites.length}{" "}
          {sites.length === 1
            ? "LOCATION"
            : "LOCATIONS"}
        </div>
      </div>

      {/* DIRECTORY */}
      {loading ? (
        <div className="sites-loading">
          <div className="loading-spinner" />
          <strong>Loading protected sites</strong>
          <span>
            Connecting to NGAO Sentinel database...
          </span>
        </div>
      ) : sites.length === 0 ? (
        <div className="sites-loading">
          <div className="no-sites-icon">
            <MapPin size={30} />
          </div>

          <strong>
            No protected sites registered
          </strong>

          <span>
            Add a protected location to begin monitoring.
          </span>

          {isOperationsManager && (
            <button
              className="sites-add"
              onClick={(e) => {
                e.stopPropagation();
                openAddModal();
              }}
            >
              <Plus size={16} />
              Add Protected Site
            </button>
          )}
        </div>
      ) : (
        <div className="site-directory">
          {sites.map((site, index) => {
            const active =
              !site.status ||
              site.status.toLowerCase() === "active";

            const client = profiles.find(
              (profile) =>
                profile.id === site.client_id,
            );

            const supervisor = profiles.find(
              (profile) =>
                profile.id === site.supervisor_id,
            );

            return (
              <div
                className="protected-site"
                key={site.id}
              >
                <div className="site-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="protected-site-icon">
                  <MapPin size={23} />
                </div>

                <div className="protected-site-main">
                  <div className="protected-site-title">
                    <span>
                      PROTECTED LOCATION
                    </span>
                    <h3>{site.name}</h3>
                  </div>

                  <div className="protected-location">
                    <Navigation size={14} />
                    {site.location ||
                      "Location not specified"}
                  </div>

                  <div className="site-assignments">
                    {client && (
                      <span>
                        <UserRound size={13} />
                        Client:{" "}
                        {getProfileName(client)}
                      </span>
                    )}

                    {supervisor && (
                      <span>
                        <Users size={13} />
                        Supervisor:{" "}
                        {getProfileName(supervisor)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="protection-status">
                  <span
                    className={
                      active
                        ? "protection-active"
                        : "protection-inactive"
                    }
                  >
                    <i />
                    {site.status || "ACTIVE"}
                  </span>

                  <small>
                    {active
                      ? "Protection active"
                      : "Monitoring unavailable"}
                  </small>
                </div>

                {/* SITE MENU */}
                {isOperationsManager && (
                  <div
                    className="site-menu-wrapper"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <button
                      className="site-menu"
                      title="Site options"
                      onClick={() =>
                        setOpenMenu(
                          openMenu === site.id
                            ? null
                            : site.id,
                        )
                      }
                    >
                      <MoreHorizontal size={19} />
                    </button>

                    {openMenu === site.id && (
                      <div className="site-options-menu">
                        <button
                          onClick={() => {
                            setSelectedSite(site);
                            setOpenMenu(null);
                          }}
                        >
                          <ExternalLink size={16} />
                          Site Operations
                        </button>

                        <button
                          className="danger"
                          onClick={() => {
                            setSiteToDelete(site);
                            setDeleteError("");
                            setOpenMenu(null);
                          }}
                        >
                          <Trash2 size={16} />
                          Remove Site
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="sites-bottom">
        <span>
          NGAO SENTINEL SECURITY NETWORK
        </span>
        <span>
          Protected site monitoring active
        </span>
      </div>

      {/* ADD SITE MODAL */}
      {showAddModal && (
        <div
          className="site-modal-overlay"
          onClick={() =>
            !adding &&
            setShowAddModal(false)
          }
        >
          <div
            className="site-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="site-modal-header">
              <div>
                <span>NEW LOCATION</span>
                <h2>Add Protected Site</h2>
              </div>

              <button
                className="site-modal-close"
                onClick={() =>
                  setShowAddModal(false)
                }
                disabled={adding}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addSite}>
              <label>
                Site Name
                <input
                  type="text"
                  placeholder="e.g. Nakuru Protected Facility"
                  value={siteName}
                  onChange={(e) =>
                    setSiteName(e.target.value)
                  }
                  disabled={adding}
                />
              </label>

              <label>
                Location
                <input
                  type="text"
                  placeholder="e.g. Nakuru, Kenya"
                  value={siteLocation}
                  onChange={(e) =>
                    setSiteLocation(e.target.value)
                  }
                  disabled={adding}
                />
              </label>

              <label>
                Status
                <select
                  value={siteStatus}
                  onChange={(e) =>
                    setSiteStatus(e.target.value)
                  }
                  disabled={adding}
                >
                  <option value="ACTIVE">
                    ACTIVE
                  </option>
                  <option value="INACTIVE">
                    INACTIVE
                  </option>
                  <option value="MAINTENANCE">
                    MAINTENANCE
                  </option>
                </select>
              </label>

              {/* CLIENT */}
              <label>
                Client
                <select
                  value={clientId}
                  onChange={(e) =>
                    setClientId(e.target.value)
                  }
                  disabled={
                    adding || profilesLoading
                  }
                >
                  <option value="">
                    {profilesLoading
                      ? "Loading clients..."
                      : "Select client"}
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {getProfileName(client)}
                    </option>
                  ))}
                </select>
              </label>

              {/* SUPERVISOR */}
              <label>
                Supervisor
                <select
                  value={supervisorId}
                  onChange={(e) =>
                    setSupervisorId(e.target.value)
                  }
                  disabled={
                    adding || profilesLoading
                  }
                >
                  <option value="">
                    {profilesLoading
                      ? "Loading supervisors..."
                      : "Select supervisor"}
                  </option>

                  {supervisors.map(
                    (supervisor) => (
                      <option
                        key={supervisor.id}
                        value={supervisor.id}
                      >
                        {getProfileName(
                          supervisor,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {formError && (
                <div className="site-form-error">
                  {formError}
                </div>
              )}

              <div className="site-modal-actions">
                <button
                  type="button"
                  className="site-cancel"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  disabled={adding}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sites-add"
                  disabled={
                    adding || profilesLoading
                  }
                >
                  {adding ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Site
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {siteToDelete && (
        <div
          className="site-modal-overlay"
          onClick={() =>
            !deleting &&
            setSiteToDelete(null)
          }
        >
          <div
            className="site-delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="delete-icon">
              <Trash2 size={24} />
            </div>

            <h2>
              Remove Protected Site?
            </h2>

            <p>
              You are about to remove{" "}
              <strong>
                {siteToDelete.name}
              </strong>{" "}
              from the protected site directory.
            </p>

            <div className="delete-warning">
              <AlertTriangle size={16} />
              <span>
                This action cannot be undone.
                Existing attendance and incident
                records will not be deleted.
              </span>
            </div>

            {deleteError && (
              <div className="site-form-error">
                {deleteError}
              </div>
            )}

            <div className="delete-actions">
              <button
                className="site-cancel"
                onClick={() =>
                  setSiteToDelete(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="delete-confirm"
                onClick={deleteSite}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin"
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove Site
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SITE OPERATIONS
========================================================= */

function SiteOperations({
  site,
  onBack,
}: {
  site: Site;
  onBack: () => void;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOperations() {
      setLoading(true);

      const [
        incidentsResult,
        attendanceResult,
      ] = await Promise.all([
        supabase
          .from("incident_logs")
          .select("*")
          .eq("site_id", site.id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("attendance_logs")
          .select("*")
          .eq("site_id", site.id)
          .order("check_in", {
            ascending: false,
          }),
      ]);

      if (incidentsResult.error) {
        console.error(
          "Site incidents error:",
          incidentsResult.error,
        );
      } else {
        setIncidents(
          incidentsResult.data || [],
        );
      }

      if (attendanceResult.error) {
        console.error(
          "Site attendance error:",
          attendanceResult.error,
        );
      } else {
        setAttendance(
          attendanceResult.data || [],
        );
      }

      setLoading(false);
    }

    loadOperations();
  }, [site.id]);

  const presentGuards = attendance.filter(
    (guard) =>
      !guard.check_out &&
      (!guard.status ||
        guard.status.toLowerCase() ===
          "present"),
  );

  const openIncidents = incidents.filter(
    (incident) =>
      !incident.status ||
      incident.status.toLowerCase() ===
        "open",
  );

  return (
    <div className="sites-page site-operations-page">
      <button
        className="site-back-button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to Protected Sites
      </button>

      <header className="site-operations-header">
        <div>
          <div className="breadcrumb">
            NGAO SENTINEL <span>/</span> SITE OPERATIONS
          </div>

          <h1>{site.name}</h1>

          <p>
            <Navigation size={15} />
            {site.location}
          </p>
        </div>

        <span
          className={
            site.status?.toLowerCase() ===
            "active"
              ? "protection-active large"
              : "protection-inactive large"
          }
        >
          <i />
          {site.status || "ACTIVE"}
        </span>
      </header>

      <div className="site-operation-metrics">
        <div className="site-operation-metric">
          <div className="operation-metric-icon blue">
            <Users size={20} />
          </div>

          <div>
            <span>GUARDS ON DUTY</span>
            <strong>
              {loading
                ? "—"
                : presentGuards.length}
            </strong>
          </div>
        </div>

        <div className="site-operation-metric">
          <div className="operation-metric-icon red">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>OPEN INCIDENTS</span>
            <strong>
              {loading
                ? "—"
                : openIncidents.length}
            </strong>
          </div>
        </div>

        <div className="site-operation-metric">
          <div className="operation-metric-icon green">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>ATTENDANCE RECORDS</span>
            <strong>
              {loading
                ? "—"
                : attendance.length}
            </strong>
          </div>
        </div>

        <div className="site-operation-metric">
          <div className="operation-metric-icon purple">
            <Activity size={20} />
          </div>

          <div>
            <span>MONITORING</span>
            <strong className="monitoring-live">
              LIVE
            </strong>
          </div>
        </div>
      </div>

      <div className="site-operations-grid">
        {/* PERSONNEL */}
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <span>PERSONNEL</span>
              <h2>Guards on Site</h2>
            </div>

            <Users size={19} />
          </div>

          {loading ? (
            <p className="operations-empty">
              Loading personnel...
            </p>
          ) : presentGuards.length === 0 ? (
            <div className="operations-empty">
              <Users size={28} />
              <strong>
                No guards currently on duty
              </strong>
              <span>
                Attendance will appear here when
                guards check in.
              </span>
            </div>
          ) : (
            <div className="operations-list">
              {presentGuards.map((guard) => (
                <div
                  className="operations-row"
                  key={guard.id}
                >
                  <div className="guard-avatar">
                    {guard.guard_name
                      .split(" ")
                      .map(
                        (name) => name[0],
                      )
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {guard.guard_name}
                    </strong>

                    <span>
                      Checked in{" "}
                      {guard.check_in
                        ? new Date(
                            guard.check_in,
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>

                  <span className="present-badge">
                    <i />
                    PRESENT
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* INCIDENTS */}
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <span>SECURITY EVENTS</span>
              <h2>Active Incidents</h2>
            </div>

            <AlertTriangle size={19} />
          </div>

          {loading ? (
            <p className="operations-empty">
              Loading incidents...
            </p>
          ) : openIncidents.length === 0 ? (
            <div className="operations-empty">
              <ShieldCheck size={28} />
              <strong>
                No open incidents
              </strong>
              <span>
                This site currently has no active
                incidents.
              </span>
            </div>
          ) : (
            <div className="operations-list">
              {openIncidents.map(
                (incident) => (
                  <div
                    className="incident-operation-row"
                    key={incident.id}
                  >
                    <div className="incident-severity">
                      <AlertTriangle size={17} />
                    </div>

                    <div>
                      <strong>
                        {incident.incident_type}
                      </strong>

                      <span>
                        {incident.description ||
                          "No description provided"}
                      </span>
                    </div>

                    <div className="incident-right">
                      <span>
                        {incident.severity ||
                          "UNKNOWN"}
                      </span>

                      <small>
                        {incident.status ||
                          "OPEN"}
                      </small>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      <div className="sites-bottom">
        <span>
          NGAO SENTINEL SECURITY NETWORK
        </span>
        <span>
          Site operations monitoring active
        </span>
      </div>
    </div>
  );
}

