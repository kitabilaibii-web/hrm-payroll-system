require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { seedIfEmpty } = require("./seed");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/leaves", require("./routes/leaves"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/ai", require("./routes/ai"));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(", ") });
  if (err.code === 11000) return res.status(400).json({ message: "This value already exists (duplicate)" });
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid ID" });
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrmDB")
  .then(async () => {
    console.log("MongoDB connected");
    await seedIfEmpty();
    module.exports = app;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((e) => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
