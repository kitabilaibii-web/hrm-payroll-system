import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { Icon } from "../ui";

export default function Assistant({ user }) {
  const admin = user.role === "admin";
  const hints = admin
    ? ["Give me a summary of this month's attendance", "Which employees have the most late arrivals?", "Which department has the highest salary cost?", "Who has the most absences this month?"]
    : ["How many leaves do I have left?", "How many times was I late this month?", "Explain my latest payslip", "Why was money deducted from my salary?"];
  const [msgs, setMsgs] = useState([{ role: "ai", text: `Hi ${user.name.split(" ")[0]}! I am your HR assistant. Ask me about ${admin ? "company attendance, leave and salary data" : "your attendance, leave balance and salary"}.` }]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const ask = async (text) => {
    const question = (text || q).trim(); if (!question || busy) return;
    setMsgs((m) => [...m, { role: "me", text: question }]); setQ(""); setBusy(true);
    try { const r = await api("/ai/ask", { method: "POST", body: { question } }); setMsgs((m) => [...m, { role: "ai", text: r.answer }]); }
    catch (e) { setMsgs((m) => [...m, { role: "ai", text: e.message }]); }
    setBusy(false);
  };
  return (
    <div className="card" style={{ maxWidth: 820 }}>
      <h3>AI HR Assistant</h3>
      <div className="chat">
        {msgs.map((m, i) => <div key={i} className={"msg " + m.role}>{m.text}</div>)}
        {busy && <div className="msg ai muted">Thinking...</div>}
        <div ref={end} />
      </div>
      <div className="row wrap" style={{ margin: "12px 0" }}>{hints.map((h) => <button key={h} className="chip" onClick={() => ask(h)}>{h}</button>)}</div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question..." maxLength={500} />
        <button className="btn primary" disabled={busy}><Icon name="send" />Send</button>
      </form>
      <p className="muted small" style={{ marginBottom: 0 }}>Answers come only from your HR data. {admin ? "" : "You can only see your own information."}</p>
    </div>
  );
}
