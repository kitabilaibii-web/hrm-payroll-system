const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  month: { type: String, required: true }, // YYYY-MM
  basic: Number, workingDays: Number, present: Number, late: Number, absent: Number,
  leaveDays: Number, unpaidLeave: Number, deductibleDays: Number, perDay: Number,
  deduction: Number, bonus: { type: Number, default: 0 }, net: Number,
  status: { type: String, enum: ["Generated", "Paid"], default: "Generated" },
  paidOn: Date,
}, { timestamps: true });
schema.index({ employee: 1, month: 1 }, { unique: true });
module.exports = mongoose.model("Payroll", schema);
