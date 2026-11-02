const router = require("express").Router();
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const { protect, adminOnly } = require("../middleware/auth");
const wrap = require("../utils/wrap");

router.use(protect, adminOnly);
const FIELDS = ["name", "email", "phone", "department", "designation", "salary", "joiningDate", "status", "role"];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined && body[f] !== "").map((f) => [f, body[f]]));

router.get("/", wrap(async (req, res) => {
  const { q, department, status } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }, { designation: rx }];
  }
  res.json(await Employee.find(filter).sort({ createdAt: -1 }));
}));

router.get("/:id", wrap(async (req, res) => {
  const e = await Employee.findById(req.params.id);
  if (!e) return res.status(404).json({ message: "Employee not found" });
  res.json(e);
}));

router.post("/", wrap(async (req, res) => {
  const e = await Employee.create({ ...pick(req.body), password: req.body.password || "employee123" });
  const out = e.toObject(); delete out.password;
  res.status(201).json(out);
}));

router.put("/:id", wrap(async (req, res) => {
  const e = await Employee.findById(req.params.id);
  if (!e) return res.status(404).json({ message: "Employee not found" });
  if (String(e._id) === String(req.user._id) && (req.body.status === "Inactive" || req.body.role === "employee"))
    return res.status(400).json({ message: "You cannot deactivate or demote your own account" });
  e.set(pick(req.body));
  if (req.body.password) e.password = req.body.password;
  await e.save();
  const out = e.toObject(); delete out.password;
  res.json(out);
}));

router.delete("/:id", wrap(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: "You cannot delete your own account" });
  const e = await Employee.findByIdAndDelete(req.params.id);
  if (!e) return res.status(404).json({ message: "Employee not found" });
  await Promise.all([Attendance.deleteMany({ employee: e._id }), Leave.deleteMany({ employee: e._id }), Payroll.deleteMany({ employee: e._id })]);
  res.json({ message: "Employee deleted" });
}));
module.exports = router;
