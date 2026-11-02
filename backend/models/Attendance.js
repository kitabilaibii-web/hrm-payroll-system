const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ["Present", "Late", "Absent", "Leave"], required: true },
  leaveType: String,
}, { timestamps: true });
schema.index({ employee: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("Attendance", schema);
