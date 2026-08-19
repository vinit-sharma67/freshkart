import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, imgUrl, rupee } from "../api";
import { useStore } from "../context";
import StarRating from "./StarRating";

export default function VegCard({ veg }) {
  const { user, setCartCount, showToast, wishlistIds, toggleWishlist } = useStore();
  const [opt, setOpt] = useState(veg.options?.[0]?.label || "");
  const [adding, setAdding] = useState(false);
  const nav = useNavigate();

  const selected = veg.options?.find((o) => o.label === opt);
  const inWishlist = wishlistIds.includes(veg.id);
  const outOfStock = !veg.options || veg.options.length === 0;
  const lowStock = !outOfStock && Number(veg.stock_kg) < 5;

  const addToCart = async () => {
    if (!user) { nav("/login"); return; }
    setAdding(true);
    try {
      const d = await api.post("/cart/add/", { veg_id: veg.id, weight_label: opt });
      setCartCount(d.count);
      showToast(d.message);
    } catch (e) {
      showToast(e.message, "warn");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card veg-card">
      <div className="veg-card-top">
        {veg.discount_pct > 0 && <span className="badge badge-off">{veg.discount_pct}% OFF</span>}
        {veg.is_seasonal && <span className="badge badge-season">🌱 In season</span>}
        <button
          className={`wish-btn ${inWishlist ? "on" : ""}`}
          onClick={() => toggleWishlist(veg.id)}
          aria-label="Toggle wishlist"
        >{inWishlist ? "❤️" : "🤍"}</button>
        <Link to={`/vegetable/${veg.id}`}>
          <img src={imgUrl(veg.image)} alt={veg.name} loading="lazy" />
        </Link>
      </div>
      <div className="veg-card-body">
        <Link to={`/vegetable/${veg.id}`} className="veg-name">{veg.name}</Link>
        <div className="veg-hindi">{veg.hindi_name}</div>
        {veg.rating && <StarRating value={veg.rating} count={veg.rating_count} size="sm" />}
        <div className="veg-price">
          {rupee(veg.sale_per_kg)}<small>/kg</small>
          {veg.discount_pct > 0 && <s>{rupee(veg.price_per_kg)}</s>}
        </div>
        {lowStock && <div className="low-stock">⚠️ Only {Number(veg.stock_kg)} kg left</div>}
        {outOfStock ? (
          <div className="out-stock">Out of stock</div>
        ) : (
          <div className="veg-actions">
            <select value={opt} onChange={(e) => setOpt(e.target.value)}>
              {veg.options.map((o) => (
                <option key={o.label} value={o.label}>{o.label} — {rupee(o.price)}</option>
              ))}
            </select>
            <button className="btn" onClick={addToCart} disabled={adding}>
              {adding ? "…" : "Add"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
