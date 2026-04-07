const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, requireRole } = require("../middleware/auth");
const sendEmail = require("../utils/mailer");
// Get complaints (role-based filtering)
router.get("/", verifyToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === "student") {
      query = `
        SELECT c.*, u.name as student_name
        FROM complaints c
        JOIN users u ON c.student_id = u.id
        WHERE c.student_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT c.*, u.name as student_name
        FROM complaints c
        JOIN users u ON c.student_id = u.id
        ORDER BY c.created_at DESC
      `;
      params = [];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Submit complaint (student)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    await db.query(
      "CALL add_complaint(?, ?, ?)",
      [req.user.id, title, description]
    );

    res.status(201).json({ message: "Complaint submitted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update complaint status (warden/admin)
router.put("/:id/status", verifyToken, requireRole("admin", "warden"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "in_progress", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // `resolved_at` is now handled by the `before_complaint_update` DB Trigger
    await db.query(
      "UPDATE complaints SET status = ? WHERE id = ?",
      [status, req.params.id]
    );
    if (status === "resolved") {
      const [[complaint]] = await db.query(
        `
        SELECT c.title, u.name, u.email
        FROM complaints c
        JOIN users u ON c.student_id = u.id
        WHERE c.id = ?
        `,
        [req.params.id]
      );

     sendEmail({
        to: complaint.email,
        subject: "Complaint Resolved - HostelMS",
        html: `
          <h2>Complaint Resolved</h2>
          <p>Hello <b>${complaint.name}</b>,</p>
          <p>Your complaint has been marked as <b>resolved</b>.</p>
          <ul>
            <li><b>Complaint:</b> ${complaint.title}</li>
            <li><b>Status:</b> Resolved</li>
          </ul>
          <p>Thank you for your patience.</p>
          <br/>
          <p>Regards,<br/>HostelMS Team</p>
        `,
      }).catch((err) => console.error("Email failed:", err));
    }
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;