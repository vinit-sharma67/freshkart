import React, { useEffect, useState } from "react";
import { api, rupee } from "../../api";
import { useStore } from "../../context";

export default function Coupons() {
  const [coupons, setCoupons] = useState(null);
  const [form, setForm] = useState({ code: "", discount_pct: 10, min_order: 0 });
  const { showToast } = useStore();

  useEffect(() => {
    api.get("/admin/coupons/").then(setCoupons).catch(() => setCoupons([]));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const d = await api.post("/admin/coupons/", form);
      setCoupons(d);
      setForm({ code: "", discount_pct: 10, min_order: 0 });
      showToast("Coupon created 🎟️");
    } catch (err) { showToast(err.message, "warn"); }
  };

  const toggle = async (id) => setCoupons(await api.post(`/admin/coupons/${id}/`, {}));
  const remove = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    setCoupons(await api.del(`/admin/coupons/${id}/`));
  };

  if (!coupons) return <div className="empty">Loading…</div>;

  return (
    <>
      <h1 className="page-title">🎟️ Coupons</h1>
      <form className="card pad coupon-form" onSubmit={create}>
        <label>Code
          <input value={form.code} placeholder="e.g. SUMMER25"
                 onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                 required />
        </label>
        <label>Discount %
          <input type="number" min="1" max="90" value={form.discount_pct}
                 onChange={(e) => setForm({ ...form, discount_pct: e.target.value })} required />
        </label>
        <label>Min order (₹)
          <input type="number" min="0" value={form.min_order}
                 onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
        </label>
        <button className="btn">Create</button>
      </form>

      <div className="card table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><b>{c.code}</b></td>
                <td>{c.discount_pct}%</td>
                <td>{rupee(c.min_order)}</td>
                <td>{c.is_active ? "🟢 Active" : "⚪ Disabled"}</td>
                <td className="actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => toggle(c.id)}>
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
