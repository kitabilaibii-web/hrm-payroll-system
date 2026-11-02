const router = require("express").Router();
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const { protect } = require("../middleware/auth");
const wrap = require("../utils/wrap");
const { todayStr } = require("../utils/dates");
const { attendanceStats, leaveBalance } = require("../utils/calc");

router.post("/ask", protect, wrap(async (req, res) => {
  const gKey = process.env.GEMINI_API_KEY, cKey = process.env.ANTHROPIC_API_KEY;
  if (!gKey && !cKey) return res.status(503).json({ message: "AI is not set up yet. Add GEMINI_API_KEY in backend/.env and restart the backend." });
  const question = String(req.body.question || "").trim().slice(0, 500);
  if (!question) return res.status(400).json({ message: "Please type a question" });
  const month = todayStr().slice(0, 7);
  let data;
  if (req.user.role === "admin") {
    const emps = await Employee.find({ status: "Active" }).limit(60);
    const rows = [];
    for (const e of emps) rows.push({ name: e.name, department: e.department, designation: e.designation, salary: e.salary, ...(await attendanceStats(e, month)) });
    data = { scope: "whole company (admin view)", month, employees: rows, pendingLeaves: await Leave.countDocuments({ status: "Pending" }) };
  } else {
    data = { scope: "only this employee's own data", month, name: req.user.name, thisMonth: await attendanceStats(req.user, month),
      leaveBalance: await leaveBalance(req.user._id, todayStr().slice(0, 4)), lastPayslip: await Payroll.findOne({ employee: req.user._id }).sort({ month: -1 }).select("-employee -_id -__v") };
  }
  const system = "You are the HR assistant inside an HR and Payroll web app. Answer ONLY from the JSON data given. Be short, clear and friendly. " +
    "If the data does not contain the answer, say so. Never invent numbers. If the user is not an admin, never talk about other employees. Salary figures are in Rs. Company rules: Casual leave 10 days/year, Sick 8 days/year, office starts 9:30 AM, every 3 late arrivals cut 1 day of salary.";
  const userText = `User: ${req.user.name} (${req.user.role})\nData: ${JSON.stringify(data)}\n\nQuestion: ${question}`;
  let r, out, answer;
  if (gKey) {
    const model = process.env.GEMINI_MODEL || "gemini-3.7-flash";
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": gKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { maxOutputTokens: 1200 },
      }),
    });
    out = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = out.error && out.error.message ? out.error.message : r.status;
      const hint = r.status === 404 ? " (model name may have changed - set GEMINI_MODEL in backend/.env)" : r.status === 429 ? " (free limit reached, wait a minute and try again)" : "";
      return res.status(502).json({ message: "AI service error: " + msg + hint });
    }
    const parts = out.candidates && out.candidates[0] && out.candidates[0].content ? out.candidates[0].content.parts || [] : [];
    answer = parts.map((x) => x.text || "").join("\n").trim();
    if (!answer) answer = "Sorry, I could not answer that. Please try asking in a different way.";
  } else {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system, messages: [{ role: "user", content: userText }] }),
    });
    out = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ message: "AI service error: " + (out.error && out.error.message ? out.error.message : r.status) });
    answer = (out.content || []).map((c) => c.text || "").join("\n").trim();
  }
  res.json({ answer });
}));
module.exports = router;