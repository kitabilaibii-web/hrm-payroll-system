import { useEffect, useState } from "react";
import { api } from "../api";
import { Avatar, Badge, Empty, Icon, Modal, downloadCSV, fmtDate, money, useToast } from "../ui";

const DEPTS = ["IT", "HR", "Sales", "Finance", "Marketing", "Operations"];
const blank = { name: "", email: "", phone: "", department: "IT", designation: "", salary: "", joiningDate: new Date().toISOString().slice(0, 10), status: "Active", role: "employee", password: "" };

export default function Employees({ user }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () => {
    const p = new URLSearchParams({ ...(q && { q }), ...(dept && { department: dept }), ...(status && { status }) });
    api("/employees?" + p).then(setList).catch((e) => toast(e.message, "error"));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, dept, status]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
    if (form.phone && !/^\d{10,15}$/.test(form.phone)) return "Phone must be 10-15 digits";
    if (form.salary === "" || Number(form.salary) < 0) return "Enter a valid salary";
    if (form.password && form.password.length < 6) return "Password must be at least 6 characters";
    return "";
  };
  const save = async (e) => {
    e.preventDefault();
    const v = validate(); if (v) return setError(v);
    setBusy(true); setError("");
    try {
      const body = { ...form, salary: Number(form.salary) };
      if (form._id) await api("/employees/" + form._id, { method: "PUT", body });
      else await api("/employees", { method: "POST", body });
      toast(form._id ? "Employee updated" : "Employee added");
      setForm(null); load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  };
  const remove = async () => {
    try { await api("/employees/" + del._id, { method: "DELETE" }); toast("Employee deleted"); setDel(null); load(); }
    catch (err) { toast(err.message, "error"); setDel(null); }
  };
  const exportCSV = () => downloadCSV("employees.csv", [["Name", "Email", "Phone", "Department", "Designation", "Salary", "Joined", "Status", "Role"],
    ...list.map((e) => [e.name, e.email, e.phone, e.department, e.designation, e.salary, e.joiningDate?.slice(0, 10), e.status, e.role])]);

  return (
    <>
      <div className="toolbar">
        <div className="searchbox"><Icon name="search" /><input placeholder="Search name, email, designation" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All status</option><option>Active</option><option>Inactive</option></select>
        <span className="grow" />
        <button className="btn" onClick={exportCSV}><Icon name="download" />Export CSV</button>
        <button className="btn primary" onClick={() => { setError(""); setForm(blank); }}><Icon name="plus" />Add employee</button>
      </div>
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Salary</th><th>Joined</th><th>Status</th><th>Role</th><th /></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e._id}>
                <td><div className="row"><Avatar name={e.name} /><div><b>{e.name}</b><div className="muted small">{e.email}</div></div></div></td>
                <td>{e.department || "-"}</td><td>{e.designation || "-"}</td><td>{money(e.salary)}</td><td>{fmtDate(e.joiningDate)}</td>
                <td><Badge>{e.status}</Badge></td><td><Badge>{e.role}</Badge></td>
                <td className="right" style={{ whiteSpace: "nowrap" }}>
                  <button className="btn sm" onClick={() => { setError(""); setForm({ ...blank, ...e, joiningDate: e.joiningDate?.slice(0, 10), phone: e.phone || "", designation: e.designation || "", department: e.department || "IT", password: "" }); }}><Icon name="edit" /></button>{" "}
                  {e._id !== user._id && <button className="btn sm" onClick={() => setDel(e)}><Icon name="trash" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty text="No employees found" />}
      </div>

      {form && (
        <Modal title={form._id ? "Edit employee" : "Add employee"} wide onClose={() => setForm(null)}>
          <form onSubmit={save}>
            {error && <div className="err">{error}</div>}
            <div className="form2">
              <div className="field"><label>Full name *</label><input value={form.name} onChange={set("name")} /></div>
              <div className="field"><label>Email *</label><input value={form.email} onChange={set("email")} /></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={set("phone")} placeholder="03001234567" /></div>
              <div className="field"><label>Designation</label><input value={form.designation} onChange={set("designation")} /></div>
              <div className="field"><label>Department</label><select value={form.department} onChange={set("department")}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div className="field"><label>Monthly salary (Rs) *</label><input type="number" min="0" value={form.salary} onChange={set("salary")} /></div>
              <div className="field"><label>Joining date</label><input type="date" value={form.joiningDate} onChange={set("joiningDate")} /></div>
              <div className="field"><label>Status</label><select value={form.status} onChange={set("status")}><option>Active</option><option>Inactive</option></select></div>
              <div className="field"><label>Role</label><select value={form.role} onChange={set("role")}><option value="employee">Employee</option><option value="admin">Admin</option></select></div>
              <div className="field"><label>{form._id ? "New password (optional)" : "Login password"}</label><input type="password" value={form.password} onChange={set("password")} placeholder={form._id ? "Leave empty to keep" : "Default: employee123"} /></div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
      {del && (
        <Modal title="Delete employee?" onClose={() => setDel(null)}>
          <p>This will permanently delete <b>{del.name}</b> and all of their attendance, leave and payroll records.</p>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={() => setDel(null)}>Cancel</button><button className="btn bad" onClick={remove}>Delete</button></div>
        </Modal>
      )}
    </>
  );
}
