const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, requireRole } = require("../middleware/auth");

// Get all rooms with occupancy info (and optional CGPA-based filtering)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { cgpa } = req.query;

    let query = `
      SELECT r.*,
        b.name AS block_name,
        b.cgpa_threshold,
        (
          SELECT COUNT(*) 
          FROM allocations a 
          WHERE a.room_id = r.id AND a.status = 'active'
        ) as occupied
      FROM rooms r
      LEFT JOIN hostel_blocks b ON r.block_id = b.id
    `;

    let params = [];

    if (cgpa) {
      const studentCgpa = parseFloat(cgpa);

      let blockThreshold = 0;

      if (studentCgpa >= 8.0) blockThreshold = 8.0;
      else if (studentCgpa >= 6.5) blockThreshold = 6.5;
      else if (studentCgpa >= 5.0) blockThreshold = 5.0;
      else blockThreshold = 0.0;

      query += `
        WHERE b.cgpa_threshold = ?
      `;
      params.push(blockThreshold);
    }

    query += ` ORDER BY r.room_number`;

    const [rooms] = await db.query(query, params);

    res.json(rooms);
  } catch (err) {
    console.error("Rooms error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create room (admin only)
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { room_number, floor, type, capacity, status } = req.body;

    if (!room_number || !capacity) {
      return res.status(400).json({ error: "Room number and capacity are required" });
    }

    await db.query(
      "INSERT INTO rooms (room_number, floor, type, capacity, status) VALUES (?, ?, ?, ?, ?)",
      [room_number, floor || 1, type || "double", capacity, status || "available"]
    );

    res.status(201).json({ message: "Room created" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Room number already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Update room (admin only)
router.put("/:id", verifyToken, requireRole("admin", "warden"), async (req, res) => {
  try {
    const { room_number, floor, type, capacity, status } = req.body;

    // 🔹 If only status is provided → treat as status update (admin or warden)
    if (status && !room_number && !floor && !type && !capacity) {
      await db.query(
        "UPDATE rooms SET status = ? WHERE id = ?",
        [status, req.params.id]
      );
      return res.json({ message: "Room status updated" });
    }

    // 🔹 Warden safety (only status allowed)
    if (req.user.role === "warden") {
      return res.status(403).json({ error: "Warden can only update status" });
    }

    // 🔹 Admin full update
    await db.query(
      "UPDATE rooms SET room_number = ?, floor = ?, type = ?, capacity = ?, status = ? WHERE id = ?",
      [room_number, floor, type, capacity, status, req.params.id]
    );

    res.json({ message: "Room updated" });
  } catch (err) {
    console.error("Update room error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete room (admin only)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await db.query("DELETE FROM rooms WHERE id = ?", [req.params.id]);
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;