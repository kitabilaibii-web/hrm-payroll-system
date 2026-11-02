import { useEffect, useState } from "react";
import { api } from "../api";
import { Badge, Empty, Icon, fmtDate, useToast } from "../ui";

export default function Announcements({ user }) {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ title: "", message: "", priority: "Normal" });
  const toast = useToast();
  const load = () => api("/announcements").then(setList).catch((e) => toast(e.message, "error"));
  useEffect(() => { load(); }, []);
  const post = async (e) => {
    e.preventDefault();
    try { await api("/announcements", { method: "POST", body: f }); toast("Announcement posted"); setF({ title: "", message: "", priority: "Normal" }); load(); }
    catch (err) { toast(err.message, "error"); }
  };
  const remove = async (id) => { try { await api("/announcements/" + id, { method: "DELETE" }); toast("Deleted"); load(); } catch (e) { toast(e.message, "error"); } };
  return (
    <div className="grid g-2" style={{ alignItems: "start" }}>
      {user.role === "admin" && (
        <form className="card" onSubmit={post}>
          <h3>Post an announcement</h3>
          <div className="field"><label>Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
          <div className="field"><label>Message</label><textarea rows="4" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required /></div>
          <div className="field"><label>Priority</label><select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option>Normal</option><option>Important</option></select></div>
          <button className="btn primary"><Icon name="megaphone" />Post</button>
        </form>
      )}
      <div className="card">
        <h3>Company announcements</h3>
        {list.length === 0 && <Empty text="No announcements yet" />}
        {list.map((a) => (
          <div className="ann" key={a._id}>
            <div className="row between"><b>{a.title}</b><span className="row"><Badge>{a.priority}</Badge>{user.role === "admin" && <button className="btn sm" onClick={() => remove(a._id)}><Icon name="trash" /></button>}</span></div>
            <div>{a.message}</div><div className="muted small">{a.author?.name || "Admin"} - {fmtDate(a.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
