import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, imgUrl, rupee } from "../api";
import VegCard from "../components/VegCard";
import { useStore } from "../context";

export default function Cart() {
  const { setCartCount, showToast } = useStore();
  const [data, setData] = useState(null);
  const [code, setCode] = useState(sessionStorage.getItem("fk_coupon") || "");
  const [applied, setApplied] = useState(sessionStorage.getItem("fk_coupon") || "");
  const [suggest, setSuggest] = useState([]);
  const nav = useNavigate();

  const load = async (coupon = applied) => {
    const d = await api.get(`/cart/?coupon=${encodeURIComponent(coupon)}`);
    setData(d);
    setCartCount(d.count);
    if (coupon && d.totals.coupon_error) {
      showToast(d.totals.coupon_error, "warn");
      sessionStorage.removeItem("fk_coupon");
      setApplied("");
    } else if (coupon && d.totals.coupon) {
      sessionStorage.setItem("fk_coupon", coupon);
    }
    const ids = d.items.map((i) => i.vegetable.id).join(",");
    if (ids) api.get(`/frequently-bought/?with=${ids}`).then(setSuggest).catch(() => {});
    else setSuggest([]);
  };

  useEffect(() => { load().catch(() => {}); }, []); // eslint-disable-line

  if (!data) return <main className="container"><div className="empty">Loading cart…</div></main>;
  const t = data.totals;

  const update = async (id, action) => {
    const d = await api.post(`/cart/${id}/`, { action, coupon: applied });
    setData(d);
    setCartCount(d.count);
    const ids = d.items.map((i) => i.vegetable.id).join(",");
    if (ids) api.get(`/frequently-bought/?with=${ids}`).then(setSuggest).catch(() => {});
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setApplied(c);
    await load(c);
  };

  const removeCoupon = async () => {
    sessionStorage.removeItem("fk_coupon");
    setApplied(""); setCode("");
    await load("");
  };

  if (data.items.length === 0) {
    return (
      <main className="container">
        <div className="empty big">
          🛒 Your cart is empty.<br />
          <Link to="/" className="btn" style={{ marginTop: 16 }}>Shop fresh veggies</Link>
        </div>
      </main>
    );
  }

  const needMore = t.free_above - (t.subtotal - t.discount);

  return (
    <main className="container">
      <h1 className="page-title">🛒 Your cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {data.items.map((it) => (
            <div key={it.id} className="card cart-item">
              <img src={imgUrl(it.vegetable.image)} alt={it.vegetable.name} />
              <div className="cart-item-info">
                <Link to={`/vegetable/${it.vegetable.id}`}><b>{it.vegetable.name}</b></Link>
                <small>{it.weight_label} · {rupee(it.unit_price)} each</small>
              </div>
              <div className="qty">
                <button onClick={() => update(it.id, "dec")}>−</button>
                <span>{it.quantity}</span>
                <button onClick={() => update(it.id, "inc")}>+</button>
              </div>
              <b className="line-total">{rupee(it.line_total)}</b>
              <button className="remove-btn" onClick={() => update(it.id, "remove")}
                      aria-label="Remove">🗑️</button>
            </div>
          ))}

          {suggest.length > 0 && (
            <section>
              <h2 className="section-title">🧺 Frequently bought together</h2>
              <div className="grid grid-sm">
                {suggest.map((v) => <VegCard key={v.id} veg={v} />)}
              </div>
            </section>
          )}
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <form className="coupon-row" onSubmit={applyCoupon}>
            <input value={code} onChange={(e) => setCode(e.target.value)}
                   placeholder="Coupon code (e.g. FRESH10)" />
            <button className="btn btn-sm" type="submit">Apply</button>
          </form>
          {t.coupon && (
            <div className="coupon-ok">
              🎟️ {t.coupon} applied <button className="link-btn" onClick={removeCoupon}>remove</button>
            </div>
          )}
          <div className="sum-row"><span>Subtotal</span><b>{rupee(t.subtotal)}</b></div>
          {t.discount > 0 && (
            <div className="sum-row green"><span>Coupon discount</span><b>−{rupee(t.discount)}</b></div>
          )}
          <div className="sum-row">
            <span>Delivery</span>
            <b>{t.delivery === 0 ? "FREE 🎉" : rupee(t.delivery)}</b>
          </div>
          {needMore > 0 && (
            <div className="free-hint">Add {rupee(needMore)} more for FREE delivery!</div>
          )}
          <div className="sum-row total"><span>Total</span><b>{rupee(t.total)}</b></div>
          <button className="btn btn-lg" onClick={() => nav("/checkout")}>
            Proceed to checkout →
          </button>
        </aside>
      </div>
    </main>
  );
}
