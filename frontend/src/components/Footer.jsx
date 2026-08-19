import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="brand"><span className="brand-leaf">🥬</span>Fresh<em>Kart</em></div>
          <p>Handpicked at sunrise from local farms, at your door by dinner.
            Eat fresher, live better. 🌱</p>
        </div>
        <div>
          <h4>Why shop with us</h4>
          <p>🚚 Free delivery above ₹199<br />🕐 Same-day delivery slots<br />
            🎁 Loyalty points on every order<br />👩‍🍳 Recipe help from FreshBot</p>
        </div>
        <div>
          <h4>Payments we accept</h4>
          <p>💵 Cash on Delivery<br />💳 UPI, Cards & Netbanking<br />🔒 100% secure checkout</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} FreshKart · farm to family, every day</div>
    </footer>
  );
}
