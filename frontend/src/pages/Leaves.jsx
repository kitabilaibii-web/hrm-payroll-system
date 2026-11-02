import { useEffect, useState } from "react";
import { api } from "../api";
import { Badge, Empty, HBar, Icon, Modal, fmtDate, todayISO, useToast } from "../ui";

export default function Leaves({ user }) {
  const admin = user.role === "admin";
  const [list, setList] = useState([]);
  const [bal, setBal] = useState({});
  const [tab, setTab] = useState("");
  const [form, setForm] = useState(null);
  const [decide, setDecide] = useState(null);
  const [error, setError] = useState("");
  const toast = useToast();

  const load = () => {
    api("/leaves" + (tab ? "?status=" + tab : "")).then(setList).catch((e) => toast(e.message, "error"));
    api("/leaves/balance").then(setBal).catch(() => {});
  };
  useEffect(load, [tab]);

  const apply = async (e) => {
    e.preventDefault(); setError("");
    try { await api("/leaves", { method: "POST", body: form }); toast("Leave request submitted"); setForm(null); load(); }
    catch (err) { setError(err.message); }
  };
  const submitDecision = async () => {
    try { await api(`/leaves/${decide.leave._id}/status`, { method: "PUT", body: { status: decide.status, note: decide.note } }); toast("Leave " + decide.status.toLowerCase()); setDecide(null); load(); }
    catch (err) { toast(err.message, "error"); setDecide(null); }
  };
  const cancel = async (id) => { try { await api("/leaves/" + id, { method: "DELETE" }); toast("Request cancelled"); load(); } catch (e) { toast(e.message, "error"); } };

  return (
    <>
      <div className="grid g-2" style={{ marginBottom: 16 }}>
        <div className="card"><h3>My leave balance (this year)</h3>
          {Object.entries(bal).map(([t, b]) => <HBar key={t} label={t + " leave"} value={b.used} max={b.allowed} text={`${b.left} days left of ${b.allowed}`} />)}
          <p className="muted small" style={{ margin: 0 }}>Unpaid leave has no limit but is deducted from salary.</p></div>
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div><h3 style={{ marginBottom: 4 }}>Need a day off?</h3><span className="muted">Send a request and your manager will review it.</span></div>
          <button className="btn primary" onClick={() => { setError(""); setForm({ type: "Casual", from: todayISO(), to: todayISO(), reason: "" }); }}><Icon name="plus" />Apply for leave</button>
        </div>
      </div>
      <div className="toolbar"><div className="tabs">{["", "Pending", "Approved", "Rejected"].map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t || "All"}</button>)}</div></div>
      <div className="card tablewrap">
        <table>
          <thead><tr>{admin && <th>Employee</th>}<th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((l) => (
            <tr key={l._id}>
              {admin && <td><b>{l.employee?.name}</b><div className="muted small">{l.employee?.department}</div></td>}
              <td><Badge>{l.type}</Badge></td><td>{fmtDate(l.from)}</td><td>{fmtDate(l.to)}</td><td>{l.days}</td>
              <td style={{ maxWidth: 220 }}>{l.reason}{l.note && <div className="muted small">Note: {l.note}</div>}</td><td><Badge>{l.status}</Badge></td>
              <td className="right" style={{ whiteSpace: "nowrap" }}>
                {admin && l.status === "Pending" && <><button className="btn sm ok" onClick={() => setDecide({ leave: l, status: "Approved", note: "" })}>Approve</button>{" "}<button className="btn sm bad" onClick={() => setDecide({ leave: l, status: "Rejected", note: "" })}>Reject</button></>}
                {!admin && l.status === "Pending" && <button className="btn sm" onClick={() => cancel(l._id)}>Cancel</button>}
              </td>
            </tr>))}</tbody>
        </table>
        {list.length === 0 && <Empty text="No leave requests" />}
      </div>

      {form && (
        <Modal title="Apply for leave" onClose={() => setForm(null)}>
          <form onSubmit={apply}>
            {error && <div className="err">{error}</div>}
            <div className="field"><label>Leave type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Casual</option><option>Sick</option><option>Unpaid</option></select></div>
            <div className="form2">
              <div className="field"><label>From</label><input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value, to: form.to < e.target.value ? e.target.value : form.to })} /></div>
              <div className="field"><label>To</label><input type="date" min={form.from} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
            </div>
            <div className="field"><label>Reason</label><textarea rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="row" style={{ justifyContent: "flex-end" }}><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary">Submit request</button></div>
          </form>
        </Modal>
      )}
      {decide && (
        <Modal title={`${decide.status === "Approved" ? "Approve" : "Reject"} leave`} onClose={() => setDecide(null)}>
          <p><b>{decide.leave.employee?.name}</b> - {decide.leave.type}, {fmtDate(decide.leave.from)} to {fmtDate(decide.leave.to)} ({decide.leave.days} day/s)</p>
          <div className="field"><label>Note (optional)</label><textarea rows="2" value={decide.note} onChange={(e) => setDecide({ ...decide, note: e.target.value })} /></div>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={() => setDecide(null)}>Cancel</button><button className={"btn " + (decide.status === "Approved" ? "ok" : "bad")} onClick={submitDecision}>Confirm</button></div>
        </Modal>
      )}
    </>
  );
}
