// Fills the database with demo data so the dashboard looks full on first run.
require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const Attendance = require("./models/Attendance");
const Leave = require("./models/Leave");
const Payroll = require("./models/Payroll");
const Announcement = require("./models/Announcement");
const { toStr, todayStr, isWorkday, rangeDays } = require("./utils/dates");
const { attendanceStats, salaryFrom } = require("./utils/calc");

const pad = (n) => String(n).padStart(2, "0");
let seed = 42;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const at = (date, mins) => new Date(`${date}T${pad(Math.floor(mins / 60))}:${pad(mins % 60)}:00`);

const PEOPLE = [
  ["Ayesha Khan", "ayesha", "IT", "Software Engineer", 120000],
  ["Hassan Raza", "hassan", "IT", "Backend Developer", 110000],
  ["Sana Malik", "sana", "HR", "HR Executive", 75000],
  ["Bilal Ahmed", "bilal", "Sales", "Sales Manager", 95000],
  ["Fatima Noor", "fatima", "Finance", "Accountant", 85000],
  ["Usman Tariq", "usman", "Marketing", "Marketing Lead", 90000],
  ["Hira Aslam", "hira", "Operations", "Operations Officer", 65000],
  ["Zain Abbas", "zain", "Sales", "Sales Executive", 60000],
];

function workdayShift(n) { // n>0 future, n<0 past (in working days)
  const d = new Date(); let left = Math.abs(n);
  while (left > 0) { d.setDate(d.getDate() + (n > 0 ? 1 : -1)); if (isWorkday(toStr(d))) left--; }
  return toStr(d);
}

async function seedDemo() {
  await Promise.all([Employee, Attendance, Leave, Payroll, Announcement].map((m) => m.deleteMany({})));
  const joined = new Date(); joined.setMonth(joined.getMonth() - 8);
  const people = [{ name: "HR Admin", email: "admin@hrm.com", password: "admin123", role: "admin", department: "HR", designation: "HR Manager", salary: 150000, phone: "03001112222" }]
    .concat(PEOPLE.map(([name, id, department, designation, salary], i) => ({ name, email: id + "@hrm.com", password: "employee123", department, designation, salary, phone: "0300" + String(1000000 + i * 137)})));
  const emps = [];
  for (const p of people) emps.push(await Employee.create({ ...p, joiningDate: joined }));

  // attendance for the last 5 months
  const start = new Date(); start.setMonth(start.getMonth() - 5); start.setDate(1);
  const todayS = todayStr(), docs = [];
  const lw = new Date(); while (!isWorkday(toStr(lw))) lw.setDate(lw.getDate() - 1);
  const lastWork = toStr(lw); // makes the latest working day look realistic (some late / absent)
  for (const d of rangeDays(toStr(start), todayS)) {
    if (!isWorkday(d)) continue;
    for (const e of emps) {
      if (d === todayS && (e.role === "admin" || rnd() < 0.2)) continue; // keep admin free to demo check-in
      const r = rnd();
      let status = "Present";
      if (e.role !== "admin") { if (r > 0.96) status = "Absent"; else if (r > 0.88) status = "Late"; }
      if (d === lastWork) { if (e.email === "bilal@hrm.com" || e.email === "zain@hrm.com") status = "Late"; else if (e.email === "hira@hrm.com") status = "Absent"; else if (e.role !== "admin") status = "Present"; }
      if (status === "Absent") { docs.push({ employee: e._id, date: d, status }); continue; }
      const inMin = status === "Late" ? 575 + Math.floor(rnd() * 50) : 520 + Math.floor(rnd() * 50);
      docs.push({ employee: e._id, date: d, status, checkIn: at(d, inMin), checkOut: d < todayS ? at(d, 1020 + Math.floor(rnd() * 60)) : undefined });
    }
  }
  await Attendance.insertMany(docs);

  // leaves
  const mk = async (emp, type, from, to, reason, status, note) => {
    const days = rangeDays(from, to).filter(isWorkday).length;
    await Leave.create({ employee: emp._id, type, from, to, days, reason, status, note });
    if (status === "Approved")
      for (const d of rangeDays(from, to).filter(isWorkday)) await Attendance.updateOne({ employee: emp._id, date: d }, { status: "Leave", leaveType: type, $unset: { checkIn: 1, checkOut: 1 } }, { upsert: true });
  };
  await mk(emps[2], "Sick", lastWork, lastWork, "Not feeling well", "Approved", "Take rest");
  await mk(emps[3], "Sick", workdayShift(-12), workdayShift(-11), "Fever and flu", "Approved", "Get well soon");
  await mk(emps[5], "Casual", workdayShift(-25), workdayShift(-24), "Family function", "Approved");
  await mk(emps[7], "Unpaid", workdayShift(-35), workdayShift(-34), "Personal work", "Approved");
  await mk(emps[8], "Casual", workdayShift(-8), workdayShift(-8), "Bank work", "Rejected", "Project deadline that day");
  await mk(emps[2], "Casual", workdayShift(3), workdayShift(4), "Sister's wedding", "Pending");
  await mk(emps[4], "Sick", workdayShift(5), workdayShift(5), "Dentist appointment", "Pending");
  await mk(emps[6], "Casual", workdayShift(7), workdayShift(9), "Out of town trip", "Pending");

  // payroll for the last 5 complete months
  for (let i = 5; i >= 1; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    for (const e of emps) {
      const bonus = rnd() > 0.8 ? 5000 : 0;
      await Payroll.create({ employee: e._id, month, ...salaryFrom(e, await attendanceStats(e, month), bonus), status: "Paid", paidOn: new Date(`${month}-28T10:00:00`) });
    }
  }
  await Announcement.insertMany([
    { title: "Welcome to the new HR portal", message: "You can now check in, apply for leave and download payslips from one place.", priority: "Important", author: emps[0]._id },
    { title: "Office timing reminder", message: "Office starts at 9:30 AM. Every 3 late arrivals in a month cut one day of salary.", priority: "Normal", author: emps[0]._id },
    { title: "Eid holiday notice", message: "The office will remain closed on public holidays. Please plan your leave in advance.", priority: "Normal", author: emps[0]._id },
  ]);
  console.log(`Demo data ready: ${emps.length} employees, ${docs.length} attendance records.`);
  console.log("Admin login: admin@hrm.com / admin123   |   Employee login: ayesha@hrm.com / employee123");
}

async function seedIfEmpty() { if ((await Employee.countDocuments()) === 0) await seedDemo(); }
module.exports = { seedDemo, seedIfEmpty };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrmDB")
    .then(seedDemo).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
