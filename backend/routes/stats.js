const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Get dashboard stats
router.get("/", verifyToken, async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.query(
      "SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'"
    );

    const [[{ totalRooms }]] = await db.query(
      "SELECT COUNT(*) as totalRooms FROM rooms"
    );

    const [[{ availableRooms }]] = await db.query(
      "SELECT COUNT(*) as availableRooms FROM rooms WHERE status = 'available'"
    );

    const [[{ activeAllocations }]] = await db.query(
      "SELECT COUNT(*) as activeAllocations FROM allocations WHERE status = 'active'"
    );

    const [[{ pendingComplaints }]] = await db.query(
      "SELECT COUNT(*) as pendingComplaints FROM complaints WHERE status = 'pending'"
    );

    const [[{ inProgressComplaints }]] = await db.query(
      "SELECT COUNT(*) as inProgressComplaints FROM complaints WHERE status = 'in_progress'"
    );

    const [[{ resolvedComplaints }]] = await db.query(
      "SELECT COUNT(*) as resolvedComplaints FROM complaints WHERE status = 'resolved'"
    );

    const [[{ pendingFees }]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as pendingFees FROM fees WHERE status = 'pending'"
    );

    const [[{ collectedFees }]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as collectedFees FROM fees WHERE status = 'paid'"
    );

    // Calculate total capacity
    const [[{ totalCapacity }]] = await db.query(
      "SELECT COALESCE(SUM(capacity), 0) as totalCapacity FROM rooms WHERE status = 'available'"
    );

    const occupancyRate = totalCapacity > 0
      ? Math.round((activeAllocations / totalCapacity) * 100)
      : 0;

    res.json({
      totalStudents,
      totalRooms,
      availableRooms,
      activeAllocations,
      totalCapacity,
      occupancyRate,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      pendingFees: Number(pendingFees),
      collectedFees: Number(collectedFees)
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all students (for admin/warden dropdowns)
router.get("/students", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, cgpa, created_at FROM users WHERE role = 'student' ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get advanced reports (for DBMS Viva)
router.get("/reports", verifyToken, async (req, res) => {
  try {
    // 1. Find all available rooms
    const [availableRoomsList] = await db.query(`
      SELECT * FROM rooms
      WHERE status = 'available'
      AND id NOT IN (
          SELECT room_id
          FROM allocations
          WHERE status = 'active'
      )
    `);

    // 2. Count occupied students per room
    const [occupancyPerRoom] = await db.query(`
      SELECT 
          r.room_number,
          r.capacity,
          COUNT(a.student_id) AS occupied
      FROM rooms r
      LEFT JOIN allocations a 
          ON r.id = a.room_id AND a.status = 'active'
      GROUP BY r.id, r.room_number, r.capacity
    `);

    // 3. Students with unpaid fees
    const [unpaidStudents] = await db.query(`
      SELECT 
          u.name,
          u.email,
          f.amount,
          f.due_date,
          f.status
      FROM fees f
      JOIN users u ON f.student_id = u.id
      WHERE f.status IN ('pending', 'overdue')
    `);

    // 4. Complaint count per student
    const [complaintsPerStudent] = await db.query(`
      SELECT 
          u.name,
          COUNT(c.id) AS complaint_count
      FROM users u
      LEFT JOIN complaints c ON u.id = c.student_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name
    `);

    // 5. Total fees collected (already in main stats, but adding here as well)
    const [[{ total_fees_collected }]] = await db.query(`
      SELECT SUM(amount) AS total_fees_collected
      FROM fees
      WHERE status = 'paid'
    `);

    res.json({
      availableRoomsList,
      occupancyPerRoom,
      unpaidStudents,
      complaintsPerStudent,
      totalFeesCollected: Number(total_fees_collected || 0),
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
