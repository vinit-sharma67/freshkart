import React, { useEffect, useState } from "react";
import { api, rupee } from "../../api";
import { useStore } from "../../context";

const STATUSES = ["Order Received", "Packed", "Out for Delivery", "Delivered"];
const FILTERS = ["", ...STATUSES, "Cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(null);
  const { showToast, config } = useStore();

  const load = (f = filter) =>
    api.get(`/admin/orders/${f ? `?status=${encodeURIComponent(f)}` : ""}`)
      .then(setOrders).catch(() => setOrders([]));

  useEffect(() => { load(filter); }, [filter]); // eslint-disable-line

  const setStatus = async (id, status) => {
    try {
      await api.post(`/admin/orders/${id}/status/`, { status });
      showToast(`Order #${id} → ${status}`);
      load();
    } catch (e) { showToast(e.message, "warn"); }
  };

  if (!orders) return <div className="empty">Loading…</div>;

  return (
    <>
      <h1 className="page-title">📦 Orders</h1>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f || "all"} className={`chip ${filter === f ? "on" : ""}`}
                  onClick={() => setFilter(f)}>
            {f || "All"}
          </button>
        ))}
      </div>

      {orders.length === 0 && <div className="empty">No orders found.</div>}
      {orders.map((o) => (
        <div key={o.id} className="card order-card">
          <div className="order-head">
            <div>
              <b>#{o.id} · {o.customer_name}</b>
              <small> · 📱 {o.mobile} · {new Date(o.created_at).toLocaleString()}</small>
            </div>
            <div className="order-head-right">
              <b>{rupee(o.total)}</b>
              {o.status === "Cancelled" ? (
                <span className="status status--1">Cancelled</span>
              ) : (
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              )}
              <button className="link-btn" onClick={() => setOpen(open === o.id ? null : o.id)}>
                {open === o.id ? "Hide ▲" : "Details ▼"}
              </button>
            </div>
          </div>
          {open === o.id && (
            <div className="order-detail">
              <p>🏠 {o.address}{o.city && `, ${o.city}`}{o.pincode && ` — ${o.pincode}`}<br />
                🕐 {o.delivery_slot} · 💳 {o.payment_method} ({o.payment_status})
                {o.order_notes && <><br />📝 {o.order_notes}</>}</p>
              <table className="admin-table">
                <thead><tr><th>Item</th><th>Weight</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {o.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.veg_name}</td><td>{it.weight_label}</td>
                      <td>{it.quantity}</td><td>{rupee(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p><small>Subtotal {rupee(o.subtotal)}
                {Number(o.discount) > 0 && <> · Coupon −{rupee(o.discount)} ({o.coupon_code})</>}
                {o.points_redeemed > 0 && <> · Points −{rupee(o.points_redeemed)}</>}
                {" "}· Delivery {Number(o.delivery_charge) === 0 ? "FREE" : rupee(o.delivery_charge)}
                {" "}· <b>Total {rupee(o.total)}</b></small></p>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
