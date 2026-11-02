const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const { LEAVE_ALLOWANCE, LATE_PER_DEDUCTION } = require("./config");
const { todayStr, isWorkday, monthDays } = require("./dates");

// Attendance numbers of one employee for one month
async function attendanceStats(emp, month) {
  const days = monthDays(month);
  const workingDays = days.filter(isWorkday).length;
  const recs = await Attendance.find({ employee: emp._id, date: { $regex: "^" + month } });
  const map = {};
  recs.forEach((r) => (map[r.date] = r));
  const today = todayStr();
  const join = emp.joiningDate ? emp.joiningDate.toISOString().slice(0, 10) : "0000-00-00";
  let present = 0, late = 0, absent = 0, leave = 0, unpaidLeave = 0;
  for (const d of days) {
    if (!isWorkday(d) || d > today || d < join) continue;
    const r = map[d];
    if (!r) { if (d < today) absent++; continue; }
    if (r.status === "Present") present++;
    else if (r.status === "Late") late++;
    else if (r.status === "Absent") absent++;
    else if (r.status === "Leave") r.leaveType === "Unpaid" ? unpaidLeave++ : leave++;
  }
  return { workingDays, present, late, absent, leave, unpaidLeave };
}

function salaryFrom(emp, s, bonus = 0) {
  const perDay = s.workingDays ? emp.salary / s.workingDays : 0;
  const deductibleDays = s.absent + s.unpaidLeave + Math.floor(s.late / LATE_PER_DEDUCTION);
  const deduction = Math.min(emp.salary, Math.round(perDay * deductibleDays));
  return { basic: emp.salary, ...s, leaveDays: s.leave, perDay: Math.round(perDay), deductibleDays, deduction, bonus, net: emp.salary - deduction + bonus };
}

async function leaveBalance(empId, year) {
  const rows = await Leave.find({ employee: empId, status: { $in: ["Approved", "Pending"] }, from: { $regex: "^" + year } });
  const out = {};
  for (const [type, allowed] of Object.entries(LEAVE_ALLOWANCE)) {
    const used = rows.filter((r) => r.type === type).reduce((a, r) => a + r.days, 0);
    out[type] = { allowed, used, left: allowed - used };
  }
  return out;
}
module.exports = { attendanceStats, salaryFrom, leaveBalance };
