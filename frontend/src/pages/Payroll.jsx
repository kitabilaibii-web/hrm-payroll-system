import { useEffect, useState } from "react";
import { api } from "../api";
import { Badge, Empty, Icon, Modal, Stat, downloadCSV, fmtDate, money, monthLabel, thisMonth, useToast } from "../ui";

export default function Payroll({ user }) {
  const admin = user.role === "admin";
  const [month, setMonth] = useState(thisMonth());
  const [list, setList] = useState([]);
  const [slip, setSlip] = useState(null);
  const [bonus, setBonus] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () => api("/payroll" + (admin ? "?month=" + month : "")).then(setList).catch((e) => toast(e.message, "error"));
  useEffect(() => { load(); }, [month]);

  const generate = async () => {
    setBusy(true);
    try { const r = await api("/payroll/generate", { method: "POST", body: { month } }); toast(r.message); load(); }
    catch (e) { toast(e.message, "error"); }
    setBusy(false);
  };
  const update = async (id, body, msg) => { try { await api("/payroll/" + id, { method: "PUT", body }); toast(msg); setBonus(null); load(); } catch (e) { toast(e.message, "error"); } };
  const total = (k) => list.reduce((a, p) => a + (p[k] || 0), 0);
  const exportCSV = () => downloadCSV(`payroll-${month}.csv`, [["Employee", "Department", "Basic", "Absent", "Late", "Unpaid leave", "Deduction", "Bonus", "Net", "Status"],
    ...list.map((p) => [p.employee?.name, p.employee?.department, p.basic, p.absent, p.late, p.unpaidLeave, p.deduction, p.bonus, p.net, p.status])]);

  return (
    <>
      {admin && (
        <>
          <div className="toolbar">
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} max={thisMonth()} />
            <span className="grow" />
            <button className="btn" onClick={exportCSV} disabled={!list.length}><Icon name="download" />Export CSV</button>
            <button className="btn primary" onClick={generate} disabled={busy}><Icon name="wallet" />{busy ? "Generating..." : "Generate payroll"}</button>
          </div>
          <div className="grid g-stats" style={{ marginBottom: 16 }}>
            <Stat icon="wallet" color="#4f46e5" label={"Net payable - " + monthLabel(month)} value={money(total("net"))} />
            <Stat icon="x" color="#e11d48" label="Total deductions" value={money(total("deduction"))} />
            <Stat icon="plus" color="#16a34a" label="Total bonus" value={money(total("bonus"))} />
            <Stat icon="check" color="#0284c7" label="Paid" value={`${list.filter((p) => p.status === "Paid").length} / ${list.length}`} />
          </div>
        </>
      )}
      <div className="card tablewrap">
        <table>
          <thead><tr>{admin ? <th>Employee</th> : <th>Month</th>}<th>Basic</th><th>Absent</th><th>Late</th><th>Deduction</th><th>Bonus</th><th>Net salary</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((p) => (
            <tr key={p._id}>
              <td>{admin ? <><b>{p.employee?.name}</b><div className="muted small">{p.employee?.department}</div></> : <b>{monthLabel(p.month)}</b>}</td>
              <td>{money(p.basic)}</td><td>{p.absent}</td><td>{p.late}</td><td>{money(p.deduction)}</td><td>{money(p.bonus)}</td><td><b>{money(p.net)}</b></td><td><Badge>{p.status}</Badge></td>
              <td className="right" style={{ whiteSpace: "nowrap" }}>
                <button className="btn sm" onClick={() => setSlip(p)}><Icon name="file" />Payslip</button>
                {admin && p.status !== "Paid" && <>{" "}<button className="btn sm" onClick={() => setBonus({ p, value: p.bonus })}>Bonus</button>{" "}<button className="btn sm ok" onClick={() => update(p._id, { status: "Paid" }, "Marked as paid")}>Mark paid</button></>}
              </td>
            </tr>))}</tbody>
        </table>
        {list.length === 0 && <Empty text={admin ? "No payroll for this month yet. Click Generate payroll." : "No payslips yet"} />}
      </div>

      {slip && (
        <Modal onClose={() => setSlip(null)}>
          <div className="payslip">
            <div className="row between"><div><h2>HRM Pro</h2><span className="muted small">Salary slip - {monthLabel(slip.month)}</span></div><Badge>{slip.status}</Badge></div>
            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "14px 0" }} />
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div><span className="muted small">Employee</span><div><b>{slip.employee?.name || user.name}</b></div></div>
              <div><span className="muted small">Designation</span><div><b>{slip.employee?.designation || user.designation || "-"}</b></div></div>
              <div><span className="muted small">Department</span><div><b>{slip.employee?.department || user.department || "-"}</b></div></div>
              <div><span className="muted small">Paid on</span><div><b>{slip.paidOn ? fmtDate(slip.paidOn) : "Not paid yet"}</b></div></div>
            </div>
            <table style={{ marginTop: 14 }}>
              <tbody>
                <tr><td>Basic salary</td><td className="right">{money(slip.basic)}</td></tr>
                <tr><td>Bonus</td><td className="right">+ {money(slip.bonus)}</td></tr>
                <tr><td>Deduction <span className="muted small">({slip.deductibleDays} day x {money(slip.perDay)})</span></td><td className="right">- {money(slip.deduction)}</td></tr>
              </tbody>
            </table>
            <p className="muted small">Working days: {slip.workingDays} | Present: {slip.present} | Late: {slip.late} | Absent: {slip.absent} | Paid leave: {slip.leaveDays} | Unpaid leave: {slip.unpaidLeave}</p>
            <div className="net"><span>Net salary</span><span>{money(slip.net)}</span></div>
          </div>
          <div className="row noprint" style={{ justifyContent: "flex-end", marginTop: 14 }}>
            <button className="btn" onClick={() => setSlip(null)}>Close</button>
            <button className="btn primary" onClick={() => window.print()}><Icon name="printer" />Print</button>
          </div>
        </Modal>
      )}
      {bonus && (
        <Modal title={"Bonus - " + bonus.p.employee?.name} onClose={() => setBonus(null)}>
          <div className="field"><label>Bonus amount (Rs)</label><input type="number" min="0" value={bonus.value} onChange={(e) => setBonus({ ...bonus, value: e.target.value })} /></div>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={() => setBonus(null)}>Cancel</button><button className="btn primary" onClick={() => update(bonus.p._id, { bonus: Number(bonus.value) }, "Bonus saved")}>Save</button></div>
        </Modal>
      )}
    </>
  );
}
