const router = require("express").Router();
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const { protect, adminOnly } = require("../middleware/auth");
const wrap = require("../utils/wrap");
const { isWorkday, rangeDays, validDate, todayStr } = require("../utils/dates");
const { leaveBalance } = require("../utils/calc");

router.use(protect);

router.get("/balance", wrap(async (req, res) => {
  res.json(await leaveBalance(req.user._id, req.query.year || todayStr().slice(0, 4)));
}));

router.get("/", wrap(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { employee: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  res.json(await Leave.find(filter).populate("employee", "name department designation").sort({ createdAt: -1 }));
}));

router.post("/", wrap(async (req, res) => {
  const { type, from, to, reason } = req.body;
  if (!["Casual", "Sick", "Unpaid"].includes(type)) return res.status(400).json({ message: "Choose a valid leave type" });
  if (!validDate(from) || !validDate(to)) return res.status(400).json({ message: "Valid from and to dates are required" });
  if (to < from) return res.status(400).json({ message: "End date cannot be before start date" });
  if (!reason || !String(reason).trim()) return res.status(400).json({ message: "Reason is required" });
  const days = rangeDays(from, to).filter(isWorkday).length;
  if (days === 0) return res.status(400).json({ message: "Selected dates have no working days (weekend only)" });
  const overlap = await Leave.findOne({ employee: req.user._id, status: { $in: ["Pending", "Approved"] }, from: { $lte: to }, to: { $gte: from } });
  if (overlap) return res.status(400).json({ message: "You already have a leave request in these dates" });
  if (type !== "Unpaid") {
    const bal = await leaveBalance(req.user._id, from.slice(0, 4));
    if (days > bal[type].left) return res.status(400).json({ message: `Not enough ${type} leave balance (${bal[type].left} day(s) left)` });
  }
  res.status(201).json(await Leave.create({ employee: req.user._id, type, from, to, days, reason }));
}));

router.put("/:id/status", adminOnly, wrap(async (req, res) => {
  const { status, note } = req.body;
  if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ message: "Status must be Approved or Rejected" });
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });
  if (leave.status !== "Pending") return res.status(400).json({ message: "This request is already " + leave.status });
  leave.status = status; leave.note = note || undefined;
  await leave.save();
  if (status === "Approved") {
    for (const date of rangeDays(leave.from, leave.to).filter(isWorkday))
      await Attendance.findOneAndUpdate({ employee: leave.employee, date }, { status: "Leave", leaveType: leave.type, $unset: { checkIn: 1, checkOut: 1 } }, { upsert: true });
  }
  res.json(leave);
}));

router.delete("/:id", wrap(async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, employee: req.user._id });
  if (!leave) return res.status(404).json({ message: "Leave request not found" });
  if (leave.status !== "Pending") return res.status(400).json({ message: "Only pending requests can be cancelled" });
  await leave.deleteOne();
  res.json({ message: "Leave request cancelled" });
}));
module.exports = router;
