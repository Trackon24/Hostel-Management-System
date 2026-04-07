const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, requireRole } = require("../middleware/auth");

// Blocked dangerous patterns (case-insensitive)
const BLOCKED_PATTERNS = [
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA/i,
  /TRUNCATE\s+DATABASE/i,
  /GRANT\s+/i,
  /REVOKE\s+/i,
  /CREATE\s+USER/i,
  /DROP\s+USER/i,
  /ALTER\s+USER/i,
  /FLUSH\s+/i,
  /LOAD\s+DATA/i,
  /INTO\s+OUTFILE/i,
  /INTO\s+DUMPFILE/i,
];

// Execute SQL query (admin only)
router.post("/execute", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Query is required" });
    }

    const trimmedQuery = query.trim();

    // Check for blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(trimmedQuery)) {
        return res.status(403).json({
          error: "This query type is blocked for security reasons.",
        });
      }
    }

    const startTime = Date.now();
    const [result] = await db.query(trimmedQuery);
    const executionTime = Date.now() - startTime;

    // Determine if this is a SELECT-type query (returns rows)
    if (Array.isArray(result)) {
      res.json({
        type: "select",
        rows: result,
        columns: result.length > 0 ? Object.keys(result[0]) : [],
        rowCount: result.length,
        executionTime,
      });
    } else {
      // INSERT, UPDATE, DELETE, etc.
      res.json({
        type: "mutation",
        affectedRows: result.affectedRows || 0,
        insertId: result.insertId || null,
        changedRows: result.changedRows || 0,
        message: result.message || "",
        executionTime,
      });
    }
  } catch (err) {
    res.status(400).json({
      error: err.message || "Query execution failed",
      code: err.code || null,
      sqlState: err.sqlState || null,
    });
  }
});

// Get list of tables (admin only)
router.get("/tables", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const [tables] = await db.query("SHOW TABLES");
    const tableNames = tables.map((t) => Object.values(t)[0]);
    res.json(tableNames);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

// Get table structure (admin only)
router.get("/describe/:table", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    // Sanitize table name to prevent injection
    const tableName = req.params.table.replace(/[^a-zA-Z0-9_]/g, "");
    const [columns] = await db.query(`DESCRIBE ${tableName}`);
    res.json(columns);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to describe table" });
  }
});

module.exports = router;
