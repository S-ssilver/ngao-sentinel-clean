import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  RefreshCw,
  Search,
  UserCheck,
  Clock,
  MapPin,
  UserPlus,
} from "lucide-react";

type Guard = {
  id: string;
  name: string;
  phone: string | null;
  site_id: string | null;
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

type Site = {
  id: string;
  name: string;
  location: string;
};

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
};

export default function Personnel({
  profile,
}: {
  profile: Profile | null;
}) {
  const isOperationsManager =
    profile?.role === "Operations Manager";

  const isSupervisor =
    profile?.role === "Supervisor";

   const [guards, setGuards] = useState<Guard[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAddGuard, setShowAddGuard] = useState(false);
  const [guardName, setGuardName] = useState("");
  const [guardPhone, setGuardPhone] = useState("");
  const [addingGuard, setAddingGuard] = useState(false);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<
    "Client" | "Supervisor"
  >("Client");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] =
    useState("");
  const [creatingUser, setCreatingUser] =
    useState(false);

  const [assigningGuardId, setAssigningGuardId] =
    useState<string | null>(null);

  async function loadPersonnel() {
    setLoading(true);

    // Get sites this user is allowed to see
    let sitesQuery = supabase
      .from("sites")
      .select("id, name, location");

    if (isSupervisor && profile?.id) {
      sitesQuery = sitesQuery.eq(
        "supervisor_id",
        profile.id
      );
    }

    const sitesResult = await sitesQuery;

    if (sitesResult.error) {
      console.error("Sites error:", sitesResult.error);
      setSites([]);
      setGuards([]);
      setAttendance([]);
      setLoading(false);
      return;
    }

    const allowedSites = sitesResult.data || [];
    const allowedSiteIds = allowedSites.map(
      (site) => site.id
    );

    setSites(allowedSites);

    // Supervisor with no assigned site
    if (
      isSupervisor &&
      allowedSiteIds.length === 0
    ) {
      setGuards([]);
      setAttendance([]);
      setLoading(false);
      return;
    }

    // Load guards
    let guardsQuery = supabase
      .from("guards")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (isSupervisor) {
      guardsQuery = guardsQuery.in(
        "site_id",
        allowedSiteIds
      );
    }

    // Load attendance
    let attendanceQuery = supabase
      .from("attendance_logs")
      .select("*")
      .order("check_in", {
        ascending: false,
      });

    if (isSupervisor) {
      attendanceQuery = attendanceQuery.in(
        "site_id",
        allowedSiteIds
      );
    }

    const [
      guardsResult,
      attendanceResult,
    ] = await Promise.all([
      guardsQuery,
      attendanceQuery,
    ]);

    if (guardsResult.error) {
      console.error(
        "Guards error:",
        guardsResult.error
      );
      setGuards([]);
    } else {
      setGuards(guardsResult.data || []);
    }

    if (attendanceResult.error) {
      console.error(
        "Personnel error:",
        attendanceResult.error
      );
      setAttendance([]);
    } else {
      setAttendance(
        attendanceResult.data || []
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPersonnel();
  }, [profile?.id, profile?.role]);

  function getSite(siteId: string) {
    return sites.find(
      (site) => site.id === siteId
    );
  }

    async function createUser() {
    if (!newUserName.trim()) {
      alert("Please enter the user's full name.");
      return;
    }

    if (!newUserEmail.trim()) {
      alert("Please enter the user's email.");
      return;
    }

    if (newUserPassword.length < 8) {
      alert("Temporary password must be at least 8 characters.");
      return;
    }

    setCreatingUser(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Your session has expired. Please log in again.");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: newUserName.trim(),
            email: newUserEmail.trim(),
            password: newUserPassword,
            role: newUserRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Unable to create user.");
        return;
      }

      alert(
        `${newUserRole} account created successfully for ${newUserName.trim()}.`
      );

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("Client");
      setShowAddUser(false);
    } catch (error) {
      console.error("Create user error:", error);
      alert("Something went wrong while creating the user.");
    } finally {
      setCreatingUser(false);
    }
  }

  async function assignGuardToSite(
    guardId: string,
    siteId: string
  ) {
    setAssigningGuardId(guardId);

    const { error } = await supabase
      .from("guards")
      .update({
        site_id: siteId || null,
      })
      .eq("id", guardId);

    if (error) {
      console.error(
        "Assign guard error:",
        error
      );
      alert(
        `Unable to assign guard to site: ${error.message}`
      );
    } else {
      setGuards((currentGuards) =>
        currentGuards.map((guard) =>
          guard.id === guardId
            ? {
                ...guard,
                site_id: siteId || null,
              }
            : guard
        )
      );
    }

    setAssigningGuardId(null);
  }

  const filteredPersonnel =
    attendance.filter((person) => {
      const site = getSite(person.site_id);

      const text = `
        ${person.guard_name}
        ${person.status}
        ${site?.name || ""}
        ${site?.location || ""}
      `.toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  const presentCount = attendance.filter(
    (person) =>
      person.status?.toLowerCase() ===
      "present"
  ).length;

  const checkedOutCount =
    attendance.filter(
      (person) =>
        person.check_out !== null
    ).length;

  return (
    <div className="personnel-page">
      <header className="personnel-header">
        <div>
          <p className="page-eyebrow">
            OPERATIONS CENTER
          </p>

          <h1>Personnel</h1>

          <p className="page-subtitle">
            Monitor personnel attendance and
            deployment across protected sites.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadPersonnel}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="personnel-summary">
        <div className="personnel-summary-card">
          <div className="personnel-summary-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Attendance Records</span>
            <strong>
              {attendance.length}
            </strong>
          </div>
        </div>

        <div className="personnel-summary-card">
          <div className="personnel-summary-icon present">
            <UserCheck size={20} />
          </div>

          <div>
            <span>Currently Present</span>
            <strong>
              {presentCount}
            </strong>
          </div>
        </div>

        <div className="personnel-summary-card">
          <div className="personnel-summary-icon checkout">
            <Clock size={20} />
          </div>

          <div>
            <span>Checked Out</span>
            <strong>
              {checkedOutCount}
            </strong>
          </div>
        </div>
      </section>

      {isOperationsManager && (
        <section className="guards-section">
          <div className="guards-section-header">
            <div>
              <p className="page-eyebrow">
                GUARD MANAGEMENT
              </p>

              <h2>Guards</h2>

              <p className="page-subtitle">
                Manage registered guards and
                their site assignments.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                className="refresh-button"
                onClick={() => {
                  setNewUserRole("Client");
                  setShowAddUser(true);
              }}
>
              <UserPlus size={17} />
               Add Client
              </button>

              <button
                className="refresh-button"
                onClick={() => {
                  setNewUserRole("Supervisor");
                  setShowAddUser(true);
               }}
>
              <UserPlus size={17} />
               Add Supervisor
              </button>
              <button
                className="refresh-button"
                onClick={() =>
                  setShowAddGuard(true)
                }
              >
                + Add Guard
              </button>

              <button
                className="refresh-button"
                onClick={loadPersonnel}
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>
          </div>

          {guards.length === 0 ? (
            <div className="personnel-empty">
              <Users size={40} />

              <h2>No guards registered</h2>

              <p>
                Add a guard to begin managing
                personnel.
              </p>
            </div>
          ) : (
            <div className="personnel-list">
              {guards.map((guard) => {
                const site = guard.site_id
                  ? getSite(guard.site_id)
                  : null;

                return (
                  <div
                    className="personnel-card"
                    key={guard.id}
                  >
                    <div className="personnel-main">
                      <div className="person-avatar">
                        <Users size={21} />
                      </div>

                      <div className="person-info">
                        <h2>{guard.name}</h2>

                        <span className="person-site">
                          <MapPin size={14} />

                          {site
                            ? `${site.name} · ${site.location}`
                            : "Unassigned"}
                        </span>

                        {guard.phone && (
                          <span className="person-site">
                            {guard.phone}
                          </span>
                        )}

                        <select
                          value={
                            guard.site_id || ""
                          }
                          disabled={
                            assigningGuardId ===
                            guard.id
                          }
                          onChange={(e) =>
                            assignGuardToSite(
                              guard.id,
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            Unassigned
                          </option>

                          {sites.map((site) => (
                            <option
                              key={site.id}
                              value={site.id}
                            >
                              {site.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <span
                      className={`person-status ${
                        guard.status
                          .toLowerCase() ===
                        "active"
                          ? "person-present"
                          : ""
                      }`}
                    >
                      <span />
                      {guard.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="personnel-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search personnel..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <span className="personnel-count">
          {filteredPersonnel.length}{" "}
          {filteredPersonnel.length === 1
            ? "record"
            : "records"}
        </span>
      </div>

      {loading ? (
        <div className="personnel-empty">
          <div className="loading-spinner" />

          <span>
            Loading personnel...
          </span>
        </div>
      ) : filteredPersonnel.length === 0 ? (
        <div className="personnel-empty">
          <Users size={40} />

          <h2>
            No personnel records found
          </h2>

          <p>
            {search
              ? "Try a different search term."
              : "No attendance records have been recorded."}
          </p>
        </div>
      ) : (
        <div className="personnel-list">
          {filteredPersonnel.map(
            (person) => {
              const site = getSite(
                person.site_id
              );

              return (
                <div
                  className="personnel-card"
                  key={person.id}
                >
                  <div className="personnel-main">
                    <div className="person-avatar">
                      <Users size={21} />
                    </div>

                    <div className="person-info">
                      <h2>
                        {person.guard_name}
                      </h2>

                      <span className="person-site">
                        <MapPin size={14} />

                        {site?.name ||
                          "Unknown site"}

                        {site?.location
                          ? ` · ${site.location}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="person-attendance">
                    <div>
                      <span>
                        Check In
                      </span>

                      <strong>
                        {person.check_in
                          ? new Date(
                              person.check_in
                            ).toLocaleString()
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Check Out
                      </span>

                      <strong>
                        {person.check_out
                          ? new Date(
                              person.check_out
                            ).toLocaleString()
                          : "Still on duty"}
                      </strong>
                    </div>
                  </div>

                  <span
                    className={`person-status ${
                      person.status
                        ?.toLowerCase() ===
                      "present"
                        ? "person-present"
                        : ""
                    }`}
                  >
                    <span />
                    {person.status ||
                      "UNKNOWN"}
                  </span>
                </div>
              );
            }
          )}
        </div>
      )}

            {showAddUser && (
        <div className="guard-modal-overlay">
          <div className="guard-modal">
            <div className="guard-modal-header">
              <div>
                <p className="page-eyebrow">
                  USER MANAGEMENT
                </p>

                <h2>
                  Add {newUserRole}
                </h2>
              </div>

              <button
                className="guard-modal-close"
                onClick={() =>
                  setShowAddUser(false)
                }
              >
                x
              </button>
            </div>

            <div className="guard-form">
              <label>
                Full Name

                <input
                  type="text"
                  placeholder={`Enter ${newUserRole.toLowerCase()}'s full name`}
                  value={newUserName}
                  onChange={(e) =>
                    setNewUserName(e.target.value)
                  }
                />
              </label>

              <label>
                Email Address

                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newUserEmail}
                  onChange={(e) =>
                    setNewUserEmail(e.target.value)
                  }
                />
              </label>

              <label>
                Temporary Password

                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newUserPassword}
                  onChange={(e) =>
                    setNewUserPassword(
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Role

                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(
                      e.target.value as
                        | "Client"
                        | "Supervisor"
                    )
                  }
                >
                  <option value="Client">
                    Client
                  </option>

                  <option value="Supervisor">
                    Supervisor
                  </option>
                </select>
              </label>

              <div className="guard-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAddUser(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="refresh-button"
                  disabled={creatingUser}
                  onClick={createUser}
                >
                  {creatingUser
                    ? "Creating..."
                    : `Create ${newUserRole}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddGuard && (
        <div className="guard-modal-overlay">
          <div className="guard-modal">
            <div className="guard-modal-header">
              <div>
                <p className="page-eyebrow">
                  GUARD MANAGEMENT
                </p>

                <h2>Add Guard</h2>
              </div>

              <button
                className="guard-modal-close"
                onClick={() =>
                  setShowAddGuard(false)
                }
              >
                x
              </button>
            </div>

            <div className="guard-form">
              <label>
                Full Name

                <input
                  type="text"
                  placeholder="Enter guard name"
                  value={guardName}
                  onChange={(e) =>
                    setGuardName(
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Phone Number

                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={guardPhone}
                  onChange={(e) =>
                    setGuardPhone(
                      e.target.value
                    )
                  }
                />
              </label>

              <div className="guard-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAddGuard(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="refresh-button"
                  disabled={addingGuard}
                  onClick={async () => {
                    if (!guardName.trim()) {
                      alert(
                        "Please enter the guard's name."
                      );
                      return;
                    }

                    setAddingGuard(true);

                    const { error } =
                      await supabase
                        .from("guards")
                        .insert({
                          name: guardName.trim(),
                          phone:
                            guardPhone.trim() ||
                            null,
                        });

                    if (error) {
                      console.error(
                        "Add guard error:",
                        error
                      );

                      alert(
                        `Unable to add guard: ${error.message}`
                      );
                    } else {
                      setGuardName("");
                      setGuardPhone("");
                      setShowAddGuard(false);

                      await loadPersonnel();
                    }

                    setAddingGuard(false);
                  }}
                >
                  {addingGuard
                    ? "Adding..."
                    : "Add Guard"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

