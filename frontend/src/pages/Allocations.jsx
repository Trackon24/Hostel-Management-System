import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api";

export default function Allocations() {
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    room_id: "",
    check_in: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [allocRes, studentRes, roomRes] = await Promise.all([
        API.get("/allocations", { headers }),
        API.get("/stats/students", { headers }),
        API.get("/rooms", { headers }),
      ]);

      setAllocations(allocRes.data);
      setStudents(studentRes.data);
      setRooms(roomRes.data);
      setMessage("");
    } catch (err) {
      console.error("Allocation page load error:", err);
      setMessage(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentChange = async (e) => {
    const studentId = e.target.value;
    setForm({ ...form, student_id: studentId, room_id: "" });

    const selectedStudent = students.find(
      (s) => String(s.id) === String(studentId)
    );

    if (selectedStudent && selectedStudent.cgpa !== null) {
      try {
        const res = await API.get(`/rooms?cgpa=${selectedStudent.cgpa}`, { headers });
        setRooms(res.data);
      } catch (err) {
        console.error("Failed to load filtered rooms", err);
      }
    } else {
      try {
        const res = await API.get("/rooms", { headers });
        setRooms(res.data);
      } catch (err) {
        console.error("Failed to reload rooms", err);
      }
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await API.post("/allocations", form, { headers });
      setMessage("Room allocated successfully");
      setForm({ student_id: "", room_id: "", check_in: "" });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Allocation failed");
    }
  };

  const handleDeallocate = async (id) => {
    try {
      await API.delete(`/allocations/${id}`, { headers });
      setMessage("Student deallocated successfully");
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Deallocation failed");
    }
  };

  const getRecommendedBlock = () => {
    const selectedStudent = students.find(
      (s) => String(s.id) === String(form.student_id)
    );

    if (!selectedStudent || selectedStudent.cgpa == null) return null;

    if (selectedStudent.cgpa >= 8.0) return "Block A";
    if (selectedStudent.cgpa >= 6.5) return "Block B";
    if (selectedStudent.cgpa >= 5.0) return "Block C";
    return "Block D";
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
        <h1>🛏️ Room Allocations</h1>
      </div>

      {message && (
        <div
          className="glass-card"
          style={{
            marginBottom: "1.5rem",
            color:
              message.toLowerCase().includes("success") ||
              message.toLowerCase().includes("allocated")
                ? "#86efac"
                : "#fca5a5",
            padding: "1rem 1.25rem",
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}

      {user.role === "admin" && (
        <div className="glass-card" style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Allocate Student to Room</h3>

          {form.student_id && getRecommendedBlock() && (
            <p
              style={{
                marginBottom: "1rem",
                fontWeight: 600,
                color: "var(--primary-light)",
                fontSize: "1rem",
              }}
            >
              Recommended Hostel Block: {getRecommendedBlock()}
            </p>
          )}

          <form onSubmit={handleAllocate} className="form-grid">
            <select
              className="form-input"
              value={form.student_id}
              onChange={handleStudentChange}
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} (CGPA: {student.cgpa ?? "N/A"})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              required
            >
              <option value="">Select Room</option>
              {rooms
                .filter(
                  (room) =>
                    room.status === "available" &&
                    room.occupied < room.capacity
                )
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} - {room.block_name || "No Block"} ({room.type}) [{room.occupied}/{room.capacity}]
                  </option>
                ))}
            </select>

            <input
              type="date"
              className="form-input"
              value={form.check_in}
              onChange={(e) =>
                setForm({ ...form, check_in: e.target.value })
              }
            />

            <button
              type="submit"
              className="btn-primary"
              style={{
                height: "48px",
                fontSize: "1rem",
                fontWeight: "600",
                borderRadius: "10px",
                padding: "0 20px",
                width: "100%",
              }}
            >
              Allocate
            </button>
          </form>
        </div>
      )}

      <div className="glass-card">
        <div className="page-header" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem" }}>Current Allocations</h2>
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Total: {allocations.length}
          </span>
        </div>

        {allocations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛏️</div>
            <h3>No allocations found</h3>
            <p>No students are currently allocated.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Room</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Check In</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.student_name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{a.student_email}</td>
                    <td>{a.room_number}</td>
                    <td>{a.floor}</td>
                    <td style={{ textTransform: "capitalize" }}>{a.type}</td>
                    <td>{a.check_in?.slice(0, 10)}</td>
                    <td>
                      <span
                        className={`badge ${
                          a.status === "active" ? "badge-active" : "badge-pending"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {user.role === "admin" && a.status === "active" && (
                        <button
                          onClick={() => handleDeallocate(a.id)}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#f87171",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "10px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Deallocate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}