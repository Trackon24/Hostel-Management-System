import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import API from "../api";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", description: "" });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints", { headers });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      await API.post("/complaints", form, { headers });
      setShowModal(false);
      setForm({ title: "", description: "" });
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit complaint");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/complaints/${id}/status`, { status }, { headers });
      fetchComplaints();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const statusIcon = (status) => {
    switch (status) {
      case "pending": return "🕐";
      case "in_progress": return "🔧";
      case "resolved": return "✅";
      default: return "📋";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-page"><div className="spinner" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <h1>📋 Complaints</h1>
          {user.role === "student" && (
            <button className="btn btn-primary btn-glow" onClick={() => setShowModal(true)}>
              + New Complaint
            </button>
          )}
        </div>

        <div className="filter-bar">
          {["all", "pending", "in_progress", "resolved"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: "auto" }}>
            {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No complaints found</h3>
            <p>
              {user.role === "student"
                ? "You haven't filed any complaints yet."
                : "No complaints match the current filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {filteredComplaints.map((c, index) => (
              <motion.div
                key={c.id}
                className="glass-card hover-lift"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: "1.1rem" }}>{statusIcon(c.status)}</span>
                      <h3 style={{ fontSize: "1rem" }}>{c.title}</h3>
                    </div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        marginTop: "0.4rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {c.description}
                    </p>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "0.5rem",
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>By: {c.student_name}</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      {c.resolved_at && (
                        <span>Resolved: {new Date(c.resolved_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`badge badge-${c.status}`}>
                      {c.status.replace("_", " ")}
                    </span>

                    {(user.role === "admin" || user.role === "warden") && c.status !== "resolved" && (
                      <div className="flex gap-1" style={{ marginLeft: "0.5rem" }}>
                        {c.status === "pending" && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => updateStatus(c.id, "in_progress")}
                          >
                            Start
                          </button>
                        )}
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => updateStatus(c.id, "resolved")}
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showModal && (
          <Modal title="Submit Complaint" onClose={() => setShowModal(false)}>
            <form onSubmit={submitComplaint}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  placeholder="Brief summary of the issue"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your issue..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Submit Complaint
              </button>
            </form>
          </Modal>
        )}
      </motion.div>
    </Layout>
  );
}