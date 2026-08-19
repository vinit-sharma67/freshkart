import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useStore } from "../../context";

export default function Settings() {
  const { showToast } = useStore();
  const [form, setForm] = useState({ banner_title: "", banner_subtitle: "", banner_offer: "" });

  useEffect(() => {
    api.get("/config/").then((c) => setForm({
      banner_title: c.banner.banner_title || "",
      banner_subtitle: c.banner.banner_subtitle || "",
      banner_offer: c.banner.banner_offer || "",
    })).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/settings/", form);
      showToast("Banner updated ✅ (refresh the store to see it)");
    } catch (err) { showToast(err.message, "warn"); }
  };

  return (
    <>
      <h1 className="page-title">⚙️ Homepage banner</h1>
      <form className="card pad veg-form" onSubmit={submit}>
        <label>Banner title
          <input value={form.banner_title}
                 onChange={(e) => setForm({ ...form, banner_title: e.target.value })} />
        </label>
        <label>Banner subtitle
          <input value={form.banner_subtitle}
                 onChange={(e) => setForm({ ...form, banner_subtitle: e.target.value })} />
        </label>
        <label>Offer line
          <input value={form.banner_offer}
                 onChange={(e) => setForm({ ...form, banner_offer: e.target.value })} />
        </label>
        <div className="hero" style={{ margin: "12px 0" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem" }}>{form.banner_title || "Banner title"}</h1>
            <p>{form.banner_subtitle || "Subtitle"}</p>
            {form.banner_offer && <span className="hero-offer">🎁 {form.banner_offer}</span>}
          </div>
          <div className="hero-emoji">🥕🥬🍅</div>
        </div>
        <button className="btn">Save banner</button>
      </form>
    </>
  );
}
