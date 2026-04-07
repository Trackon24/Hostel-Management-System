import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import API from "../api";

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await API.get("/stats/reports", { headers });
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (user.role === "student") {
    return (
      <Layout>
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Students cannot access DB reports.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-page">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!reports) {
    return (
      <Layout>
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📈</div>
          <h3>No report data found</h3>
        </div>
      </Layout>
    );
  }

  const sections = [
    {
      title: "🏠 Available Rooms",
      data: reports.availableRoomsList || [],
      columns: ["room_number", "floor", "type", "capacity", "status"],
    },
    {
      title: "🛏️ Occupancy Per Room",
      data: reports.occupancyPerRoom || [],
      columns: ["room_number", "capacity", "occupied"],
    },
    {
      title: "💰 Students With Unpaid Fees",
      data: reports.unpaidStudents || [],
      columns: ["name", "email", "amount", "due_date", "status"],
    },
    {
      title: "📋 Complaints Per Student",
      data: reports.complaintsPerStudent || [],
      columns: ["name", "complaint_count"],
    },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <div>
            <h1>📈 DB Reports</h1>
            <p style={{ marginTop: "0.25rem" }}>
              SQL-based database reports for analysis and administration.
            </p>
          </div>
        </div>

        <motion.div
          className="glass-card hover-lift"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "1.5rem" }}
        >
          <h3>Total Fees Collected</h3>
          <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.5rem" }}>
            ₹{Number(reports.totalFeesCollected || 0).toLocaleString()}
          </div>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              className="glass-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <h3 style={{ marginBottom: "1rem" }}>{section.title}</h3>

              {section.data.length === 0 ? (
                <div className="empty-state" style={{ padding: "1rem 0" }}>
                  <p>No data available</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {section.columns.map((col) => (
                          <th key={col}>
                            {col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.data.map((row, i) => (
                        <tr key={i}>
                          {section.columns.map((col) => (
                            <td key={col}>
                              {col.includes("date") && row[col]
                                ? new Date(row[col]).toLocaleDateString()
                                : row[col] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}