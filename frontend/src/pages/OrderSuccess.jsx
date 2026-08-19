import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, rupee } from "../api";
import { useStore } from "../context";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { refreshUser } = useStore();

  useEffect(() => {
    api.get(`/orders/${id}/`).then(setOrder).catch(() => {});
    refreshUser();   // pick up newly earned loyalty points
  }, [id]); // eslint-disable-line

  if (!order) return <main className="container"><div className="empty">Loading…</div></main>;

  return (
    <main className="container">
      <div className="card success-card">
        <div className="success-emoji">🎉</div>
        <h1>Order placed successfully!</h1>
        <p>Thanks {order.customer_name}! Your fresh veggies are on the way.</p>
        <div className="success-details">
          <div><span>Order number</span><b>#{order.id}</b></div>
          <div><span>Delivery slot</span><b>{order.delivery_slot}</b></div>
          <div><span>Payment</span><b>{order.payment_method} · {order.payment_status}</b></div>
          <div><span>Total</span><b>{rupee(order.total)}</b></div>
          {order.points_earned > 0 && (
            <div><span>Loyalty points earned</span><b>+{order.points_earned} pts 🎁</b></div>
          )}
        </div>
        <div className="success-actions">
          <Link to="/my-orders" className="btn">Track order</Link>
          <Link to={`/invoice/${order.id}`} className="btn btn-ghost">🧾 Invoice</Link>
          <Link to="/" className="btn btn-ghost">Continue shopping</Link>
        </div>
      </div>
    </main>
  );
}
