import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context";

export default function Navbar() {
  const { user, logoutUser, cartCount, showToast } = useStore();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();

  const search = (e) => {
    e.preventDefault();
    nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  };

  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link to="/" className="brand">
          <span className="brand-leaf">🥬</span>Fresh<em>Kart</em>
        </Link>

        <form className="nav-search" onSubmit={search}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fresh veggies… try 'palak'"
          />
          <button type="submit" aria-label="Search">🔍</button>
        </form>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          {user && <Link to="/wishlist" onClick={() => setMenuOpen(false)}>❤️ Wishlist</Link>}
          {user && <Link to="/my-orders" onClick={() => setMenuOpen(false)}>My Orders</Link>}
          {user && <Link to="/help" onClick={() => setMenuOpen(false)}>Help</Link>}
          {user?.is_staff && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
          <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
            🛒 Cart{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {user ? (
            <button className="link-btn" onClick={() => {
              logoutUser(); showToast("Logged out successfully."); nav("/"); setMenuOpen(false);
            }}>
              Logout ({user.name.split(" ")[0]})
            </button>
          ) : (
            <Link to="/login" className="btn btn-sm" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </nav>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">☰</button>
      </div>
    </header>
  );
}
