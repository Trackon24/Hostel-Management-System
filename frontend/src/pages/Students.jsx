import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import API from "../api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get("/stats/students", { headers });
        setStudents(res.data);
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s) =>
    [s.name, s.email, s.phone, s.cgpa?.toString()]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="loading-page">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <div>
            <h1>👥 Students</h1>
            <p style={{ marginTop: "0.25rem" }}>
              View and manage student records.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: "1.25rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Students</label>
            <input
              className="form-input"
              placeholder="Search by name, email, phone, or CGPA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No students found</h3>
            <p>Try a different search term.</p>
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>CGPA</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone || "-"}</td>
                      <td>
                        <span className="badge badge-info">
                          {student.cgpa ?? "-"}
                        </span>
                      </td>
                      <td>
                        {student.created_at
                          ? new Date(student.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}