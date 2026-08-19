import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import VegCard from "../components/VegCard";
import { useStore } from "../context";

export default function Home() {
  const [params, setParams] = useSearchParams();
  const { config, user } = useStore();
  const [data, setData] = useState({ vegetables: [], seasonal: [] });
  const [cats, setCats] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const cat = params.get("category") || "";
  const sort = params.get("sort") || "";

  useEffect(() => {
    api.get("/categories/").then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (cat) qs.set("category", cat);
    if (sort) qs.set("sort", sort);
    api.get(`/vegetables/?${qs}`)
      .then((d) => setData({ vegetables: d.vegetables, seasonal: d.seasonal || [] }))
      .finally(() => setLoading(false));
  }, [q, cat, sort]);

  useEffect(() => {
    if (user) api.get("/recently-viewed/").then(setRecent).catch(() => {});
  }, [user]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(params);
    if (val) p.set(key, val); else p.delete(key);
    setParams(p);
  };

  const banner = config?.banner || {};
  const activeCat = cats.find((c) => String(c.id) === cat);

  return (
    <main className="container">
      {!q && !cat && (
        <>
          <section className="hero">
            <span className="hero-float" style={{ top: "14%", right: "8%" }}>🥕</span>
            <span className="hero-float" style={{ top: "48%", right: "20%", animationDelay: "-2s" }}>🍅</span>
            <span className="hero-float" style={{ bottom: "12%", right: "6%", animationDelay: "-4s" }}>🥦</span>
            <span className="hero-float" style={{ top: "20%", right: "32%", animationDelay: "-1s", fontSize: "2.2rem" }}>🌽</span>
            <h1>
              {banner.banner_title
                ? <>{banner.banner_title.split(" ").slice(0, -2).join(" ")}{" "}
                    <em>{banner.banner_title.split(" ").slice(-2).join(" ")}</em></>
                : <>Farm-fresh veggies, <em>picked at sunrise</em></>}
            </h1>
            <p>{banner.banner_subtitle || "Handpicked every morning from local farms."}</p>
            {banner.banner_offer && <span className="hero-offer">🎁 {banner.banner_offer}</span>}
            <div className="hero-stats">
              <div className="hero-stat"><b>26+</b><small>fresh vegetables</small></div>
              <div className="hero-stat"><b>Same day</b><small>delivery slots</small></div>
              <div className="hero-stat"><b>100%</b><small>farm fresh</small></div>
              <div className="hero-stat"><b>{config?.free_delivery_above ? `₹${config.free_delivery_above}+` : "₹199+"}</b><small>free delivery</small></div>
            </div>
          </section>
          <div className="marquee">
            <div className="marquee-track">
              {[0, 1].map((i) => (
                <React.Fragment key={i}>
                  <span>🚚 FREE DELIVERY ABOVE ₹199</span><span>✦</span>
                  <span>🥬 PICKED FRESH EVERY MORNING</span><span>✦</span>
                  <span>👩‍🍳 ASK FRESHBOT FOR ANY RECIPE</span><span>✦</span>
                  <span>🎁 EARN LOYALTY POINTS ON EVERY ORDER</span><span>✦</span>
                  <span>🎟️ CODE FRESH10 — 10% OFF</span><span>✦</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="chips">
        <button className={`chip ${!cat ? "on" : ""}`} onClick={() => setParam("category", "")}>
          All
        </button>
        {cats.map((c) => (
          <button key={c.id} className={`chip ${cat === String(c.id) ? "on" : ""}`}
                  onClick={() => setParam("category", String(c.id))}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {!q && !cat && data.seasonal.length > 0 && (
        <section>
          <h2 className="section-title">🌱 In season now</h2>
          <div className="grid">
            {data.seasonal.map((v) => <VegCard key={v.id} veg={v} />)}
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2 className="section-title">
            {q ? `Results for "${q}"` : activeCat ? `${activeCat.emoji} ${activeCat.name}` : "🥗 All vegetables"}
          </h2>
          <select value={sort} onChange={(e) => setParam("sort", e.target.value)}>
            <option value="">Sort: Name</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
            <option value="discount">Biggest discount</option>
          </select>
        </div>
        {loading ? (
          <div className="empty">Loading fresh veggies… 🥬</div>
        ) : data.vegetables.length === 0 ? (
          <div className="empty">No vegetables found{q && ` for "${q}"`}. Try another search!</div>
        ) : (
          <div className="grid">
            {data.vegetables.map((v) => <VegCard key={v.id} veg={v} />)}
          </div>
        )}
      </section>

      {recent.length > 0 && !q && !cat && (
        <section>
          <h2 className="section-title">👀 Recently viewed</h2>
          <div className="grid">
            {recent.map((v) => <VegCard key={v.id} veg={v} />)}
          </div>
        </section>
      )}
    </main>
  );
}
