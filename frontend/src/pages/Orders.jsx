import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, rupee } from "../api";
import { useStore } from "../context";

const STEPS = ["Order Received", "Packed", "Out for Delivery", "Delivered"];

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const { setCartCount, showToast } = useStore();
  const nav = useNavigate();

  const load = () => api.get("/orders/").then(setOrders).catch(() => setOrders([]));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm(`Cancel order #${id}? Stock and points will be reverted.`)) return;
    try {
      await api.post(`/orders/${id}/cancel/`, {});
      showToast(`Order #${id} cancelled.`);
      load();
    } catch (e) { showToast(e.message, "warn"); }
  };

  const reorder = async (id) => {
    try {
      const d = await api.post(`/orders/${id}/reorder/`, {});
      setCartCount(d.count);
      showToast(d.message);
      nav("/cart");
    } catch (e) { showToast(e.message, "warn"); }
  };

  if (!orders) return <main className="container"><div className="empty">Loading…</div></main>;
  if (orders.length === 0) {
    return <main className="container">
      <div className="empty big">📦 No orders yet.<br />
        <Link to="/" className="btn" style={{ marginTop: 16 }}>Start shopping</Link></div>
    </main>;
  }

  return (
    <main className="container">
      <h1 className="page-title">📦 My orders</h1>
      {orders.map((o) => (
        <div key={o.id} className="card order-card">
          <div className="order-head">
            <div>
              <b>Order #{o.id}</b>
              <small> · {new Date(o.created_at).toLocaleString()}</small>
            </div>
            <div className="order-head-right">
              <span className={`status status-${o.step}`}>{o.status}</span>
              <b>{rupee(o.total)}</b>
            </div>
          </div>

          {o.status === "Cancelled" ? (
            <div className="cancelled-note">❌ This order was cancelled.
              {o.payment_status === "Refunded" && " Payment refunded."}</div>
          ) : (
            <div className="timeline">
              {STEPS.map((s, i) => (
                <div key={s} className={`tl-step ${i <= o.step ? "done" : ""}`}>
                  <div className="tl-dot">{i <= o.step ? "✓" : i + 1}</div>
                  <small>{s}</small>
                </div>
              ))}
            </div>
          )}

          <div className="order-items">
            {o.items.map((it) => (
              <span key={it.id} className="order-item-pill">
                {it.veg_name} ({it.weight_label}) × {it.quantity}
              </span>
            ))}
          </div>

          <div className="order-meta">
            <small>🏠 {o.address}{o.city && `, ${o.city}`} · 🕐 {o.delivery_slot} ·
              💳 {o.payment_method} ({o.payment_status})</small>
          </div>

          <div className="order-actions">
            <button className="btn btn-sm" onClick={() => reorder(o.id)}>🔁 Reorder</button>
            <Link to={`/invoice/${o.id}`} className="btn btn-sm btn-ghost">🧾 Invoice</Link>
            {!["Out for Delivery", "Delivered", "Cancelled"].includes(o.status) && (
              <button className="btn btn-sm btn-danger" onClick={() => cancel(o.id)}>
                ✕ Cancel order
              </button>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
