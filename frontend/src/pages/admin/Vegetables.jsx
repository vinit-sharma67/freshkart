import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl, rupee } from "../../api";
import { useStore } from "../../context";

export default function Vegetables() {
  const [vegs, setVegs] = useState(null);
  const { showToast } = useStore();

  const load = () => api.get("/admin/vegetables/").then(setVegs).catch(() => setVegs([]));
  useEffect(() => { load(); }, []);

  const hide = async (v) => {
    if (!window.confirm(`Hide "${v.name}" from the store?`)) return;
    await api.del(`/admin/vegetables/${v.id}/`);
    showToast(`${v.name} hidden from store.`);
    load();
  };

  if (!vegs) return <div className="empty">Loading…</div>;

  return (
    <>
      <div className="section-head">
        <h1 className="page-title">🥕 Vegetables ({vegs.length})</h1>
        <Link to="/admin/vegetables/new" className="btn">+ Add vegetable</Link>
      </div>
      <div className="card table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th></th><th>Name</th><th>Category</th><th>Price/kg</th>
              <th>Disc.</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {vegs.map((v) => (
              <tr key={v.id} className={!v.is_active ? "inactive" : ""}>
                <td><img className="thumb" src={imgUrl(v.image)} alt="" /></td>
                <td><b>{v.name}</b><br /><small>{v.hindi_name}</small></td>
                <td>{v.category_name}</td>
                <td>{rupee(v.price_per_kg)}</td>
                <td>{v.discount_pct > 0 ? `${v.discount_pct}%` : "—"}</td>
                <td className={Number(v.stock_kg) < 5 ? "warn-text" : ""}>
                  {Number(v.stock_kg)} kg</td>
                <td>
                  {v.is_active ? "🟢 Live" : "⚪ Hidden"}
                  {v.is_seasonal && " 🌱"}
                </td>
                <td className="actions">
                  <Link to={`/admin/vegetables/${v.id}`} className="btn btn-sm btn-ghost">Edit</Link>
                  {v.is_active && (
                    <button className="btn btn-sm btn-danger" onClick={() => hide(v)}>Hide</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
