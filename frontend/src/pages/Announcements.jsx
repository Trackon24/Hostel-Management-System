import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import API from "../api";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "medium",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get("/announcements", { headers });
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const postAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await API.post("/announcements", form, { headers });
      setShowModal(false);
      setForm({ title: "", content: "", priority: "medium" });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post announcement");
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await API.delete(`/announcements/${id}`, { headers });
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const priorityIcon = (p) => {
    switch (p) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🔵";
      default: return "📢";
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
      <div className="page-header">
        <h1>📢 Announcements</h1>
        {(user.role === "admin" || user.role === "warden") && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Post Announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📢</div>
          <h3>No announcements yet</h3>
          <p>Announcements from the administration will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`glass-card announcement-card priority-${a.priority} animate-slide-up`}
            >
              <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: "1.2rem" }}>{priorityIcon(a.priority)}</span>
                  <h3 style={{ fontSize: "1.05rem" }}>{a.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`badge badge-${a.priority}`}>{a.priority}</span>
                  {user.role === "admin" && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteAnnouncement(a.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                {a.content}
              </p>

              <div className="announcement-meta">
                <span>Posted by: {a.posted_by_name}</span>
                <span>
                  {new Date(a.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Post Announcement" onClose={() => setShowModal(false)}>
          <form onSubmit={postAnnouncement}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="form-textarea"
                placeholder="Write the announcement details..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Post Announcement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
