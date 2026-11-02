const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const { JWT_SECRET } = require("../utils/config");
exports.protect = async (req, res, next) => {
  try {
    const h = req.headers.authorization || "";
    const t = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!t) return res.status(401).json({ message: "Please login first" });
    const { id } = jwt.verify(t, JWT_SECRET);
    const u = await Employee.findById(id);
    if (!u || u.status !== "Active") return res.status(401).json({ message: "Account not available" });
    req.user = u;
    next();
  } catch (e) {
    res.status(401).json({ message: "Session expired, please login again" });
  }
};
exports.adminOnly = (req, res, next) =>
  req.user.role === "admin" ? next() : res.status(403).json({ message: "Admin access only" });
