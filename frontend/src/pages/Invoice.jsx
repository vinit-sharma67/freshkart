import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, rupee } from "../api";

export default function Invoice() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}/`).then(setOrder).catch(() => {});
  }, [id]);

  if (!order) return <main className="container"><div className="empty">Loading…</div></main>;

  return (
    <main className="invoice-page">
      <div className="invoice-toolbar no-print">
        <Link to="/my-orders" className="btn btn-ghost">← Back to orders</Link>
        <button className="btn" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
      </div>

      <div className="invoice card">
        <div className="invoice-head">
          <div>
            <div className="brand"><span className="brand-leaf">🥬</span>Fresh<em>Kart</em></div>
            <small>Farm-fresh vegetables, delivered.</small>
          </div>
          <div className="invoice-meta">
            <h2>INVOICE</h2>
            <div>Order <b>#{order.id}</b></div>
            <div>{new Date(order.created_at).toLocaleDateString("en-IN",
              { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>

        <div className="invoice-addr">
          <div>
            <h4>Billed to</h4>
            <b>{order.customer_name}</b><br />
            {order.address}{order.city && <>, {order.city}</>}
            {order.pincode && <> — {order.pincode}</>}<br />
            📱 {order.mobile}
          </div>
          <div>
            <h4>Details</h4>
            Delivery slot: {order.delivery_slot}<br />
            Payment: {order.payment_method}<br />
            Status: {order.payment_status}
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr><th>Item</th><th>Weight</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>{it.veg_name}</td>
                <td>{it.weight_label}</td>
                <td>{it.quantity}</td>
                <td>{rupee(it.price)}</td>
                <td>{rupee(it.price * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={4}>Subtotal</td><td>{rupee(order.subtotal)}</td></tr>
            {Number(order.discount) > 0 && (
              <tr><td colSpan={4}>Coupon {order.coupon_code}</td><td>−{rupee(order.discount)}</td></tr>
            )}
            {order.points_redeemed > 0 && (
              <tr><td colSpan={4}>Loyalty points</td><td>−{rupee(order.points_redeemed)}</td></tr>
            )}
            <tr><td colSpan={4}>Delivery</td>
              <td>{Number(order.delivery_charge) === 0 ? "FREE" : rupee(order.delivery_charge)}</td></tr>
            <tr className="grand"><td colSpan={4}>Grand total</td><td>{rupee(order.total)}</td></tr>
          </tfoot>
        </table>

        <div className="invoice-foot">Thank you for shopping with FreshKart! 🌱</div>
      </div>
    </main>
  );
}
