import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../context";

export default function Login() {
  const { loginUser, refreshCart, refreshWishlist, showToast } = useStore();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post("/auth/login/", { mobile, password });
      loginUser(d);
      refreshCart(); refreshWishlist();
      showToast(`Welcome back, ${d.name}! 🥬`);
      nav(d.is_staff && loc.state?.from === "/admin" ? "/admin" : (loc.state?.from || "/"));
    } catch (err) {
      showToast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Welcome back 👋</h1>
        <p className="muted">Login with your mobile number</p>
        <label>Mobile number
          <input value={mobile} onChange={(e) => setMobile(e.target.value)}
                 placeholder="10-digit mobile (admin: type 'admin')" required autoFocus />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 placeholder="Your password" required />
        </label>
        <button className="btn btn-lg" disabled={busy}>{busy ? "Logging in…" : "Login"}</button>
        <p className="muted">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
