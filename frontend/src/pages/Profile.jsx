import { useState } from "react";
import { api } from "../api";
import { Avatar, Badge, fmtDate, money, useToast } from "../ui";

export default function Profile({ user }) {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [error, setError] = useState("");
  const toast = useToast();
  const change = async (e) => {
    e.preventDefault(); setError("");
    if (f.next !== f.again) return setError("New passwords do not match");
    try { await api("/auth/password", { method: "PUT", body: { current: f.current, next: f.next } }); toast("Password changed"); setF({ current: "", next: "", again: "" }); }
    catch (err) { setError(err.message); }
  };
  const rows = [["Email", user.email], ["Phone", user.phone || "-"], ["Department", user.department || "-"], ["Designation", user.designation || "-"], ["Monthly salary", money(user.salary)], ["Joined", fmtDate(user.joiningDate)]];
  return (
    <div className="grid g-2" style={{ alignItems: "start" }}>
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}><Avatar name={user.name} size={60} /><div><h2>{user.name}</h2><Badge>{user.role}</Badge></div></div>
        {rows.map(([k, v]) => <div className="ann row between" key={k}><span className="muted">{k}</span><b>{v}</b></div>)}
      </div>
      <form className="card" onSubmit={change}>
        <h3>Change password</h3>
        {error && <div className="err">{error}</div>}
        <div className="field"><label>Current password</label><input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></div>
        <div className="field"><label>New password</label><input type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} minLength={6} required /></div>
        <div className="field"><label>Repeat new password</label><input type="password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} required /></div>
        <button className="btn primary">Update password</button>
      </form>
    </div>
  );
}
