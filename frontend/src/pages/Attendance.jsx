import { useEffect, useState } from "react";
import { api } from "../api";
import { Avatar, Badge, Empty, Icon, Modal, downloadCSV, fmtDate, fmtTime, monthLabel, thisMonth, todayISO, useToast } from "../ui";

export default function Attendance({ user }) {
  const admin = user.role === "admin";
  const [month, setMonth] = useState(thisMonth());
  const [emp, setEmp] = useState("");
  const [emps, setEmps] = useState([]);
  const [recs, setRecs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [today, setToday] = useState(null);
  const [now, setNow] = useState(new Date());
  const [mark, setMark] = useState(null);
  const toast = useToast();

  const load = () => {
    api(`/attendance?month=${month}${emp ? "&employee=" + emp : ""}`).then(setRecs).catch((e) => toast(e.message, "error"));
    api("/attendance/today").then(setToday).catch(() => {});
    if (admin) api("/attendance/summary?month=" + month).then(setSummary).catch(() => {});
  };
  useEffect(load, [month, emp]);
  useEffect(() => { if (admin) api("/employees?status=Active").then(setEmps).catch(() => {}); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const act = async (path, msg) => { try { await api("/attendance/" + path, { method: "POST" }); toast(msg); load(); } catch (e) { toast(e.message, "error"); } };
  const saveMark = async (e) => {
    e.preventDefault();
    try { await api("/attendance/mark", { method: "POST", body: mark }); toast("Attendance saved"); setMark(null); load(); }
    catch (err) { toast(err.message, "error"); }
  };
  const cnt = (s) => recs.filter((r) => r.status === s).length;
  const exportCSV = () => downloadCSV(`attendance-${month}.csv`, [["Date", "Employee", "Status", "Check-in", "Check-out"], ...recs.map((r) => [r.date, r.employee?.name, r.status, fmtTime(r.checkIn), fmtTime(r.checkOut)])]);

  return (
    <>
      <div className="grid g-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h3>Today - {now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</h3>
          <div className="clock">{now.toLocaleTimeString("en-US")}</div>
          <p className="muted">{today ? <>Status: <Badge>{today.status}</Badge> &nbsp; In: <b>{fmtTime(today.checkIn)}</b> &nbsp; Out: <b>{fmtTime(today.checkOut)}</b></> : "You have not checked in yet. Office starts at 9:30 AM."}</p>
          <div className="row">
            <button className="btn ok" disabled={!!today} onClick={() => act("check-in", "Checked in successfully")}><Icon name="check" />Check in</button>
            <button className="btn bad" disabled={!today || !today.checkIn || !!today.checkOut} onClick={() => act("check-out", "Checked out. Have a good day!")}><Icon name="logout" />Check out</button>
          </div>
        </div>
        <div className="card">
          <h3>{admin && !emp ? "All records" : "Records"} - {monthLabel(month)}</h3>
          <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", textAlign: "center" }}>
            {[["Present", "#16a34a"], ["Late", "#d97706"], ["Absent", "#e11d48"], ["Leave", "#0284c7"]].map(([s, c]) => <div key={s}><div style={{ fontSize: 28, fontWeight: 700, color: c }}>{cnt(s)}</div><div className="muted small">{s}</div></div>)}
          </div>
        </div>
      </div>

      {admin && (
        <div className="card tablewrap" style={{ marginBottom: 16 }}>
          <h3>Monthly summary - {monthLabel(month)}</h3>
          <table>
            <thead><tr><th>Employee</th><th>Working days</th><th>Present</th><th>Late</th><th>Absent</th><th>Leave</th><th>Attendance %</th></tr></thead>
            <tbody>{summary.map((r) => {
              const pct = r.workingDays ? Math.round(((r.present + r.late + r.leave + r.unpaidLeave) / r.workingDays) * 100) : 0;
              return <tr key={r._id}><td><div className="row"><Avatar name={r.name} size={30} /><div><b>{r.name}</b><div className="muted small">{r.department}</div></div></div></td>
                <td>{r.workingDays}</td><td>{r.present}</td><td>{r.late}</td><td>{r.absent}</td><td>{r.leave + r.unpaidLeave}</td><td><b>{pct}%</b></td></tr>;
            })}</tbody>
          </table>
        </div>
      )}

      <div className="toolbar">
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        {admin && <select value={emp} onChange={(e) => setEmp(e.target.value)}><option value="">All employees</option>{emps.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}</select>}
        <span className="grow" />
        <button className="btn" onClick={exportCSV}><Icon name="download" />Export CSV</button>
        {admin && <button className="btn primary" onClick={() => setMark({ employee: emps[0]?._id || "", date: todayISO(), status: "Present" })}><Icon name="plus" />Mark attendance</button>}
      </div>
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Date</th>{admin && <th>Employee</th>}<th>Status</th><th>Check-in</th><th>Check-out</th></tr></thead>
          <tbody>{recs.map((r) => <tr key={r._id}><td>{fmtDate(r.date)}</td>{admin && <td>{r.employee?.name}</td>}<td><Badge>{r.status}</Badge>{r.status === "Leave" && r.leaveType ? <span className="muted small"> {r.leaveType}</span> : null}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td></tr>)}</tbody>
        </table>
        {recs.length === 0 && <Empty text="No attendance records for this month" />}
      </div>

      {mark && (
        <Modal title="Mark attendance" onClose={() => setMark(null)}>
          <form onSubmit={saveMark}>
            <div className="field"><label>Employee</label><select value={mark.employee} onChange={(e) => setMark({ ...mark, employee: e.target.value })}>{emps.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}</select></div>
            <div className="field"><label>Date</label><input type="date" value={mark.date} onChange={(e) => setMark({ ...mark, date: e.target.value })} /></div>
            <div className="field"><label>Status</label><select value={mark.status} onChange={(e) => setMark({ ...mark, status: e.target.value })}><option>Present</option><option>Late</option><option>Absent</option><option>Leave</option></select></div>
            <div className="row" style={{ justifyContent: "flex-end" }}><button type="button" className="btn" onClick={() => setMark(null)}>Cancel</button><button className="btn primary">Save</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
