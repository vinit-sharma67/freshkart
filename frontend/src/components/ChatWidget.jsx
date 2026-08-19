import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, imgUrl, rupee } from "../api";
import { useStore } from "../context";

const SUGGESTIONS = [
  "How to make palak paneer?",
  "Pav bhaji recipe",
  "What can I cook?",
  "Good for immunity?",
  "Veggies under ₹40",
];

function RecipeCard({ recipe, onClose }) {
  const { user, setCartCount, showToast } = useStore();
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const available = recipe.veggies.filter((v) => v.available && v.weight);

  const addAll = async () => {
    if (!user) { onClose(); nav("/login"); return; }
    setBusy(true);
    try {
      const d = await api.post("/cart/add-many/", {
        items: available.map((v) => ({ veg_id: v.product.id, weight_label: v.weight })),
      });
      setCartCount(d.count);
      showToast(d.message);
    } catch (e) {
      showToast(e.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="recipe-card">
      <div className="recipe-head">
        <span className="r-emoji">{recipe.emoji}</span>
        <div>
          <h4>{recipe.name}</h4>
          <div className="recipe-meta">
            <span>⏱ {recipe.time}</span>
            <span>🍽 serves {recipe.serves}</span>
          </div>
        </div>
      </div>
      <div className="recipe-body">
        <div className="recipe-desc">{recipe.description}</div>

        <div className="recipe-label">🥬 Veggies from FreshKart</div>
        {recipe.veggies.map((v, i) => (
          v.available ? (
            <Link key={i} to={`/vegetable/${v.product.id}`} className="recipe-veg"
                  onClick={onClose} style={{ textDecoration: "none", color: "inherit" }}>
              <img src={imgUrl(v.product.image)} alt="" />
              <b>{v.product.name}</b>
              <span className="r-wt">{v.weight}</span>
              <span className="r-price">
                {rupee(v.product.options?.find((o) => o.label === v.weight)?.price ?? v.product.sale_per_kg)}
              </span>
            </Link>
          ) : (
            <div key={i} className="recipe-veg na">
              <b>{v.product.name}</b>
              <span className="r-wt">{v.weight}</span>
              <span className="r-price">out of stock</span>
            </div>
          )
        ))}

        <div className="recipe-label">🧂 From your pantry</div>
        <div className="pantry-chips">
          {recipe.pantry.map((p) => <span key={p}>{p}</span>)}
        </div>

        <div className="recipe-label">👩‍🍳 How to make it</div>
        <ol className="recipe-steps">
          {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>

        {available.length > 0 && (
          <button className="btn btn-lime recipe-add" onClick={addAll} disabled={busy}>
            {busy ? "Adding…" : `🧺 Add all ${available.length} veggies to cart`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { who: "bot", text: "Hi! I'm FreshBot 🥬 — tell me a dish (\"palak paneer\", \"pav bhaji\"…) and I'll show the full recipe with ingredients, or ask me for suggestions by health goal, budget or offers!" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, open]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMsgs((m) => [...m, { who: "me", text: msg }]);
    setBusy(true);
    try {
      const d = await api.post("/chatbot/", { message: msg });
      setMsgs((m) => [...m, { who: "bot", text: d.reply, products: d.products, recipe: d.recipe }]);
    } catch {
      setMsgs((m) => [...m, { who: "bot", text: "Sorry, I had trouble answering. Try again!" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)} aria-label="Chat">
        {open ? "✕" : "👩‍🍳"}
      </button>
      {open && (
        <div className="chat-panel card">
          <div className="chat-head">🥬 FreshBot <small>recipes · suggestions · offers</small></div>
          <div className="chat-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.who}`}>
                <div className="bubble">{m.text}</div>
                {m.recipe && <RecipeCard recipe={m.recipe} onClose={() => setOpen(false)} />}
                {m.products?.length > 0 && (
                  <div className="chat-products">
                    {m.products.map((p) => (
                      <Link key={p.id} to={`/vegetable/${p.id}`} className="chat-product"
                            onClick={() => setOpen(false)}>
                        <img src={imgUrl(p.image)} alt={p.name} />
                        <div>
                          <b>{p.name}</b>
                          <span>{rupee(p.sale_per_kg)}/kg</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="chat-msg bot"><div className="bubble">…</div></div>}
          </div>
          <div className="chat-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}>{s}</button>
            ))}
          </div>
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
                   placeholder="Try 'veg biryani' or 'aloo gobi'…" />
            <button type="submit" className="btn">➤</button>
          </form>
        </div>
      )}
    </>
  );
}
