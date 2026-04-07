const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, requireRole } = require("../middleware/auth");
const sendEmail = require("../utils/mailer");
// Get fees
router.get("/", verifyToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === "student") {
      query = `
        SELECT f.*, u.name as student_name
        FROM fees f
        JOIN users u ON f.student_id = u.id
        WHERE f.student_id = ?
        ORDER BY f.due_date DESC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT f.*, u.name as student_name
        FROM fees f
        JOIN users u ON f.student_id = u.id
        ORDER BY f.due_date DESC
      `;
      params = [];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Create fee record (admin)
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { student_id, description, amount, due_date } = req.body;

    if (!student_id || !amount || !due_date) {
      return res.status(400).json({ error: "Student, amount, and due date are required" });
    }

    await db.query(
      "INSERT INTO fees (student_id, description, amount, due_date) VALUES (?, ?, ?, ?)",
      [student_id, description || "Hostel Fee", amount, due_date]
    );
    const [[student]] = await db.query(
  "SELECT name, email FROM users WHERE id = ?",
  [student_id]
);

    sendEmail({
      to: student.email,
      subject: "New Hostel Fee Generated - HostelMS",
      html: `
        <h2>Fee Notification</h2>
        <p>Hello <b>${student.name}</b>,</p>
        <p>A new hostel fee has been generated for your account.</p>
        <ul>
          <li><b>Description:</b> ${description || "Hostel Fee"}</li>
          <li><b>Amount:</b> ₹${amount}</li>
          <li><b>Due Date:</b> ${due_date}</li>
          <li><b>Status:</b> Pending</li>
        </ul>
        <p>Please make the payment before the due date.</p>
        <br/>
        <p>Regards,<br/>HostelMS Team</p>
      `,
    }).catch((err) => console.error("Email failed:", err));
    res.status(201).json({ message: "Fee record created" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark fee as paid (admin)
router.put("/:id/pay", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await db.query(
      "CALL pay_fee(?, ?)",
      [req.params.id, new Date()]
    );
    res.json({ message: "Fee marked as paid" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
