const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, requireRole } = require("../middleware/auth");

// Get all announcements
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, u.name as posted_by_name
      FROM announcements a
      JOIN users u ON a.posted_by = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Create announcement (admin/warden)
router.post("/", verifyToken, requireRole("admin", "warden"), async (req, res) => {
  try {
    const { title, content, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    await db.query(
      "INSERT INTO announcements (title, content, priority, posted_by) VALUES (?, ?, ?, ?)",
      [title, content, priority || "medium", req.user.id]
    );

    res.status(201).json({ message: "Announcement posted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete announcement (admin)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await db.query("DELETE FROM announcements WHERE id = ?", [req.params.id]);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
