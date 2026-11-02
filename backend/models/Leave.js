const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["Casual", "Sick", "Unpaid"], required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: [true, "Reason is required"], trim: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  note: String,
}, { timestamps: true });
module.exports = mongoose.model("Leave", schema);
