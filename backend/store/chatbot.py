"""
FreshKart chatbot — rule-based product assistant.
Understands greetings, product/price questions, health-goal suggestions,
budget queries, delivery/coupon/order help. Returns a reply plus optional
product cards for the frontend to render.
"""
import re
from decimal import Decimal

from django.conf import settings
from django.db.models import Q

from .models import Coupon, Order, Vegetable
from .recipes import all_dish_names, find_recipe

# health keyword -> terms searched inside the `nutrition` field
HEALTH_MAP = {
    "iron": ["iron"],
    "anemia": ["iron", "folate"],
    "protein": ["protein"],
    "vitamin c": ["vitamin c"],
    "immunity": ["vitamin c", "immunity", "allicin"],
    "cold": ["vitamin c", "immunity"],
    "eyes": ["vitamin a"],
    "eyesight": ["vitamin a"],
    "skin": ["vitamin c", "vitamin a"],
    "digestion": ["fibre", "digestion"],
    "fiber": ["fibre"],
    "fibre": ["fibre"],
    "weight loss": ["low calorie", "water", "fibre"],
    "diet": ["low calorie", "fibre"],
    "diabetes": ["blood sugar", "fibre"],
    "sugar": ["blood sugar"],
    "bones": ["calcium", "vitamin k", "vitamin d"],
    "calcium": ["calcium"],
    "hydration": ["water", "hydrated"],
    "summer": ["water", "hydrated"],
    "energy": ["carbs", "b vitamins", "potassium"],
    "heart": ["potassium", "antioxidants", "fibre"],
    "pregnancy": ["folate", "iron"],
}

DISH_MAP = {
    "salad": ["Cucumber", "Tomato", "Carrot", "Beetroot", "Onion", "Lemon", "Cabbage"],
    "soup": ["Tomato", "Pumpkin", "Spinach", "Broccoli", "Mushroom", "Sweet Corn"],
    "curry": ["Potato", "Tomato", "Onion", "Cauliflower", "Green Peas", "Brinjal"],
    "sabzi": ["Lady Finger", "Brinjal", "Bottle Gourd", "Cauliflower", "Potato", "Cabbage"],
    "juice": ["Carrot", "Beetroot", "Mint", "Lemon", "Cucumber"],
    "pizza": ["Capsicum", "Onion", "Tomato", "Sweet Corn", "Mushroom", "Broccoli"],
    "paratha": ["Potato", "Fenugreek", "Cauliflower", "Onion"],
    "chutney": ["Coriander", "Mint", "Green Chilli", "Garlic", "Lemon", "Tomato"],
    "chinese": ["Capsicum", "Cabbage", "Carrot", "Garlic", "Ginger", "Mushroom"],
    "dal": ["Spinach", "Tomato", "Garlic", "Green Chilli", "Coriander"],
    "raita": ["Cucumber", "Mint", "Coriander", "Onion"],
}


def _active():
    return Vegetable.objects.filter(is_active=True)


def _cards(qs, limit=4):
    from .serializers import VegetableSerializer
    return VegetableSerializer(qs[:limit], many=True).data


def _recipe_payload(recipe):
    """Build the structured recipe response: store products + pantry + steps."""
    from .serializers import VegetableSerializer
    vegs = {v.name: v for v in
            Vegetable.objects.filter(name__in=[n for n, _ in recipe["veggies"]])}
    items = []
    for name, weight in recipe["veggies"]:
        v = vegs.get(name)
        if v and v.is_active:
            data = VegetableSerializer(v).data
            available_weights = [o["label"] for o in data["options"]]
            items.append({
                "product": data,
                "weight": weight if weight in available_weights
                          else (available_weights[0] if available_weights else None),
                "available": bool(available_weights),
            })
        else:
            items.append({"product": {"name": name}, "weight": weight, "available": False})
    return {
        "name": recipe["name"], "emoji": recipe["emoji"],
        "time": recipe["time"], "serves": recipe["serves"],
        "description": recipe["description"],
        "veggies": items, "pantry": recipe["pantry"], "steps": recipe["steps"],
    }


def get_reply(message: str, user=None):
    """Return {'reply': str, 'products': [...], 'recipe': {...}|None}"""
    msg = (message or "").strip().lower()
    if not msg:
        return {"reply": "Hi! Ask me anything about our vegetables — try "
                         "\"what's good for immunity?\" or \"how to make palak paneer?\".",
                "products": []}

    # ---- recipe lookup (highest priority — dish names are most specific) ----
    recipe = find_recipe(msg)
    if recipe:
        payload = _recipe_payload(recipe)
        n_avail = sum(1 for i in payload["veggies"] if i["available"])
        return {
            "reply": f"{recipe['emoji']} Here's everything for {recipe['name']} — "
                     f"{n_avail} fresh veggies from our store, plus the full recipe below. "
                     "Tap \"Add all veggies\" and you're set! 👩‍🍳",
            "products": [],
            "recipe": payload,
        }

    # ---- "what can I cook" ----
    if any(w in msg for w in ("what can i cook", "what can i make", "which dish",
                              "dish ideas", "recipe list", "recipes", "dinner idea",
                              "lunch idea", "what to cook", "what to make")):
        dishes = ", ".join(all_dish_names())
        return {"reply": "👩‍🍳 I know these dishes — just type a name and I'll show "
                         f"the full recipe with ingredients:\n{dishes}",
                "products": []}

    # ---- greetings ----
    if re.fullmatch(r"(hi+|hello+|hey+|namaste|hola)[!. ]*", msg):
        name = f", {user.first_name.split()[0]}" if user and user.is_authenticated and user.first_name else ""
        return {"reply": f"Hello{name}! 🥬 I'm FreshBot. Tell me a dish and I'll show the "
                         "full recipe with ingredients — try \"palak paneer\" or \"pav bhaji\". "
                         "I can also suggest by health goal (\"rich in iron\") or budget "
                         "(\"under ₹40\").",
                "products": []}

    if "thank" in msg:
        return {"reply": "You're welcome! Happy healthy eating! 🥗", "products": []}

    # ---- order status ----
    if "order" in msg and any(w in msg for w in ("status", "track", "where", "my order")):
        if user and user.is_authenticated:
            last = Order.objects.filter(user=user).first()
            if last:
                return {"reply": f"Your latest order #{last.id} ({last.created_at:%d %b}) is "
                                 f"currently **{last.status}**. Total ₹{int(last.total)}. "
                                 "See My Orders for the full timeline.",
                        "products": []}
            return {"reply": "You haven't placed any orders yet. Add some fresh veggies to "
                             "your cart and check out!", "products": []}
        return {"reply": "Please login to check your order status.", "products": []}

    # ---- complaints / feedback ----
    if any(w in msg for w in ("complain", "complaint", "problem", "issue", "refund",
                              "wrong order", "bad quality", "rotten", "damaged",
                              "not delivered", "feedback", "suggestion")):
        return {"reply": "😔 Sorry to hear that! Please visit the **Help & Feedback** page "
                         "(link in the top menu) to raise a complaint — you can attach your "
                         "order number and our team will reply there. Your feedback and "
                         "suggestions are welcome on the same page too!",
                "products": []}

    # ---- delivery info ----
    if any(w in msg for w in ("delivery", "shipping", "deliver")):
        return {"reply": f"🚚 Delivery is FREE on orders above ₹{settings.FREE_DELIVERY_ABOVE} "
                         f"(₹{settings.DELIVERY_CHARGE} otherwise). You can pick a convenient "
                         "slot at checkout — same-day evening or next-day slots available.",
                "products": []}

    # ---- coupons ----
    if any(w in msg for w in ("coupon", "code", "offer", "promo")):
        coupons = Coupon.objects.filter(is_active=True)
        if coupons:
            lines = ", ".join(f"{c.code} ({c.discount_pct}% off above ₹{int(c.min_order)})"
                              for c in coupons)
            return {"reply": f"🎟️ Active coupons: {lines}. Apply them in your cart!",
                    "products": []}
        return {"reply": "No active coupons right now — but our discounts are always on!",
                "products": []}

    # ---- discounts / deals ----
    if any(w in msg for w in ("discount", "deal", "offer", "sale", "cheap")):
        qs = _active().filter(discount_pct__gt=0).order_by("-discount_pct")
        return {"reply": "🔥 Today's best deals:", "products": _cards(qs)}

    # ---- seasonal ----
    if "season" in msg:
        qs = _active().filter(is_seasonal=True)
        return {"reply": "🌱 Fresh in season right now:", "products": _cards(qs)}

    # ---- budget: "under 50", "below ₹40" ----
    m = re.search(r"(?:under|below|less than|upto|up to|max)\s*(?:₹|rs\.?\s*)?(\d+)", msg)
    if m:
        limit = Decimal(m.group(1))
        qs = [v for v in _active() if v.sale_price_per_kg <= limit]
        qs.sort(key=lambda v: v.sale_price_per_kg)
        if qs:
            return {"reply": f"💰 Vegetables at ₹{limit}/kg or less:", "products": _cards(qs)}
        return {"reply": f"Nothing under ₹{limit}/kg right now — our cheapest options:",
                "products": _cards(sorted(_active(), key=lambda v: v.sale_price_per_kg))}

    # ---- dish suggestions ----
    for dish, names in DISH_MAP.items():
        if dish in msg:
            qs = _active().filter(name__in=names)
            return {"reply": f"🍽️ Perfect for {dish}:", "products": _cards(qs, 6)}

    # ---- health goals ----
    for key, terms in HEALTH_MAP.items():
        if key in msg:
            q = Q()
            for t in terms:
                q |= Q(nutrition__icontains=t)
            qs = _active().filter(q)
            if qs:
                return {"reply": f"💪 Great for {key} — try these:", "products": _cards(qs)}

    # ---- direct product search (name or hindi name) ----
    words = [w for w in re.findall(r"[a-z]+", msg) if len(w) > 2]
    for w in words:
        qs = _active().filter(Q(name__icontains=w) | Q(hindi_name__icontains=w))
        if qs:
            v = qs[0]
            price = int(v.sale_price_per_kg)
            stock = "in stock ✅" if v.stock_kg > 0 else "out of stock ❌"
            reply = (f"{v.name} ({v.hindi_name.split('/')[0].strip()}) is ₹{price}/kg"
                     + (f" ({v.discount_pct}% off!)" if v.discount_pct else "")
                     + f" — {stock}. {v.nutrition}.")
            return {"reply": reply, "products": _cards(qs)}

    # ---- fallback ----
    return {"reply": "I can help you find the right veggies! Try asking:\n"
                     "• \"How to make pav bhaji?\" — full recipe + ingredients\n"
                     "• \"What can I cook?\" — list of dishes I know\n"
                     "• \"What's good for immunity?\"\n"
                     "• \"Show me everything under ₹40\"\n"
                     "• \"Any coupons?\"",
            "products": []}
