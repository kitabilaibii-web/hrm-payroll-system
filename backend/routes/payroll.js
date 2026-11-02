const router = require("express").Router();
const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const { protect, adminOnly } = require("../middleware/auth");
const wrap = require("../utils/wrap");
const { validMonth, todayStr } = require("../utils/dates");
const { attendanceStats, salaryFrom } = require("../utils/calc");

router.use(protect);

router.get("/", wrap(async (req, res) => {
  const filter = {};
  if (validMonth(req.query.month)) filter.month = req.query.month;
  if (req.user.role !== "admin") filter.employee = req.user._id;
  else if (!filter.month) filter.month = todayStr().slice(0, 7);
  res.json(await Payroll.find(filter).populate("employee", "name email department designation").sort({ month: -1, createdAt: 1 }));
}));

router.post("/generate", adminOnly, wrap(async (req, res) => {
  const { month } = req.body;
  if (!validMonth(month)) return res.status(400).json({ message: "Valid month (YYYY-MM) is required" });
  if (month > todayStr().slice(0, 7)) return res.status(400).json({ message: "Cannot generate payroll for a future month" });
  const emps = await Employee.find({ status: "Active" });
  let count = 0, skipped = 0;
  for (const e of emps) {
    const ex = await Payroll.findOne({ employee: e._id, month });
    if (ex && ex.status === "Paid") { skipped++; continue; }
    const data = salaryFrom(e, await attendanceStats(e, month), ex ? ex.bonus : 0);
    await Payroll.findOneAndUpdate({ employee: e._id, month }, { ...data, status: "Generated" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    count++;
  }
  res.json({ message: `Payroll generated for ${count} employee(s)` + (skipped ? `, ${skipped} already paid were kept` : ""), count });
}));

router.put("/:id", adminOnly, wrap(async (req, res) => {
  const p = await Payroll.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Payroll record not found" });
  if (req.body.bonus !== undefined) {
    const bonus = Number(req.body.bonus);
    if (isNaN(bonus) || bonus < 0) return res.status(400).json({ message: "Bonus must be 0 or more" });
    p.bonus = bonus;
    p.net = p.basic - p.deduction + bonus;
  }
  if (req.body.status) {
    if (!["Generated", "Paid"].includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
    p.status = req.body.status;
    p.paidOn = req.body.status === "Paid" ? new Date() : undefined;
  }
  await p.save();
  res.json(p);
}));
module.exports = router;
