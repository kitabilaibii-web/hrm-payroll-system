const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const { protect } = require("../middleware/auth");
const wrap = require("../utils/wrap");
const { JWT_SECRET } = require("../utils/config");

router.post("/login", wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const u = await Employee.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!u || !(await u.matchPassword(password))) return res.status(401).json({ message: "Invalid email or password" });
  if (u.status !== "Active") return res.status(403).json({ message: "Your account is inactive" });
  const token = jwt.sign({ id: u._id }, JWT_SECRET, { expiresIn: "7d" });
  const user = u.toObject();
  delete user.password;
  res.json({ token, user });
}));

router.get("/me", protect, (req, res) => res.json(req.user));

router.put("/password", protect, wrap(async (req, res) => {
  const { current, next } = req.body;
  if (!current || !next) return res.status(400).json({ message: "Current and new password are required" });
  if (String(next).length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
  const u = await Employee.findById(req.user._id).select("+password");
  if (!(await u.matchPassword(current))) return res.status(400).json({ message: "Current password is wrong" });
  u.password = next;
  await u.save();
  res.json({ message: "Password changed successfully" });
}));
module.exports = router;
