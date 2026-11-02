const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const isWorkday = (s) => { const d = new Date(s + "T00:00:00").getDay(); return d >= 1 && d <= 5; };
const monthDays = (month) => {
  const [y, m] = month.split("-").map(Number);
  const n = new Date(y, m, 0).getDate();
  return Array.from({ length: n }, (_, i) => `${month}-${pad(i + 1)}`);
};
const rangeDays = (from, to) => {
  const out = [];
  const d = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (d <= end) { out.push(toStr(d)); d.setDate(d.getDate() + 1); }
  return out;
};
const validDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !isNaN(new Date(s + "T00:00:00"));
const validMonth = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s || "");
module.exports = { toStr, todayStr, isWorkday, monthDays, rangeDays, validDate, validMonth };
