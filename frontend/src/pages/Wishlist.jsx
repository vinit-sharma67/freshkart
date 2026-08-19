import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import VegCard from "../components/VegCard";
import { useStore } from "../context";

export default function Wishlist() {
  const [vegs, setVegs] = useState(null);
  const { wishlistIds } = useStore();

  useEffect(() => {
    api.get("/wishlist/").then((d) => setVegs(d.vegetables)).catch(() => setVegs([]));
  }, []);

  // keep the page in sync when a heart is un-toggled
  const visible = (vegs || []).filter((v) => wishlistIds.includes(v.id));

  if (!vegs) return <main className="container"><div className="empty">Loading…</div></main>;

  return (
    <main className="container">
      <h1 className="page-title">❤️ My wishlist</h1>
      {visible.length === 0 ? (
        <div className="empty big">Your wishlist is empty.<br />
          <Link to="/" className="btn" style={{ marginTop: 16 }}>Browse vegetables</Link></div>
      ) : (
        <div className="grid">
          {visible.map((v) => <VegCard key={v.id} veg={v} />)}
        </div>
      )}
    </main>
  );
}
