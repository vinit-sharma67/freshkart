# 🥬 FreshKart — Online Vegetable Store (Django + React)

A complete vegetables-only ecommerce store: **Django REST API** backend + **React (Vite)** frontend.
Rebuilt and upgraded from the original Flask version, with a modern UI and many new features.

---

## ✨ Features

### Customer side
- Register / login with mobile number (token auth)
- Search in English or Hindi ("palak" finds Spinach), category chips, sorting
- 26 vegetables pre-loaded with Hindi/Gujarati names, discounts, nutrition info
- Weight selection 250 g – 5 kg with auto-calculated prices
- Cart with quantity controls, coupons, live totals, free delivery above ₹199
- **❤️ Wishlist** and **⭐ ratings & reviews** on every product
- **💳 4 payment methods** — Cash on Delivery, UPI, Credit/Debit Card, Net Banking (online ones are Razorpay-ready; run in demo mode until you add keys)
- **🙋 Help & Feedback** — raise complaints/feedback/suggestions (optionally linked to an order), track ticket status, and read the team's replies
- **🎁 Loyalty points** — earn 1 pt per ₹50 spent, redeem up to 10% of an order
- **📍 Saved addresses**, delivery slots, order notes
- Order tracking timeline, **cancel order** (auto stock + points revert), **one-click reorder**, **🧾 printable invoice**
- **👀 Recently viewed** and **🧺 frequently bought together** suggestions
- **🤖 FreshBot chatbot** — type any dish ("palak paneer", "pav bhaji", "veg biryani"…) and get the **full recipe card**: store veggies with weights & live prices, pantry ingredients, numbered cooking steps, and a one-tap **"Add all veggies to cart"** button. Also suggests by health goal ("good for iron?"), budget ("under ₹40"), and answers coupon/delivery/order questions. 19 dishes built in — ask "what can I cook?" for the list (see `backend/store/recipes.py` to add more)
- Low-stock "only X kg left" badges, seasonal picks, fully responsive design

### Admin panel (`/admin` — login: `admin` / `admin123`)
- Dashboard: revenue, orders, pending, customers, low-stock alerts
- Vegetables: add/edit/hide, image upload, discounts, stock, seasonal flag
- Orders: filter by status, expand details, update status
- Coupons: create / enable / disable / delete
- **📮 Feedback inbox** — filter complaints/feedback by status, reply to customers, resolve/reopen tickets (open-ticket count on the dashboard)
- Customer list with order count, total spent, loyalty points
- Homepage banner editor with live preview

---

## 🚀 Run it (two terminals)

### Terminal 1 — backend (Django, port 8000)
```
cd backend
pip install -r requirements.txt        # first time only
python manage.py migrate               # first time only
python manage.py seed                  # first time only — demo data
python manage.py runserver
```

### Terminal 2 — frontend (React, port 5173)
```
cd frontend
npm install                            # first time only
npm run dev
```

Open **http://localhost:5173**

| Role  | Login              | Password |
|-------|--------------------|----------|
| Admin | `admin`            | admin123 |
| Demo  | `9876543210`       | test1234 |

Coupons: `FRESH10` (10% above ₹150), `WELCOME15` (15% above ₹250), `VEGGIE20` (20% above ₹400)

---

## 💳 Enabling real Razorpay payments

Online payment works out of the box in **demo mode** (simulated success).
To go live with Razorpay test/live keys, set environment variables before starting Django:

```
set RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
set RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
python manage.py runserver
```

The React checkout automatically opens the real Razorpay window when keys are configured.

---

## 📁 Project structure

```
vegitables/
├── backend/                  # Django + DRF API
│   ├── freshkart/            # settings (store config: delivery, slots, loyalty)
│   ├── store/                # models, serializers, views, chatbot, urls
│   │   └── management/commands/seed.py   # demo data
│   ├── media/uploads/        # admin image uploads
│   └── db.sqlite3            # SQLite database
└── frontend/                 # React + Vite
    ├── public/img/veg/       # 26 vegetable SVGs
    └── src/
        ├── pages/            # Home, Product, Cart, Checkout, Orders, Wishlist, Invoice…
        ├── pages/admin/      # Dashboard, Vegetables, Orders, Coupons, Users, Banner
        ├── components/       # Navbar, VegCard, ChatWidget, StarRating…
        └── styles.css        # green design system
```

- Store settings (free-delivery threshold, slots, weights, loyalty rules) live in
  `backend/freshkart/settings.py` under **FreshKart store settings**.
- Django admin (backup UI) is at http://127.0.0.1:8000/django-admin/
- The old Flask reference project is kept in `_reference/` — safe to delete.
