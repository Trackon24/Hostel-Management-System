import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import API from "../api";
import Papa from "papaparse";
import { saveAs } from "file-saver";

export default function Download() {
  const [students, setStudents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [fees, setFees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, complaintsRes, feesRes, allocationsRes, statsRes] =
          await Promise.all([
            API.get("/stats/students", { headers }),
            API.get("/complaints", { headers }),
            API.get("/fees", { headers }),
            API.get("/allocations", { headers }),
            API.get("/stats", { headers }),
          ]);

        setStudents(studentsRes.data);
        setComplaints(complaintsRes.data);
        setFees(feesRes.data);
        setAllocations(allocationsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Download fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const downloadCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
  };

  const exportStudents = () => {
    const csvData = students.map((s) => ({
      ID: s.id,
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      CGPA: s.cgpa ?? "N/A",
      Joined: s.created_at ? s.created_at.slice(0, 10) : "",
    }));
    downloadCSV(csvData, "students_report.csv");
  };

  const exportComplaints = () => {
    const csvData = complaints.map((c) => ({
      ID: c.id,
      Student: c.student_name || c.student_id,
      Title: c.title,
      Description: c.description,
      Status: c.status,
      Created_At: c.created_at ? c.created_at.slice(0, 10) : "",
    }));
    downloadCSV(csvData, "complaints_report.csv");
  };

  const exportFees = () => {
    const csvData = fees.map((f) => ({
      ID: f.id,
      Student: f.student_name || f.student_id,
      Amount: f.amount,
      Due_Date: f.due_date ? f.due_date.slice(0, 10) : "",
      Status: f.status,
    }));
    downloadCSV(csvData, "fees_report.csv");
  };

  const exportAllocations = () => {
    const csvData = allocations.map((a) => ({
      ID: a.id,
      Student: a.student_name,
      Email: a.student_email,
      Room: a.room_number,
      Floor: a.floor,
      Type: a.type,
      Check_In: a.check_in ? a.check_in.slice(0, 10) : "",
      Check_Out: a.check_out ? a.check_out.slice(0, 10) : "",
      Status: a.status,
    }));
    downloadCSV(csvData, "allocations_report.csv");
  };

  const exportDBReport = () => {
    if (!stats) return;

    const csvData = [
      { Metric: "Total Students", Value: stats.totalStudents },
      { Metric: "Total Rooms", Value: stats.totalRooms },
      { Metric: "Available Rooms", Value: stats.availableRooms },
      { Metric: "Active Allocations", Value: stats.activeAllocations },
      { Metric: "Total Capacity", Value: stats.totalCapacity },
      { Metric: "Occupancy Rate (%)", Value: stats.occupancyRate },
      { Metric: "Pending Complaints", Value: stats.pendingComplaints },
      { Metric: "In Progress Complaints", Value: stats.inProgressComplaints },
      { Metric: "Resolved Complaints", Value: stats.resolvedComplaints },
      { Metric: "Pending Fees", Value: stats.pendingFees },
      { Metric: "Collected Fees", Value: stats.collectedFees },
    ];

    downloadCSV(csvData, "db_report.csv");
  };

  if (user.role === "student") {
    return (
      <Layout>
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Students cannot access downloads.</p>
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

  const reportButtons = [
    { label: "🎓 Export Students", desc: "Download all student records", onClick: exportStudents },
    { label: "📋 Export Complaints", desc: "Download complaint history and statuses", onClick: exportComplaints },
    { label: "💰 Export Fees", desc: "Download fee payment and pending records", onClick: exportFees },
    { label: "🛏️ Export Allocations", desc: "Download room allocation records", onClick: exportAllocations },
    { label: "📊 Export DB Report", desc: "Download hostel system summary metrics", onClick: exportDBReport },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <div>
            <h1>📥 Downloads</h1>
            <p style={{ marginTop: "0.25rem" }}>
              Export hostel records and analytics as CSV files.
            </p>
          </div>
        </div>

        <div className="card-grid">
          {reportButtons.map((btn, index) => (
            <motion.div
              key={index}
              className="glass-card hover-lift"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ padding: "1.5rem" }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>{btn.label}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                {btn.desc}
              </p>
              <button
                className="btn btn-primary btn-block btn-glow"
                onClick={btn.onClick}
              >
                Download CSV
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}