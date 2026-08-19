import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, rupee } from "../api";
import { useStore } from "../context";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { user, config, setCartCount, showToast } = useStore();
  const nav = useNavigate();
  const coupon = sessionStorage.getItem("fk_coupon") || "";

  const [form, setForm] = useState({
    name: user?.name || "", mobile: user?.mobile || "",
    address: "", city: "", pincode: "", slot: "", notes: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [saveAddr, setSaveAddr] = useState(false);
  const [redeem, setRedeem] = useState(false);
  const [payMethod, setPayMethod] = useState("cod");
  const [totals, setTotals] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get("/addresses/").then((a) => {
      setAddresses(a);
      const def = a.find((x) => x.is_default) || a[0];
      if (def) useAddress(def);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/cart/?coupon=${encodeURIComponent(coupon)}&redeem_points=${redeem ? 1 : 0}`)
      .then((d) => {
        if (d.items.length === 0) { nav("/cart"); return; }
        setTotals(d.totals);
      })
      .catch(() => nav("/cart"));
  }, [redeem]); // eslint-disable-line

  const useAddress = (a) => {
    setForm((f) => ({ ...f, name: a.name, mobile: a.mobile, address: a.address,
                      city: a.city, pincode: a.pincode }));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (saveAddr) {
        await api.post("/addresses/", {
          label: "Home", name: form.name, mobile: form.mobile,
          address: form.address, city: form.city, pincode: form.pincode,
          is_default: addresses.length === 0,
        }).catch(() => {});
      }
      const resp = await api.post("/orders/create/", {
        ...form,
        coupon_code: coupon,
        redeem_points: redeem,
        payment_method: payMethod,
      });
      sessionStorage.removeItem("fk_coupon");
      setCartCount(0);

      if (payMethod !== "cod") {
        if (resp.razorpay) {
          const ok = await loadRazorpayScript();
          if (!ok) { showToast("Could not load payment gateway.", "warn"); nav(`/my-orders`); return; }
          const rzp = new window.Razorpay({
            key: resp.razorpay.key,
            order_id: resp.razorpay.order_id,
            amount: resp.razorpay.amount,
            currency: resp.razorpay.currency,
            name: "FreshKart",
            description: `Order #${resp.order_id}`,
            handler: async (r) => {
              await api.post(`/orders/${resp.order_id}/pay/`, r);
              nav(`/order-success/${resp.order_id}`);
            },
          });
          rzp.open();
          return;
        }
        if (resp.demo_payment) {
          // Demo gateway (no Razorpay keys configured)
          const methodNames = { upi: "UPI", card: "Card", netbanking: "Net Banking" };
          const ok = window.confirm(
            `${methodNames[payMethod] || "Online"} · DEMO PAYMENT GATEWAY\n\n` +
            `Pay ${rupee(resp.total)} for order #${resp.order_id}?\n\n` +
            `(Add real Razorpay keys to enable live payments — see README)`);
          if (ok) {
            await api.post(`/orders/${resp.order_id}/pay/`, {});
            showToast("Payment successful! ✅");
          } else {
            showToast("Payment skipped — order placed as pending.", "warn");
          }
        }
      }
      nav(`/order-success/${resp.order_id}`);
    } catch (err) {
      showToast(err.message, "warn");
    } finally {
      setBusy(false);
    }
  };

  if (!totals) return <main className="container"><div className="empty">Loading…</div></main>;

  const maxRedeem = Math.min(user?.loyalty_points || 0,
    Math.floor(totals.subtotal * (config?.loyalty?.max_redeem_pct || 10) / 100));

  return (
    <main className="container">
      <h1 className="page-title">📦 Checkout</h1>
      <form className="cart-layout" onSubmit={placeOrder}>
        <div className="checkout-form">
          {addresses.length > 0 && (
            <div className="card pad">
              <h3>Saved addresses</h3>
              <div className="addr-list">
                {addresses.map((a) => (
                  <button type="button" key={a.id} className="addr-chip"
                          onClick={() => useAddress(a)}>
                    <b>{a.label}</b> {a.address.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card pad">
            <h3>Delivery details</h3>
            <div className="form-2col">
              <label>Full name
                <input value={form.name} onChange={set("name")} required />
              </label>
              <label>Mobile
                <input value={form.mobile} onChange={set("mobile")} required />
              </label>
            </div>
            <label>Full address
              <textarea value={form.address} onChange={set("address")} rows={3} required
                        placeholder="House no, street, area, landmark…" />
            </label>
            <div className="form-2col">
              <label>City
                <input value={form.city} onChange={set("city")} />
              </label>
              <label>Pincode
                <input value={form.pincode} onChange={set("pincode")} />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={saveAddr}
                     onChange={(e) => setSaveAddr(e.target.checked)} />
              Save this address for next time
            </label>
          </div>

          <div className="card pad">
            <h3>Delivery slot</h3>
            <div className="slot-list">
              {(config?.delivery_slots || []).map((s) => (
                <label key={s} className={`slot ${form.slot === s ? "on" : ""}`}>
                  <input type="radio" name="slot" value={s}
                         checked={form.slot === s}
                         onChange={() => setForm({ ...form, slot: s })} />
                  🕐 {s}
                </label>
              ))}
            </div>
            <label>Order notes (optional)
              <input value={form.notes} onChange={set("notes")}
                     placeholder="e.g. Ring the bell twice" />
            </label>
          </div>

          <div className="card pad">
            <h3>Payment method</h3>
            <div className="pay-grid">
              {[
                ["cod", "💵", "Cash on Delivery", "Pay when your veggies arrive"],
                ["upi", "📲", "UPI", "GPay, PhonePe, Paytm & more"],
                ["card", "💳", "Credit / Debit Card", "Visa, Mastercard, RuPay"],
                ["netbanking", "🏦", "Net Banking", "All major banks"],
              ].map(([key, icon, label, hint]) => (
                <label key={key} className={`pay-option ${payMethod === key ? "on" : ""}`}>
                  <input type="radio" name="pay" checked={payMethod === key}
                         onChange={() => setPayMethod(key)} />
                  <span className="pay-icon">{icon}</span>
                  <span className="pay-label">{label}<small>{hint}</small></span>
                </label>
              ))}
            </div>
            {payMethod !== "cod" && !config?.razorpay_key && (
              <small className="muted">Online payments run in demo mode until Razorpay keys are added.</small>
            )}
          </div>
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <div className="sum-row"><span>Subtotal</span><b>{rupee(totals.subtotal)}</b></div>
          {totals.discount > 0 && (
            <div className="sum-row green">
              <span>Coupon ({totals.coupon})</span><b>−{rupee(totals.discount)}</b>
            </div>
          )}
          {maxRedeem > 0 && (
            <label className="check loyalty">
              <input type="checkbox" checked={redeem}
                     onChange={(e) => setRedeem(e.target.checked)} />
              Use loyalty points (save up to {rupee(maxRedeem)}) —
              you have {user.loyalty_points} pts
            </label>
          )}
          {totals.points_redeemed > 0 && (
            <div className="sum-row green">
              <span>Points redeemed</span><b>−{rupee(totals.points_redeemed)}</b>
            </div>
          )}
          <div className="sum-row">
            <span>Delivery</span>
            <b>{totals.delivery === 0 ? "FREE 🎉" : rupee(totals.delivery)}</b>
          </div>
          <div className="sum-row total"><span>Total</span><b>{rupee(totals.total)}</b></div>
          <button className="btn btn-lg" disabled={busy}>
            {busy ? "Placing order…" : payMethod === "cod"
              ? "Place order (COD) →" : `Pay ${rupee(totals.total)} →`}
          </button>
          <small className="muted">You'll earn {Math.floor(totals.total / (config?.loyalty?.earn_per_rs || 50))} loyalty points on this order 🎁</small>
        </aside>
      </form>
    </main>
  );
}
