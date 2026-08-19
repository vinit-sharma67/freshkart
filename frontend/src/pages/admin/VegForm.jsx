import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, imgUrl } from "../../api";
import { useStore } from "../../context";

const EMPTY = {
  name: "", hindi_name: "", category: "", price_per_kg: "", discount_pct: 0,
  stock_kg: 0, description: "", nutrition: "", is_seasonal: false, is_active: true,
};

export default function VegForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showToast } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [cats, setCats] = useState([]);
  const [file, setFile] = useState(null);
  const [currentImg, setCurrentImg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/categories/").then(setCats).catch(() => {});
    if (id) {
      api.get(`/admin/vegetables/${id}/`).then((v) => {
        setForm({
          name: v.name, hindi_name: v.hindi_name, category: v.category || "",
          price_per_kg: v.price_per_kg, discount_pct: v.discount_pct,
          stock_kg: v.stock_kg, description: v.description, nutrition: v.nutrition,
          is_seasonal: v.is_seasonal, is_active: v.is_active,
        });
        setCurrentImg(v.image);
      }).catch(() => nav("/admin/vegetables"));
    }
  }, [id]); // eslint-disable-line

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: val });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, typeof v === "boolean" ? (v ? "1" : "0") : v);
      });
      if (file) fd.append("image", file);
      const url = id ? `/admin/vegetables/${id}/` : "/admin/vegetables/";
      await api.postForm(url, fd);
      showToast(id ? "Vegetable updated ✅" : "Vegetable added ✅");
      nav("/admin/vegetables");
    } catch (err) {
      showToast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="page-title">{id ? "✏️ Edit vegetable" : "➕ Add vegetable"}</h1>
      <form className="card pad veg-form" onSubmit={submit}>
        <div className="form-2col">
          <label>Name *
            <input value={form.name} onChange={set("name")} required />
          </label>
          <label>Hindi / Gujarati name
            <input value={form.hindi_name} onChange={set("hindi_name")} />
          </label>
        </div>
        <div className="form-2col">
          <label>Category *
            <select value={form.category} onChange={set("category")} required>
              <option value="">Choose…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </label>
          <label>Price per kg (₹) *
            <input type="number" step="0.01" min="0" value={form.price_per_kg}
                   onChange={set("price_per_kg")} required />
          </label>
        </div>
        <div className="form-2col">
          <label>Discount %
            <input type="number" min="0" max="90" value={form.discount_pct}
                   onChange={set("discount_pct")} />
          </label>
          <label>Stock (kg)
            <input type="number" step="0.1" min="0" value={form.stock_kg}
                   onChange={set("stock_kg")} />
          </label>
        </div>
        <label>Description
          <textarea value={form.description} onChange={set("description")} rows={3} />
        </label>
        <label>Nutrition info
          <input value={form.nutrition} onChange={set("nutrition")}
                 placeholder="e.g. Rich in Vitamin C & Iron" />
        </label>
        <label>Image {currentImg && <img className="thumb" src={imgUrl(currentImg)} alt="" />}
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </label>
        <div className="form-2col">
          <label className="check">
            <input type="checkbox" checked={form.is_seasonal} onChange={set("is_seasonal")} />
            🌱 In season now
          </label>
          <label className="check">
            <input type="checkbox" checked={form.is_active} onChange={set("is_active")} />
            🟢 Visible in store
          </label>
        </div>
        <div className="order-actions">
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => nav("/admin/vegetables")}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
