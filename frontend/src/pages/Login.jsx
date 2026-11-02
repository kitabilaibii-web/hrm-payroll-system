import { useState } from "react";
import { api } from "../api";
import { Icon } from "../ui";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e, creds) => {
    e && e.preventDefault();
    const body = creds || { email, password };
    setBusy(true); setError("");
    try { const r = await api("/auth/login", { method: "POST", body }); onLogin(r.user, r.token); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  const demo = (em, pw) => { setEmail(em); setPassword(pw); submit(null, { email: em, password: pw }); };

  return (
    <div className="login">
      <div className="left">
        <div className="brand" style={{ padding: 0 }}><i>H</i> HRM Pro</div>
        <h1>Complete HR and Payroll System</h1>
        <p style={{ opacity: 0.9, fontSize: 16 }}>Manage employees, attendance, leave and salary in one secure place.</p>
        <ul style={{ padding: 0, margin: 0 }}>
          {["Employee records with roles and departments", "One-click check-in and automatic late detection", "Leave requests with balance and approval", "Automatic payroll with printable payslips", "Live dashboard with charts and AI assistant"].map((t) => (
            <li key={t}><Icon name="check" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="right">
        <form onSubmit={submit}>
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>Welcome back</h2>
          <p className="muted" style={{ marginTop: 0 }}>Sign in to your account</p>
          {error && <div className="err">{error}</div>}
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required /></div>
          <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          <p className="muted small" style={{ margin: "18px 0 0" }}>Try the demo:</p>
          <div className="demo">
            <button type="button" className="btn" onClick={() => demo("admin@hrm.com", "admin123")}>Login as Admin</button>
            <button type="button" className="btn" onClick={() => demo("ayesha@hrm.com", "employee123")}>Login as Employee</button>
          </div>
        </form>
      </div>
    </div>
  );
}
