import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, allocRes] = await Promise.all([
          API.get("/auth/me", { headers }),
          API.get("/allocations", { headers }),
        ]);
        setProfile(userRes.data);
        const active = allocRes.data.find((a) => a.status === "active");
        setAllocation(active || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="loading-page"><div className="spinner" /></div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="glass-card empty-state">
          <h3>Could not load profile</h3>
        </div>
      </Layout>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Layout>
      <div className="page-header">
        <h1>👤 My Profile</h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.25rem",
          maxWidth: "800px",
        }}
      >
        {/* Profile Info */}
        <div className="glass-card" style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "white",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <h2>{profile.name}</h2>
              <span
                className={`badge badge-active`}
                style={{ marginTop: "0.25rem" }}
              >
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📧 Contact Information</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Email</div>
              <div style={{ fontWeight: 500, marginTop: "0.15rem" }}>{profile.email}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Phone</div>
              <div style={{ fontWeight: 500, marginTop: "0.15rem" }}>
                {profile.phone || "Not provided"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Member Since</div>
              <div style={{ fontWeight: 500, marginTop: "0.15rem" }}>
                {new Date(profile.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Room Allocation */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>🏠 Room Allocation</h3>

          {allocation ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Room Number</div>
                <div style={{ fontWeight: 700, fontSize: "1.5rem", marginTop: "0.15rem" }}>
                  #{allocation.room_number}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Floor</div>
                <div style={{ fontWeight: 500, marginTop: "0.15rem" }}>
                  Floor {allocation.floor}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Room Type</div>
                <div
                  style={{
                    fontWeight: 500,
                    marginTop: "0.15rem",
                    textTransform: "capitalize",
                  }}
                >
                  {allocation.type}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Check-in</div>
                <div style={{ fontWeight: 500, marginTop: "0.15rem" }}>
                  {new Date(allocation.check_in).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p style={{ color: "var(--text-muted)" }}>
                No active room allocation
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
