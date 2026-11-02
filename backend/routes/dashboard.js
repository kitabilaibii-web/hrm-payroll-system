const router = require("express").Router();
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const { protect } = require("../middleware/auth");
const wrap = require("../utils/wrap");
const { toStr, todayStr, isWorkday } = require("../utils/dates");
const { attendanceStats, leaveBalance } = require("../utils/calc");

// today if it is a working day, otherwise the last working day
function refDay() {
  const d = new Date();
  while (!isWorkday(toStr(d))) d.setDate(d.getDate() - 1);
  return toStr(d);
}
function lastWorkdays(n, from) {
  const out = [], d = new Date(from + "T00:00:00");
  while (out.length < n) { if (isWorkday(toStr(d))) out.unshift(toStr(d)); d.setDate(d.getDate() - 1); }
  return out;
}

router.get("/", protect, wrap(async (req, res) => {
  const today = todayStr(), month = today.slice(0, 7), ref = refDay();
  if (req.user.role === "admin") {
    const [total, active, present, late, onLeave, pending, depts, pay, recentPending, trend] = await Promise.all([
      Employee.countDocuments(), Employee.countDocuments({ status: "Active" }),
      Attendance.countDocuments({ date: ref, status: "Present" }), Attendance.countDocuments({ date: ref, status: "Late" }),
      Attendance.countDocuments({ date: ref, status: "Leave" }), Leave.countDocuments({ status: "Pending" }),
      Employee.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Payroll.aggregate([{ $group: { _id: "$month", total: { $sum: "$net" } } }, { $sort: { _id: -1 } }, { $limit: 6 }]),
      Leave.find({ status: "Pending" }).populate("employee", "name").sort({ createdAt: -1 }).limit(5),
      Promise.all(lastWorkdays(7, ref).map(async (d) => ({ date: d, count: await Attendance.countDocuments({ date: d, status: { $in: ["Present", "Late"] } }) }))),
    ]);
    const absent = Math.max(0, active - present - late - onLeave);
    const payrollThisMonth = (await Payroll.aggregate([{ $match: { month } }, { $group: { _id: null, total: { $sum: "$net" } } }]))[0];
    return res.json({ role: "admin", refDay: ref, isToday: ref === today, total, active, present, late, onLeave, absent, pending,
      depts, payroll: pay.reverse(), recentPending, trend, payrollThisMonth: payrollThisMonth ? payrollThisMonth.total : 0 });
  }
  const [stats, balance, pending, lastPayslip, todayRec] = await Promise.all([
    attendanceStats(req.user, month), leaveBalance(req.user._id, today.slice(0, 4)),
    Leave.countDocuments({ employee: req.user._id, status: "Pending" }),
    Payroll.findOne({ employee: req.user._id }).sort({ month: -1 }),
    Attendance.findOne({ employee: req.user._id, date: today }),
  ]);
  res.json({ role: "employee", stats, balance, pending, lastPayslip, todayRec });
}));
module.exports = router;
