import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../../context";

const LINKS = [
  ["/admin", "📊 Dashboard", true],
  ["/admin/vegetables", "🥕 Vegetables"],
  ["/admin/orders", "📦 Orders"],
  ["/admin/coupons", "🎟️ Coupons"],
  ["/admin/feedback", "📮 Feedback"],
  ["/admin/users", "👥 Customers"],
  ["/admin/settings", "⚙️ Banner"],
];

export default function AdminLayout() {
  const { user, logoutUser } = useStore();
  const nav = useNavigate();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand"><span className="brand-leaf">🥬</span>Fresh<em>Kart</em></Link>
        <small className="muted">Admin panel</small>
        <nav>
          {LINKS.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={!!end}
                     className={({ isActive }) => isActive ? "on" : ""}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/">← View store</Link>
          <button className="link-btn" onClick={() => { logoutUser(); nav("/"); }}>
            Logout ({user?.name})
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
