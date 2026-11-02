import { useEffect, useState } from "react";
import { api } from "../api";
import { Bars, Badge, Donut, Empty, HBar, Icon, Stat, fmtDate, fmtTime, monthLabel, money, useToast } from "../ui";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

export default function Dashboard({ user, go }) {
  const [d, setD] = useState(null);
  const [ann, setAnn] = useState([]);
  const toast = useToast();
  const load = () => { api("/dashboard").then(setD).catch((e) => toast(e.message, "error")); api("/announcements").then((a) => setAnn(a.slice(0, 4))).catch(() => {}); };
  useEffect(load, []);
  if (!d) return <Empty text="Loading dashboard..." />;

  const announcements = (
    <div className="card"><div className="row between"><h3>Announcements</h3><button className="btn sm" onClick={() => go("announcements")}>View all</button></div>
      {ann.length === 0 && <Empty text="No announcements" />}
      {ann.map((a) => <div className="ann" key={a._id}><div className="row between"><b>{a.title}</b><Badge>{a.priority}</Badge></div><div className="muted small">{a.message}</div></div>)}
    </div>
  );

  if (d.role === "admin") {
    const day = new Date(d.refDay + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
    const maxDept = Math.max(1, ...d.depts.map((x) => x.count));
    return (
      <>
        <div className="hero"><h2>{greet()}, {user.name.split(" ")[0]}!</h2><p>Company overview for {day}{d.isToday ? "" : " (last working day)"}.</p></div>
        <div className="grid g-stats" style={{ marginBottom: 16 }}>
          <Stat icon="users" color="#4f46e5" label="Total employees" value={d.total} sub={d.active + " active"} />
          <Stat icon="check" color="#16a34a" label="Present" value={d.present + d.late} sub={d.late + " late"} />
          <Stat icon="calendar" color="#0284c7" label="On leave" value={d.onLeave} />
          <Stat icon="clock" color="#f59e0b" label="Pending leaves" value={d.pending} />
          <Stat icon="wallet" color="#7c3aed" label="Payroll this month" value={money(d.payrollThisMonth)} />
        </div>
        <div className="grid g-2" style={{ marginBottom: 16 }}>
          <div className="card"><h3>Attendance ({day})</h3>
            <Donut center={d.active} data={[{ label: "Present", value: d.present, color: "#16a34a" }, { label: "Late", value: d.late, color: "#f59e0b" }, { label: "On leave", value: d.onLeave, color: "#0284c7" }, { label: "Absent", value: d.absent, color: "#e11d48" }]} />
          </div>
          <div className="card"><h3>Attendance trend (last 7 working days)</h3>
            <Bars data={d.trend.map((t) => ({ label: t.date.slice(5), value: t.count }))} /></div>
        </div>
        <div className="grid g-2" style={{ marginBottom: 16 }}>
          <div className="card"><h3>Payroll paid per month</h3>
            <Bars data={d.payroll.map((p) => ({ label: monthLabel(p._id).slice(0, 3), value: p.total }))} format={(v) => Math.round(v / 1000) + "k"} /></div>
          <div className="card"><h3>Employees by department</h3>
            {d.depts.map((x) => <HBar key={x._id || "none"} label={x._id || "Unassigned"} value={x.count} max={maxDept} />)}</div>
        </div>
        <div className="grid g-2">
          <div className="card"><div className="row between"><h3>Pending leave requests</h3><button className="btn sm" onClick={() => go("leaves")}>Review</button></div>
            {d.recentPending.length === 0 && <Empty text="No pending requests" />}
            {d.recentPending.map((l) => <div className="ann row between" key={l._id}><span><b>{l.employee?.name}</b><div className="muted small">{l.type} - {fmtDate(l.from)} to {fmtDate(l.to)} ({l.days}d)</div></span><Badge>Pending</Badge></div>)}
          </div>
          {announcements}
        </div>
      </>
    );
  }

  const s = d.stats, att = s.present + s.late;
  return (
    <>
      <div className="hero"><h2>{greet()}, {user.name.split(" ")[0]}!</h2><p>Here is your summary for {monthLabel(new Date().toISOString().slice(0, 7))}.</p></div>
      <div className="grid g-stats" style={{ marginBottom: 16 }}>
        <Stat icon="check" color="#16a34a" label="Days present" value={att} sub={"of " + s.workingDays + " working days"} />
        <Stat icon="clock" color="#f59e0b" label="Late arrivals" value={s.late} />
        <Stat icon="x" color="#e11d48" label="Absent days" value={s.absent} />
        <Stat icon="calendar" color="#0284c7" label="Pending leaves" value={d.pending} />
      </div>
      <div className="grid g-2" style={{ marginBottom: 16 }}>
        <div className="card"><h3>Today</h3>
          {d.todayRec ? <p>Status: <Badge>{d.todayRec.status}</Badge><br />Check-in: <b>{fmtTime(d.todayRec.checkIn)}</b> &nbsp; Check-out: <b>{fmtTime(d.todayRec.checkOut)}</b></p> : <p className="muted">You have not checked in today.</p>}
          <button className="btn primary" onClick={() => go("attendance")}><Icon name="clock" />Go to attendance</button></div>
        <div className="card"><h3>Leave balance (this year)</h3>
          {Object.entries(d.balance).map(([t, b]) => <HBar key={t} label={t + " leave"} value={b.used} max={b.allowed} text={`${b.left} left of ${b.allowed}`} />)}</div>
      </div>
      <div className="grid g-2">
        <div className="card"><h3>Latest payslip</h3>
          {d.lastPayslip ? <><p className="muted" style={{ margin: 0 }}>{monthLabel(d.lastPayslip.month)}</p><div style={{ fontSize: 28, fontWeight: 700 }}>{money(d.lastPayslip.net)}</div><p className="muted small">Deductions: {money(d.lastPayslip.deduction)} | Bonus: {money(d.lastPayslip.bonus)}</p><button className="btn sm" onClick={() => go("payroll")}>View payslips</button></> : <Empty text="No payslip yet" />}</div>
        {announcements}
      </div>
    </>
  );
}
