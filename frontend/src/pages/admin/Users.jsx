import React, { useEffect, useState } from "react";
import { api, rupee } from "../../api";

export default function Users() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    api.get("/admin/users/").then(setUsers).catch(() => setUsers([]));
  }, []);

  if (!users) return <div className="empty">Loading…</div>;

  return (
    <>
      <h1 className="page-title">👥 Customers ({users.length})</h1>
      <div className="card table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Mobile</th><th>Email</th><th>Orders</th>
              <th>Total spent</th><th>Points</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b></td>
                <td>{u.mobile}</td>
                <td>{u.email || "—"}</td>
                <td>{u.order_count}</td>
                <td>{rupee(u.spent)}</td>
                <td>{u.loyalty_points} pts</td>
                <td>{new Date(u.date_joined).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
