import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Navigation,
  MoreHorizontal,
} from "lucide-react";

type Site = {
  id: string;
  name: string;
  location: string;
  status: string;
};

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSites() {
    setLoading(true);

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Sites error:", error);
    } else {
      setSites(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSites();
  }, []);

  return (
    <div className="sites-page">

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
          <button className="sites-refresh" onClick={loadSites}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>

          <button className="sites-add">
            <Plus size={17} />
            Add Protected Site
          </button>
        </div>
      </header>

      <div className="sites-overview">

        <div className="overview-item">
          <div className="overview-symbol blue">
            <MapPin size={19} />
          </div>

          <div>
            <span>PROTECTED SITES</span>
            <strong>{loading ? "—" : sites.length}</strong>
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
            <strong className="monitoring-live">LIVE</strong>
          </div>
        </div>

      </div>

      <div className="sites-heading">
        <div>
          <span>REGISTERED LOCATIONS</span>
          <h2>Site Directory</h2>
        </div>

        <div className="directory-count">
          {sites.length} {sites.length === 1 ? "LOCATION" : "LOCATIONS"}
        </div>
      </div>

      {loading ? (
        <div className="sites-loading">
          <div className="loading-spinner" />
          <strong>Loading protected sites</strong>
          <span>Connecting to NGAO Sentinel database...</span>
        </div>
      ) : sites.length === 0 ? (
        <div className="sites-loading">
          <div className="no-sites-icon">
            <MapPin size={30} />
          </div>

          <strong>No protected sites registered</strong>

          <span>
            Add a protected location to begin monitoring.
          </span>

          <button className="sites-add">
            <Plus size={16} />
            Add Protected Site
          </button>
        </div>
      ) : (
        <div className="site-directory">

          {sites.map((site, index) => {

            const active =
              !site.status ||
              site.status.toLowerCase() === "active";

            return (
              <div className="protected-site" key={site.id}>

                <div className="site-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="protected-site-icon">
                  <MapPin size={23} />
                </div>

                <div className="protected-site-main">

                  <div className="protected-site-title">
                    <span>PROTECTED LOCATION</span>
                    <h3>{site.name}</h3>
                  </div>

                  <div className="protected-location">
                    <Navigation size={14} />
                    {site.location || "Location not specified"}
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

                <button className="site-menu">
                  <MoreHorizontal size={19} />
                </button>

              </div>
            );
          })}

        </div>
      )}

      <div className="sites-bottom">
        <span>NGAO SENTINEL SECURITY NETWORK</span>
        <span>Protected site monitoring active</span>
      </div>

    </div>
  );
}