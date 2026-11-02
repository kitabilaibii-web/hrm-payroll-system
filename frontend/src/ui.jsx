import { createContext, useCallback, useContext, useState } from "react";

export const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-US");
export const fmtDate = (s) => (s ? new Date(s.length === 10 ? s + "T00:00:00" : s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-");
export const fmtTime = (s) => (s ? new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-");
export const monthLabel = (m) => { const [y, mm] = m.split("-"); return new Date(y, mm - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); };
export const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export function downloadCSV(name, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

const PATHS = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  calendar: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  wallet: "M3 7a2 2 0 0 1 2-2h14v4 M3 7v12a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2z M16 15h2",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h3l8 5V5L7 10H4a1 1 0 0 0-1 1z M19 8a5 5 0 0 1 0 8",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  plus: "M12 5v14 M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  printer: "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
};
export const Icon = ({ name }) => (
  <svg className="icon" viewBox="0 0 24 24">{PATHS[name].split(" M").map((d, i) => <path key={i} d={(i ? "M" : "") + d} />)}</svg>
);

const COLORS = ["#4f46e5", "#0ea5a4", "#f59e0b", "#e11d48", "#7c3aed", "#0284c7", "#16a34a", "#db2777"];
export const Avatar = ({ name = "?", size = 36 }) => {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;
  const ini = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="av" style={{ background: COLORS[i], width: size, height: size, fontSize: size * 0.36 }}>{ini}</div>;
};

const BADGE = { Active: "green", Inactive: "grey", Present: "green", Late: "amber", Absent: "red", Leave: "blue", Pending: "amber", Approved: "green", Rejected: "red", Paid: "green", Generated: "amber", Important: "red", Normal: "grey", admin: "purple", employee: "blue", Casual: "blue", Sick: "purple", Unpaid: "grey" };
export const Badge = ({ children }) => <span className={"badge b-" + (BADGE[children] || "grey")}>{children}</span>;

export const Modal = ({ title, onClose, wide, children }) => (
  <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={"modal" + (wide ? " wide" : "")}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  </div>
);

export const Stat = ({ icon, color, label, value, sub }) => (
  <div className="card stat">
    <div className="ic" style={{ background: color }}><Icon name={icon} /></div>
    <div><span className="muted small">{label}</span><b>{value}</b>{sub && <span className="muted small">{sub}</span>}</div>
  </div>
);

export function Donut({ data, center }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="donutwrap">
      <svg width="150" height="150" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--soft)" strokeWidth="18" />
        {total > 0 && data.map((d) => {
          const len = (d.value / total) * C; const el = (
            <circle key={d.label} cx="70" cy="70" r={R} fill="none" stroke={d.color} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />); acc += len; return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)">{center}</text>
        <text x="70" y="86" textAnchor="middle" fontSize="10" fill="var(--muted)">employees</text>
      </svg>
      <div className="legend">{data.map((d) => <span key={d.label}><i style={{ background: d.color }} />{d.label}: <b>{d.value}</b></span>)}</div>
    </div>
  );
}

export function Bars({ data, format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.length === 0 && <div className="empty grow">No data yet</div>}
      {data.map((d) => (
        <div className="bar" key={d.label}><em>{format(d.value)}</em><div style={{ height: (d.value / max) * 100 + "%" }} /><small>{d.label}</small></div>
      ))}
    </div>
  );
}

export const HBar = ({ label, value, max, text }) => (
  <div className="hbar"><div className="t"><span>{label}</span><b>{text ?? value}</b></div><div className="track"><div style={{ width: Math.min(100, (value / (max || 1)) * 100) + "%" }} /></div></div>
);

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((text, type = "ok") => {
    const id = Math.random();
    setList((l) => [...l, { id, text, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">{list.map((t) => <div key={t.id} className={"toast " + (t.type === "error" ? "error" : "")}>{t.text}</div>)}</div>
    </ToastCtx.Provider>
  );
}
export const Empty = ({ text = "Nothing to show" }) => <div className="empty">{text}</div>;
