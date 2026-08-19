import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, imgUrl, rupee } from "../api";
import StarRating from "../components/StarRating";
import VegCard from "../components/VegCard";
import { useStore } from "../context";

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, setCartCount, showToast } = useStore();
  const [data, setData] = useState(null);
  const [opt, setOpt] = useState("");
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/vegetables/${id}/`)
      .then((d) => { setData(d); setOpt(d.vegetable.options?.[0]?.label || ""); })
      .catch(() => nav("/"));
  }, [id]);

  if (!data) return <main className="container"><div className="empty">Loading…</div></main>;
  const veg = data.vegetable;
  const selected = veg.options?.find((o) => o.label === opt);

  const addToCart = async () => {
    if (!user) { nav("/login"); return; }
    try {
      const d = await api.post("/cart/add/", { veg_id: veg.id, weight_label: opt });
      setCartCount(d.count);
      showToast(d.message);
    } catch (e) { showToast(e.message, "warn"); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { nav("/login"); return; }
    if (!myRating) { showToast("Please select a star rating.", "warn"); return; }
    try {
      const d = await api.post(`/vegetables/${veg.id}/reviews/`, { rating: myRating, comment });
      setData({ ...data, reviews: d.reviews });
      setComment("");
      showToast("Thanks for your review! ⭐");
    } catch (err) { showToast(err.message, "warn"); }
  };

  return (
    <main className="container">
      <div className="product card">
        <div className="product-img">
          <img src={imgUrl(veg.image)} alt={veg.name} />
        </div>
        <div className="product-info">
          <span className="crumb">{veg.category_name}</span>
          <h1>{veg.name}</h1>
          <div className="veg-hindi">{veg.hindi_name}</div>
          {veg.rating && <StarRating value={veg.rating} count={veg.rating_count} />}
          <div className="veg-price big">
            {rupee(veg.sale_per_kg)}<small>/kg</small>
            {veg.discount_pct > 0 && <><s>{rupee(veg.price_per_kg)}</s>
              <span className="badge badge-off">{veg.discount_pct}% OFF</span></>}
          </div>
          <p>{veg.description}</p>
          {veg.nutrition && <div className="nutrition">🍃 {veg.nutrition}</div>}
          {Number(veg.stock_kg) < 5 && Number(veg.stock_kg) > 0 && (
            <div className="low-stock">⚠️ Only {Number(veg.stock_kg)} kg left — order soon!</div>
          )}
          {veg.options?.length > 0 ? (
            <div className="product-buy">
              <div className="weight-pills">
                {veg.options.map((o) => (
                  <button key={o.label}
                          className={`pill ${opt === o.label ? "on" : ""}`}
                          onClick={() => setOpt(o.label)}>
                    {o.label}<b>{rupee(o.price)}</b>
                  </button>
                ))}
              </div>
              <button className="btn btn-lg" onClick={addToCart}>
                🛒 Add to cart — {selected ? rupee(selected.price) : ""}
              </button>
            </div>
          ) : (
            <div className="out-stock">Out of stock</div>
          )}
        </div>
      </div>

      <section className="reviews">
        <h2 className="section-title">⭐ Ratings & reviews</h2>
        <div className="reviews-grid">
          <form className="card review-form" onSubmit={submitReview}>
            <h3>Rate this vegetable</h3>
            <StarRating value={myRating} onRate={setMyRating} size="lg" />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience (optional)…" rows={3} />
            <button className="btn" type="submit">Submit review</button>
            {!user && <small>You'll be asked to login first.</small>}
          </form>
          <div className="review-list">
            {data.reviews.length === 0 && <div className="empty">No reviews yet — be the first!</div>}
            {data.reviews.map((r) => (
              <div key={r.id} className="card review-item">
                <div className="review-head">
                  <b>{r.user_name}</b>
                  <StarRating value={r.rating} size="sm" />
                </div>
                {r.comment && <p>{r.comment}</p>}
                <small>{new Date(r.created_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.related.length > 0 && (
        <section>
          <h2 className="section-title">You may also like</h2>
          <div className="grid">
            {data.related.map((v) => <VegCard key={v.id} veg={v} />)}
          </div>
        </section>
      )}
    </main>
  );
}
