const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { verifyToken, SECRET } = require("../middleware/auth");

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, cgpa } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if user exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role || "student";
    const finalCgpa = userRole === "student" ? (cgpa || null) : null;

    if (userRole === "student" && !cgpa) {
    return res.status(400).json({ error: "CGPA is required for students" });
    }

    await db.query(
      "INSERT INTO users (name, email, phone, password, role, cgpa) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, phone || null, hash, userRole, finalCgpa]
    );

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "24h" });

    // Return user without password
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;