import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../context";

export default function Register() {
  const { loginUser, showToast } = useStore();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post("/auth/register/", form);
      loginUser(d);
      showToast(`Account created — welcome, ${d.name}! 🎉`);
      nav("/");
    } catch (err) {
      showToast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Create account 🥕</h1>
        <p className="muted">Fresh vegetables are one step away</p>
        <label>Full name
          <input value={form.name} onChange={set("name")} required autoFocus />
        </label>
        <label>Mobile number
          <input value={form.mobile} onChange={set("mobile")} placeholder="10-digit mobile"
                 pattern="\d{10}" title="10-digit mobile number" required />
        </label>
        <label>Email (optional)
          <input type="email" value={form.email} onChange={set("email")} />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={set("password")}
                 minLength={4} required />
        </label>
        <button className="btn btn-lg" disabled={busy}>{busy ? "Creating…" : "Register"}</button>
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
