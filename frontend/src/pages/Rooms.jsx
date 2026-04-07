import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import API from "../api";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    room_number: "",
    floor: 1,
    type: "double",
    capacity: 2,
    status: "available",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRooms = async () => {
    try {
      const res = await API.get("/rooms", { headers });
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const addRoom = async (e) => {
    e.preventDefault();
    try {
      await API.post("/rooms", form, { headers });
      setShowModal(false);
      setForm({ room_number: "", floor: 1, type: "double", capacity: 2, status: "available" });
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add room");
    }
  };

  const deleteRoom = async (id) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await API.delete(`/rooms/${id}`, { headers });
      fetchRooms();
    } catch (err) {
      alert("Failed to delete room");
    }
  };

  const updateRoomStatus = async (roomId, status) => {
    try {
      await API.put(`/rooms/${roomId}`, { status }, { headers });
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update room");
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (filter === "all") return true;
    if (filter === "available") return r.status === "available" && r.occupied < r.capacity;
    if (filter === "full") return r.occupied >= r.capacity;
    if (filter === "maintenance") return r.status === "maintenance";
    return true;
  });

  const getOccupancyClass = (occupied, capacity) => {
    const pct = (occupied / capacity) * 100;
    if (pct >= 100) return "full";
    if (pct >= 70) return "high";
    return "";
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
          <h1>🏠 Room Management</h1>
          {user.role === "admin" && (
            <button className="btn btn-primary btn-glow" onClick={() => setShowModal(true)}>
              + Add Room
            </button>
          )}
        </div>

        <div className="filter-bar">
          {["all", "available", "full", "maintenance"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: "auto" }}>
            {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-state-icon">🏠</div>
            <h3>No rooms found</h3>
            <p>Try changing the filter or add a new room.</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                className="glass-card room-card hover-lift"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="room-card-header">
                  <div>
                    <span className="room-number">#{room.room_number}</span>
                  </div>
                  <span className={`badge badge-${room.status}`}>{room.status}</span>
                </div>

                <div className="room-info-row">
                  <span className="room-info-label">Floor</span>
                  <span className="room-info-value">{room.floor}</span>
                </div>
                <div className="room-info-row">
                  <span className="room-info-label">Type</span>
                  <span className="room-info-value" style={{ textTransform: "capitalize" }}>
                    {room.type}
                  </span>
                </div>
                <div className="room-info-row">
                  <span className="room-info-label">Occupancy</span>
                  <span className="room-info-value">
                    {room.occupied} / {room.capacity}
                  </span>
                </div>

                <div className="occupancy-bar">
                  <div
                    className={`occupancy-fill ${getOccupancyClass(room.occupied, room.capacity)}`}
                    style={{
                      width: `${Math.min((room.occupied / room.capacity) * 100, 100)}%`,
                    }}
                  />
                </div>

                {(user.role === "admin" || user.role === "warden") && (
                  <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {room.status !== "maintenance" && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateRoomStatus(room.id, "maintenance")}
                      >
                        Mark Maintenance
                      </button>
                    )}

                    {room.status === "maintenance" && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateRoomStatus(room.id, "available")}
                      >
                        Mark Available
                      </button>
                    )}

                    {user.role === "admin" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteRoom(room.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {showModal && (
          <Modal title="Add New Room" onClose={() => setShowModal(false)}>
            <form onSubmit={addRoom}>
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  className="form-input"
                  placeholder="e.g. 301"
                  value={form.room_number}
                  onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Floor</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                      capacity:
                        e.target.value === "single"
                          ? 1
                          : e.target.value === "double"
                          ? 2
                          : 3,
                    })
                  }
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Add Room
              </button>
            </form>
          </Modal>
        )}
      </motion.div>
    </Layout>
  );
}