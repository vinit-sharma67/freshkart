import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, rupee } from "../../api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/stats/").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="empty">Loading…</div>;
  const s = data.stats;

  const tiles = [
    ["💰", "Revenue", rupee(s.revenue)],
    ["📦", "Total orders", s.orders],
    ["📅", "Today's orders", s.today_orders],
    ["⏳", "Pending orders", s.pending],
    ["🥕", "Active vegetables", s.vegetables],
    ["👥", "Customers", s.users],
    ["📮", "Open tickets", s.open_tickets],
  ];

  return (
    <>
      <h1 className="page-title">📊 Dashboard</h1>
      <div className="stat-grid">
        {tiles.map(([emoji, label, val]) => (
          <div key={label} className="card stat">
            <span className="stat-emoji">{emoji}</span>
            <b>{val}</b>
            <small>{label}</small>
          </div>
        ))}
      </div>

      <div className="admin-2col">
        <div className="card pad">
          <h3>⚠️ Low stock (below {data.low_kg} kg)</h3>
          {data.low_stock.length === 0 && <p className="muted">All good — nothing running low.</p>}
          {data.low_stock.map((v) => (
            <div key={v.id} className="row-line">
              <span>{v.name}</span>
              <b className="warn-text">{Number(v.stock_kg)} kg</b>
              <Link to={`/admin/vegetables/${v.id}`} className="btn btn-sm btn-ghost">Restock</Link>
            </div>
          ))}
        </div>

        <div className="card pad">
          <h3>🕐 Recent orders</h3>
          {data.recent.map((o) => (
            <div key={o.id} className="row-line">
              <span>#{o.id} · {o.customer_name}</span>
              <span className={`status status-${o.step}`}>{o.status}</span>
              <b>{rupee(o.total)}</b>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
