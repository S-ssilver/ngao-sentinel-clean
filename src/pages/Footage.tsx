
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type FootageRecord = {
  id: string;
  site_id: string;
  incident_type: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
};
type SiteRecord = {
  id: string;
  name: string;
};

type FootageProps = {
  profile: {
    id: string;
    role: string | null;
  } | null;
};

export default function Footage({ profile }: FootageProps) {
  const [footage, setFootage] = useState<FootageRecord[]>([]);
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFootage() {
      if (!profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        let siteQuery = supabase
          .from("sites")
          .select("id, name");

        if (profile.role === "Client") {
          siteQuery = siteQuery.eq("client_id", profile.id);
        } else if (profile.role === "Supervisor") {
          siteQuery = siteQuery.eq("supervisor_id", profile.id);
        }

        const { data: siteData, error: siteError } = await siteQuery;

        if (siteError) throw siteError;

        const allowedSites = siteData ?? [];
        setSites(allowedSites);

        if (allowedSites.length === 0) {
          setFootage([]);
          return;
        }

        const { data, error: footageError } = await supabase
          .from("incident_logs")
          .select(
  "id, site_id, incident_type, description, image_url, video_url, created_at"
)
          .in(
            "site_id",
            allowedSites.map((site) => site.id)
          )
          
          .order("created_at", { ascending: false });

        if (footageError) throw footageError;

        setFootage(data ?? []);
      } catch (err) {
        console.error("Failed to load footage:", err);
        setError("Unable to load footage. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadFootage();
  }, [profile]);

  const siteName = (siteId: string) =>
    sites.find((site) => site.id === siteId)?.name ?? "Unknown site";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Security Footage</h1>
          <p>View video evidence attached to recorded incidents.</p>
        </div>
      </div>

      {loading && <p>Loading footage...</p>}

      {!loading && error && <p role="alert">{error}</p>}

      {!loading && !error && footage.length === 0 && (
        <p>No incident footage is available yet.</p>
      )}

      {!loading && !error && footage.length > 0 && (
        <div className="footage-grid">
          {footage.map((item) => (
            <article className="footage-card" key={item.id}>
              <div className="footage-player">
  {item.video_url ? (
    <video
      controls
      preload="metadata"
      src={item.video_url}
    >
      Your browser does not support video playback.
    </video>
  ) : item.image_url ? (
    <img
      src={item.image_url}
      alt={`Evidence for ${item.incident_type}`}
      style={{
        width: "100%",
        height: "220px",
        objectFit: "contain",
        background: "#0f172a",
      }}
    />
  ) : (
    <div style={{ padding: "24px", textAlign: "center" }}>
      No media attached to this incident.
    </div>
  )}
</div>

              <div className="footage-info">
                <h3>{item.incident_type || "Incident footage"}</h3>
                <p>{siteName(item.site_id)}</p>
                {item.description && <p>{item.description}</p>}
                <small>
                  {new Date(item.created_at).toLocaleString()}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
