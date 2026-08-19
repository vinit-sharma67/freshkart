import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useStore } from "../../context";

const FILTERS = ["", "Open", "Resolved"];
const TYPES = ["", "Complaint", "Feedback", "Suggestion"];

export default function FeedbackAdmin() {
  const [tickets, setTickets] = useState(null);
  const [status, setStatus] = useState("Open");
  const [ftype, setFtype] = useState("");
  const [reply, setReply] = useState({});   // id -> draft text
  const { showToast } = useStore();

  const load = (s = status, t = ftype) => {
    const qs = new URLSearchParams();
    if (s) qs.set("status", s);
    if (t) qs.set("type", t);
    api.get(`/admin/feedback/?${qs}`).then(setTickets).catch(() => setTickets([]));
  };
  useEffect(() => { load(status, ftype); }, [status, ftype]); // eslint-disable-line

  const sendReply = async (id) => {
    const text = (reply[id] || "").trim();
    if (!text) { showToast("Write a reply first.", "warn"); return; }
    await api.post(`/admin/feedback/${id}/`, { reply: text, resolve: true });
    setReply({ ...reply, [id]: "" });
    showToast("Reply sent & ticket resolved ✅");
    load();
  };

  const toggle = async (id) => {
    await api.post(`/admin/feedback/${id}/`, { toggle_status: true });
    load();
  };

  if (!tickets) return <div className="empty">Loading…</div>;

  return (
    <>
      <h1 className="page-title">📮 Feedback & complaints</h1>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f || "all"} className={`chip ${status === f ? "on" : ""}`}
                  onClick={() => setStatus(f)}>{f || "All"}</button>
        ))}
        <span style={{ width: 14 }} />
        {TYPES.map((t) => (
          <button key={t || "all-t"} className={`chip ${ftype === t ? "on" : ""}`}
                  onClick={() => setFtype(t)}>{t || "All types"}</button>
        ))}
      </div>

      {tickets.length === 0 && <div className="empty">No tickets here. 🎉</div>}
      {tickets.map((t) => (
        <div key={t.id} className="card ticket">
          <div className="ticket-head">
            <span className={`status ${t.status === "Resolved" ? "status-3" : "status-1"}`}>
              {t.status}
            </span>
            <b>{t.ftype}: {t.subject}</b>
            <small>
              {t.user_name} · 📱 {t.user_mobile} · {new Date(t.created_at).toLocaleString()}
              {t.order_id && <> · Order #{t.order_id}</>}
            </small>
          </div>
          <p>{t.message}</p>
          {t.admin_reply && (
            <div className="ticket-reply"><b>Your reply:</b> {t.admin_reply}</div>
          )}
          <div className="ticket-actions">
            <input placeholder="Write a reply…" value={reply[t.id] || ""}
                   onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })} />
            <button className="btn btn-sm" onClick={() => sendReply(t.id)}>
              Reply & resolve
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => toggle(t.id)}>
              {t.status === "Open" ? "Mark resolved" : "Reopen"}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
