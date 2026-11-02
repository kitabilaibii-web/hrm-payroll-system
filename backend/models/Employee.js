const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const schema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Enter a valid email"] },
  password: { type: String, required: true, minlength: [6, "Password must be at least 6 characters"], select: false },
  role: { type: String, enum: ["admin", "employee"], default: "employee" },
  phone: { type: String, trim: true, match: [/^\d{10,15}$/, "Phone must be 10-15 digits"] },
  department: { type: String, enum: ["IT", "HR", "Sales", "Finance", "Marketing", "Operations"] },
  designation: { type: String, trim: true },
  salary: { type: Number, required: [true, "Salary is required"], min: [0, "Salary cannot be negative"] },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });
schema.pre("save", async function () {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 10);
});
schema.methods.matchPassword = function (p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model("Employee", schema);
