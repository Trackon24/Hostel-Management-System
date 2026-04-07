import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import API from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, annRes, compRes] = await Promise.all([
          API.get("/stats", { headers }),
          API.get("/announcements", { headers }),
          API.get("/complaints", { headers }),
        ]);
        setStats(statsRes.data);
        setAnnouncements(annRes.data.slice(0, 3));
        setComplaints(compRes.data.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="loading-page">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <Layout>
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
      >
        <motion.div className="page-header" variants={fadeUp}>
          <div>
            <h1>
              {greeting()}, {user.name?.split(" ")[0]} 👋
            </h1>
            <p style={{ marginTop: "0.25rem" }}>
              Here's what's happening in your hostel today.
            </p>
          </div>
        </motion.div>

        {stats && (
          <motion.div className="stats-grid" variants={container}>
            {user.role !== "student" && (
              <motion.div variants={fadeUp}>
                <StatCard
                  icon="👥"
                  label="Total Students"
                  value={stats.totalStudents}
                  gradient="primary"
                />
              </motion.div>
            )}
            <motion.div variants={fadeUp}>
              <StatCard
                icon="🏠"
                label="Total Rooms"
                value={stats.totalRooms}
                gradient="success"
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon="📊"
                label="Occupancy Rate"
                value={`${stats.occupancyRate}%`}
                gradient="info"
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon="📋"
                label="Pending Complaints"
                value={stats.pendingComplaints}
                gradient={stats.pendingComplaints > 0 ? "warning" : "success"}
              />
            </motion.div>
            {user.role !== "student" && (
              <motion.div variants={fadeUp}>
                <StatCard
                  icon="💰"
                  label="Pending Fees"
                  value={`₹${stats.pendingFees?.toLocaleString()}`}
                  gradient="danger"
                />
              </motion.div>
            )}
            {user.role !== "student" && (
              <motion.div variants={fadeUp}>
                <StatCard
                  icon="✅"
                  label="Collected Fees"
                  value={`₹${stats.collectedFees?.toLocaleString()}`}
                  gradient="accent"
                />
              </motion.div>
            )}
          </motion.div>
        )}

        <motion.div
          variants={container}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginTop: "1.5rem",
          }}
        >
          <motion.div className="glass-card" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2">
              <h3>📋 Recent Complaints</h3>
            </div>
            {complaints.length === 0 ? (
              <div className="empty-state">
                <p>No complaints found</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {complaints.map((c, index) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      background: "var(--bg-glass)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          marginTop: "0.2rem",
                        }}
                      >
                        {c.student_name} • {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`badge badge-${c.status}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div className="glass-card" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2">
              <h3>📢 Recent Announcements</h3>
            </div>
            {announcements.length === 0 ? (
              <div className="empty-state">
                <p>No announcements yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {announcements.map((a, index) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      padding: "0.75rem",
                      background: "var(--bg-glass)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: `3px solid ${
                        a.priority === "high"
                          ? "var(--color-danger)"
                          : a.priority === "medium"
                          ? "var(--color-warning)"
                          : "var(--color-success)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {a.title}
                      </div>
                      <span className={`badge badge-${a.priority}`}>
                        {a.priority}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginTop: "0.45rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {a.content?.slice(0, 90)}...
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}