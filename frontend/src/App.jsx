import { useEffect, useState } from "react";
import { api } from "./api";
import { Avatar, Icon, ToastProvider } from "./ui";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Attendance from "./pages/Attendance.jsx";
import Leaves from "./pages/Leaves.jsx";
import Payroll from "./pages/Payroll.jsx";
import Announcements from "./pages/Announcements.jsx";
import Assistant from "./pages/Assistant.jsx";
import Profile from "./pages/Profile.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "employees", label: "Employees", icon: "users", admin: true },
  { id: "attendance", label: "Attendance", icon: "clock" },
  { id: "leaves", label: "Leaves", icon: "calendar" },
  { id: "payroll", label: "Payroll", icon: "wallet" },
  { id: "announcements", label: "Announcements", icon: "megaphone" },
  { id: "assistant", label: "Ask AI", icon: "sparkles" },
  { id: "profile", label: "My Profile", icon: "user" },
];

function getTheme() {
  try { const t = localStorage.getItem("theme"); if (t) return t; } catch (e) {}
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(location.hash.slice(1) || "dashboard");
  const [theme, setTheme] = useState(getTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }, [theme]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { setLoading(false); return; }
    api("/auth/me").then(setUser).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);

  const go = (id) => { setPage(id); location.hash = id; setOpen(false); window.scrollTo(0, 0); };
  const logout = () => { localStorage.removeItem("token"); setUser(null); location.hash = ""; setPage("dashboard"); };

  if (loading) return <div className="empty" style={{ paddingTop: 120 }}>Loading...</div>;
  if (!user) return <ToastProvider><Login onLogin={(u, t) => { localStorage.setItem("token", t); setUser(u); }} /></ToastProvider>;

  const admin = user.role === "admin";
  const items = NAV.filter((n) => !n.admin || admin);
  const current = items.find((n) => n.id === page) || items[0];
  const props = { user, go };
  const view = {
    dashboard: <Dashboard {...props} />, employees: <Employees {...props} />, attendance: <Attendance {...props} />,
    leaves: <Leaves {...props} />, payroll: <Payroll {...props} />, announcements: <Announcements {...props} />,
    assistant: <Assistant {...props} />, profile: <Profile {...props} />,
  }[current.id];

  return (
    <ToastProvider>
      <div className="app">
        <aside className={"side" + (open ? " open" : "")}>
          <div className="brand"><i>H</i> HRM Pro</div>
          <nav className="nav">
            {items.map((n) => (
              <button key={n.id} className={current.id === n.id ? "on" : ""} onClick={() => go(n.id)}><Icon name={n.icon} />{n.label}</button>
            ))}
          </nav>
          <div className="me">
            <div className="row" style={{ marginBottom: 10 }}>
              <Avatar name={user.name} />
              <div style={{ minWidth: 0 }}><div style={{ color: "#fff", fontWeight: 600 }}>{user.name}</div><div className="small" style={{ textTransform: "capitalize" }}>{user.role}</div></div>
            </div>
            <div className="nav"><button onClick={logout}><Icon name="logout" />Logout</button></div>
          </div>
        </aside>
        <div className={"scrim" + (open ? " on" : "")} onClick={() => setOpen(false)} />
        <div className="main">
          <header className="top">
            <button className="iconbtn burger" onClick={() => setOpen(true)}><Icon name="menu" /></button>
            <h1 className="grow">{current.label}</h1>
            <button className="iconbtn" title="Toggle dark mode" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
          </header>
          <main className="content" key={current.id}>{view}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
