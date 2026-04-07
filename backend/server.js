const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/allocations", require("./routes/allocations"));
app.use("/api/fees", require("./routes/fees"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/stats", require("./routes/stats"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));