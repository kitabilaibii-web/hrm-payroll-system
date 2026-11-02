const router = require("express").Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const { protect, adminOnly } = require("../middleware/auth");
const wrap = require("../utils/wrap");
const { OFFICE_START } = require("../utils/config");
const { todayStr, isWorkday, validDate, validMonth } = require("../utils/dates");
const { attendanceStats } = require("../utils/calc");

router.use(protect);

router.get("/today", wrap(async (req, res) => {
  res.json(await Attendance.findOne({ employee: req.user._id, date: todayStr() }));
}));

router.post("/check-in", wrap(async (req, res) => {
  const date = todayStr();
  if (!isWorkday(date)) return res.status(400).json({ message: "Today is a weekend - no check-in needed" });
  const exists = await Attendance.findOne({ employee: req.user._id, date });
  if (exists) return res.status(400).json({ message: exists.status === "Leave" ? "You are on approved leave today" : "You have already checked in today" });
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const rec = await Attendance.create({ employee: req.user._id, date, checkIn: now, status: hhmm > OFFICE_START ? "Late" : "Present" });
  res.status(201).json(rec);
}));

router.post("/check-out", wrap(async (req, res) => {
  const rec = await Attendance.findOne({ employee: req.user._id, date: todayStr() });
  if (!rec || !rec.checkIn) return res.status(400).json({ message: "Please check in first" });
  if (rec.checkOut) return res.status(400).json({ message: "You have already checked out today" });
  rec.checkOut = new Date();
  await rec.save();
  res.json(rec);
}));

router.get("/", wrap(async (req, res) => {
  const month = validMonth(req.query.month) ? req.query.month : todayStr().slice(0, 7);
  const filter = { date: { $regex: "^" + month } };
  if (req.user.role === "admin") { if (req.query.employee) filter.employee = req.query.employee; }
  else filter.employee = req.user._id;
  res.json(await Attendance.find(filter).populate("employee", "name department designation").sort({ date: -1 }));
}));

router.post("/mark", adminOnly, wrap(async (req, res) => {
  const { employee, date, status } = req.body;
  if (!validDate(date)) return res.status(400).json({ message: "Valid date is required" });
  if (!["Present", "Late", "Absent", "Leave"].includes(status)) return res.status(400).json({ message: "Invalid status" });
  if (!(await Employee.exists({ _id: employee }))) return res.status(404).json({ message: "Employee not found" });
  const rec = await Attendance.findOneAndUpdate({ employee, date },
    { status, leaveType: status === "Leave" ? "Casual" : undefined }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  res.json(rec);
}));

router.get("/summary", adminOnly, wrap(async (req, res) => {
  const month = validMonth(req.query.month) ? req.query.month : todayStr().slice(0, 7);
  const emps = await Employee.find({ status: "Active" }).sort({ name: 1 });
  const rows = [];
  for (const e of emps) rows.push({ _id: e._id, name: e.name, department: e.department, ...(await attendanceStats(e, month)) });
  res.json(rows);
}));
module.exports = router;
