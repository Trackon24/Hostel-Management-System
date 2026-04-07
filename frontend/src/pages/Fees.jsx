import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import API from "../api";

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    student_id: "",
    description: "Hostel Fee",
    amount: "",
    due_date: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFees = async () => {
    try {
      const res = await API.get("/fees", { headers });
      setFees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/stats/students", { headers });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFees();
    if (user.role === "admin") fetchStudents();
  }, []);

  const createFee = async (e) => {
    e.preventDefault();
    try {
      await API.post("/fees", form, { headers });
      setShowModal(false);
      setForm({ student_id: "", description: "Hostel Fee", amount: "", due_date: "" });
      fetchFees();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create fee");
    }
  };

  const markPaid = async (id) => {
    try {
      await API.put(`/fees/${id}/pay`, {}, { headers });
      fetchFees();
    } catch (err) {
      alert("Failed to mark as paid");
    }
  };

  const filteredFees = fees.filter((f) => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  const totalPending = fees.filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);

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
          <h1>💰 Fee Management</h1>
          {user.role === "admin" && (
            <button className="btn btn-primary btn-glow" onClick={() => setShowModal(true)}>
              + Create Fee
            </button>
          )}
        </div>

        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <motion.div className="stat-card hover-lift" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="stat-card-accent" style={{ background: "var(--gradient-warning)" }} />
            <span className="stat-card-label">Pending Amount</span>
            <div className="stat-card-value" style={{ marginTop: "0.5rem" }}>
              ₹{totalPending.toLocaleString()}
            </div>
          </motion.div>

          <motion.div className="stat-card hover-lift" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="stat-card-accent" style={{ background: "var(--gradient-success)" }} />
            <span className="stat-card-label">Collected Amount</span>
            <div className="stat-card-value" style={{ marginTop: "0.5rem" }}>
              ₹{totalPaid.toLocaleString()}
            </div>
          </motion.div>
        </div>

        <div className="filter-bar">
          {["all", "pending", "paid", "overdue"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredFees.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>No fee records found</h3>
            <p>No fees match the current filter.</p>
          </div>
        ) : (
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    {user.role === "admin" && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 500 }}>{f.student_name}</td>
                      <td>{f.description}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(f.amount).toLocaleString()}</td>
                      <td>{new Date(f.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${f.status}`}>{f.status}</span>
                      </td>
                      {user.role === "admin" && (
                        <td>
                          {f.status !== "paid" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => markPaid(f.id)}
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {showModal && (
          <Modal title="Create Fee Record" onClose={() => setShowModal(false)}>
            <form onSubmit={createFee}>
              <div className="form-group">
                <label className="form-label">Student</label>
                <select
                  className="form-select"
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  placeholder="e.g. Hostel Fee - Semester 4"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Create Fee
              </button>
            </form>
          </Modal>
        )}
      </motion.div>
    </Layout>
  );
}