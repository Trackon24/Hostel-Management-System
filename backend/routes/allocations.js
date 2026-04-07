const express = require("express");
const router = express.Router();
const db = require("../db");
const sendEmail = require("../utils/mailer");
const { verifyToken, requireRole } = require("../middleware/auth");

// Get allocations
router.get("/", verifyToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === "student") {
      query = `
        SELECT a.*, u.name as student_name, u.email as student_email,
               r.room_number, r.floor, r.type
        FROM allocations a
        JOIN users u ON a.student_id = u.id
        JOIN rooms r ON a.room_id = r.id
        WHERE a.student_id = ?
        ORDER BY a.created_at DESC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT a.*, u.name as student_name, u.email as student_email,
               r.room_number, r.floor, r.type
        FROM allocations a
        JOIN users u ON a.student_id = u.id
        JOIN rooms r ON a.room_id = r.id
        ORDER BY a.created_at DESC
      `;
      params = [];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Allocate student to room (admin)
// Allocate student to room (admin)
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { student_id, room_id, check_in } = req.body;

    if (!student_id || !room_id) {
      return res.status(400).json({ error: "Student and room are required" });
    }

    // Check if student already has active allocation
    const [existing] = await db.query(
      "SELECT id FROM allocations WHERE student_id = ? AND status = 'active'",
      [student_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Student already has an active room allocation" });
    }

    const finalCheckIn = check_in || new Date();

    try {
      // Allocate room using procedure
      await db.query(
        "CALL allocate_room(?, ?, ?)",
        [student_id, room_id, finalCheckIn]
      );

      // Fetch student details
      const [[student]] = await db.query(
        "SELECT name, email FROM users WHERE id = ?",
        [student_id]
      );

      // Fetch room details
      const [[room]] = await db.query(
        "SELECT room_number, floor, type FROM rooms WHERE id = ?",
        [room_id]
      );

      // Send email notification
      sendEmail({
        to: student.email,
        subject: "Room Allocation Confirmation - HostelMS",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">🏨 Room Allocation Confirmed</h2>
            <p>Hello <b>${student.name}</b>,</p>
            <p>Your hostel room has been successfully allocated.</p>

            <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><b>Room Number</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${room.room_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><b>Floor</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${room.floor}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><b>Room Type</b></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-transform: capitalize;">${room.type}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><b>Check-in Date</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(finalCheckIn).toLocaleDateString()}</td>
              </tr>
            </table>

            <p style="margin-top: 20px;">
              Please contact the hostel office if you need any assistance.
            </p>

            <br/>
            <p>Regards,<br/><b>HostelMS Team</b></p>
          </div>
        `,
      }).catch((err) => console.error("Email failed:", err));

      res.status(201).json({ message: "Student allocated to room and email sent" });

    } catch (dbErr) {
      if (dbErr.sqlState === "45000" && dbErr.message === "Room is already full") {
        return res.status(400).json({ error: dbErr.message });
      }

      throw dbErr;
    }
  } catch (err) {
    console.error("Allocation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Deallocate (admin)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await db.query(
      "UPDATE allocations SET status = 'checked_out', check_out = ? WHERE id = ?",
      [new Date(), req.params.id]
    );
    res.json({ message: "Student deallocated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
