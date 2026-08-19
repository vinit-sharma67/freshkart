import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useStore } from "../context";

const TYPES = [
  ["Complaint", "😔", "Something went wrong with an order or product"],
  ["Feedback", "💬", "Tell us about your experience"],
  ["Suggestion", "💡", "An idea to make FreshKart better"],
];

export default function Help() {
  const { showToast } = useStore();
  const [tickets, setTickets] = useState(null);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ ftype: "Complaint", subject: "", message: "", order_id: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/feedback/").then(setTickets).catch(() => setTickets([]));
    api.get("/orders/").then(setOrders).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post("/feedback/", form);
      setTickets(d);
      setForm({ ftype: form.ftype, subject: "", message: "", order_id: "" });
      showToast("Submitted! Our team will reply here soon. 🙏");
    } catch (err) {
      showToast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container">
      <h1 className="page-title">🙋 Help & Feedback</h1>
      <div className="help-layout">
        <form className="card pad" onSubmit={submit}>
          <h3>Raise a ticket</h3>
          <div className="ftype-row">
            {TYPES.map(([t, icon, hint]) => (
              <label key={t} className={`pay-option ${form.ftype === t ? "on" : ""}`}>
                <input type="radio" name="ftype" checked={form.ftype === t}
                       onChange={() => setForm({ ...form, ftype: t })} />
                <span className="pay-icon">{icon}</span>
                <span className="pay-label">{t}<small>{hint}</small></span>
              </label>
            ))}
          </div>
          <label>Subject *
            <input value={form.subject} maxLength={120} required
                   placeholder="e.g. Tomatoes arrived damaged"
                   onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </label>
          <label>Details *
            <textarea value={form.message} rows={4} required
                      placeholder="Tell us what happened…"
                      onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
          {orders.length > 0 && (
            <label>Related order (optional)
              <select value={form.order_id}
                      onChange={(e) => setForm({ ...form, order_id: e.target.value })}>
                <option value="">— none —</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} · {new Date(o.created_at).toLocaleDateString()} · ₹{Math.round(o.total)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit"}</button>
        </form>

        <div>
          <h3 className="section-title" style={{ marginTop: 0 }}>My tickets</h3>
          {!tickets ? <div className="empty">Loading…</div>
            : tickets.length === 0 ? (
              <div className="empty">No tickets yet — we hope everything's perfect! 🌱</div>
            ) : tickets.map((t) => (
              <div key={t.id} className="card ticket">
                <div className="ticket-head">
                  <span className={`status ${t.status === "Resolved" ? "status-3" : "status-1"}`}>
                    {t.status}
                  </span>
                  <b>{t.ftype}: {t.subject}</b>
                  <small>{new Date(t.created_at).toLocaleDateString()}
                    {t.order_id && <> · Order #{t.order_id}</>}</small>
                </div>
                <p>{t.message}</p>
                {t.admin_reply ? (
                  <div className="ticket-reply">
                    <b>🥬 FreshKart team:</b> {t.admin_reply}
                  </div>
                ) : (
                  <small className="muted">Waiting for our team's reply…</small>
                )}
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
