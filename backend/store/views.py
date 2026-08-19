import os
import random
import string
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .chatbot import get_reply
from .models import (Address, CartItem, Category, Coupon, Feedback, Order,
                     OrderItem, RecentlyViewed, Review, Setting, User,
                     Vegetable, WishlistItem)
from .serializers import (AddressSerializer, CartItemSerializer,
                          CategorySerializer, CouponSerializer,
                          FeedbackSerializer, OrderSerializer,
                          ReviewSerializer, UserSerializer,
                          VegetableSerializer)

try:
    import razorpay
except ImportError:                                       # razorpay optional
    razorpay = None

ALLOWED_IMG_EXT = {"png", "jpg", "jpeg", "webp", "svg", "gif"}


def _user_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {
        "token": token.key,
        "id": user.id,
        "name": user.first_name or user.username,
        "mobile": user.mobile,
        "email": user.email,
        "is_staff": user.is_staff,
        "loyalty_points": user.loyalty_points,
    }


# ==========================================================
#  AUTH
# ==========================================================
@api_view(["POST"])
def register(request):
    d = request.data
    name = (d.get("name") or "").strip()
    mobile = (d.get("mobile") or "").strip()
    email = (d.get("email") or "").strip()
    password = d.get("password") or ""
    if not (name and mobile and password):
        return Response({"error": "Please fill all required fields."}, status=400)
    if not (mobile.isdigit() and len(mobile) == 10):
        return Response({"error": "Enter a valid 10-digit mobile number."}, status=400)
    if User.objects.filter(mobile=mobile).exists():
        return Response({"error": "This mobile number is already registered. Please login."},
                        status=400)
    user = User.objects.create_user(username=mobile, password=password,
                                    first_name=name, email=email, mobile=mobile)
    return Response(_user_payload(user), status=201)


@api_view(["POST"])
def login(request):
    mobile = (request.data.get("mobile") or "").strip()
    password = request.data.get("password") or ""
    # Customers login with mobile; admin can login with username "admin"
    user = authenticate(username=mobile, password=password)
    if not user:
        u = User.objects.filter(mobile=mobile).first()
        if u:
            user = authenticate(username=u.username, password=password)
    if not user:
        return Response({"error": "Invalid mobile number or password."}, status=400)
    return Response(_user_payload(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(_user_payload(request.user))


# ==========================================================
#  CATALOG
# ==========================================================
@api_view(["GET"])
def vegetables_list(request):
    q = (request.GET.get("q") or "").strip()
    cat = request.GET.get("category")
    sort = request.GET.get("sort", "")

    qs = Vegetable.objects.filter(is_active=True).select_related("category")
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(hindi_name__icontains=q))
    if cat:
        qs = qs.filter(category_id=cat)

    if sort == "low":
        qs = qs.order_by(F("price_per_kg") * (100 - F("discount_pct")))
    elif sort == "high":
        qs = qs.order_by((F("price_per_kg") * (100 - F("discount_pct"))).desc())
    elif sort == "discount":
        qs = qs.order_by("-discount_pct")
    else:
        qs = qs.order_by("name")

    data = {"vegetables": VegetableSerializer(qs, many=True).data}
    if not q and not cat:
        seasonal = Vegetable.objects.filter(is_active=True, is_seasonal=True).order_by("name")[:8]
        data["seasonal"] = VegetableSerializer(seasonal, many=True).data
    return Response(data)


@api_view(["GET"])
def vegetable_detail(request, veg_id):
    try:
        veg = Vegetable.objects.select_related("category").get(id=veg_id, is_active=True)
    except Vegetable.DoesNotExist:
        return Response({"error": "Vegetable not found."}, status=404)

    if request.user.is_authenticated:
        RecentlyViewed.objects.update_or_create(user=request.user, vegetable=veg)

    related = list(Vegetable.objects.filter(category=veg.category, is_active=True)
                   .exclude(id=veg.id))
    random.shuffle(related)
    reviews = veg.reviews.select_related("user")[:20]
    return Response({
        "vegetable": VegetableSerializer(veg).data,
        "related": VegetableSerializer(related[:4], many=True).data,
        "reviews": ReviewSerializer(reviews, many=True).data,
    })


@api_view(["GET"])
def categories_list(request):
    return Response(CategorySerializer(Category.objects.all(), many=True).data)


@api_view(["GET"])
def store_config(request):
    banner = {s.skey: s.svalue for s in Setting.objects.all()}
    return Response({
        "banner": banner,
        "free_delivery_above": settings.FREE_DELIVERY_ABOVE,
        "delivery_charge": settings.DELIVERY_CHARGE,
        "delivery_slots": settings.DELIVERY_SLOTS,
        "weight_options": [{"label": l, "kg": k} for l, k in settings.WEIGHT_OPTIONS],
        "order_statuses": settings.ORDER_STATUSES,
        "loyalty": {"earn_per_rs": settings.LOYALTY_EARN_PER_RS,
                    "max_redeem_pct": settings.LOYALTY_MAX_REDEEM_PCT},
        "razorpay_key": settings.RAZORPAY_KEY_ID or None,
    })


# ==========================================================
#  CART
# ==========================================================
def _cart_items(user):
    return (CartItem.objects.filter(user=user)
            .select_related("vegetable", "vegetable__category"))


def _cart_totals(user, coupon_code="", redeem_points=False):
    items = _cart_items(user)
    subtotal = sum(it.vegetable.weight_price(it.weight_kg) * it.quantity for it in items)

    discount, coupon, coupon_error = 0, None, None
    code = (coupon_code or "").strip().upper()
    if code:
        c = Coupon.objects.filter(code=code, is_active=True).first()
        if not c:
            coupon_error = "Invalid coupon code."
        elif subtotal < float(c.min_order):
            coupon_error = f"Coupon {code} needs a minimum order of ₹{int(c.min_order)}."
        else:
            discount = round(subtotal * c.discount_pct / 100)
            coupon = code

    after = subtotal - discount

    points_redeemed = 0
    if redeem_points and user.loyalty_points > 0 and after > 0:
        max_by_pct = int(subtotal * settings.LOYALTY_MAX_REDEEM_PCT / 100)
        points_redeemed = min(user.loyalty_points, max_by_pct, after)
        after -= points_redeemed

    delivery = 0 if (after >= settings.FREE_DELIVERY_ABOVE or subtotal == 0) \
        else settings.DELIVERY_CHARGE
    return items, {
        "subtotal": subtotal, "discount": discount, "coupon": coupon,
        "coupon_error": coupon_error, "points_redeemed": points_redeemed,
        "delivery": delivery, "total": after + delivery,
        "free_above": settings.FREE_DELIVERY_ABOVE,
    }


def _cart_response(user, coupon="", redeem=False):
    items, totals = _cart_totals(user, coupon, redeem)
    return Response({"items": CartItemSerializer(items, many=True).data,
                     "totals": totals,
                     "count": sum(i.quantity for i in items)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cart_view(request):
    return _cart_response(request.user, request.GET.get("coupon", ""),
                          request.GET.get("redeem_points") == "1")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cart_add(request):
    veg_id = request.data.get("veg_id")
    label = request.data.get("weight_label")
    kg = dict(settings.WEIGHT_OPTIONS).get(label)
    veg = Vegetable.objects.filter(id=veg_id, is_active=True).first()
    if not veg or kg is None:
        return Response({"error": "Item not available."}, status=400)
    if Decimal(str(kg)) > veg.stock_kg:
        return Response({"error": f"Only {veg.stock_kg} kg of {veg.name} left."}, status=400)
    item, created = CartItem.objects.get_or_create(
        user=request.user, vegetable=veg, weight_label=label,
        defaults={"weight_kg": Decimal(str(kg))})
    if not created:
        item.quantity += 1
        item.save()
    count = CartItem.objects.filter(user=request.user).aggregate(c=Sum("quantity"))["c"] or 0
    return Response({"ok": True, "message": f"{veg.name} ({label}) added to cart.",
                     "count": count})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cart_add_many(request):
    """Add several items at once (used by chatbot recipes).
    Body: {items: [{veg_id, weight_label}, ...]}"""
    items = request.data.get("items") or []
    weight_map = dict(settings.WEIGHT_OPTIONS)
    added, skipped = 0, []
    for entry in items:
        veg = Vegetable.objects.filter(id=entry.get("veg_id"), is_active=True).first()
        label = entry.get("weight_label")
        kg = weight_map.get(label)
        if not veg or kg is None or Decimal(str(kg)) > veg.stock_kg:
            skipped.append(veg.name if veg else "item")
            continue
        item, created = CartItem.objects.get_or_create(
            user=request.user, vegetable=veg, weight_label=label,
            defaults={"weight_kg": Decimal(str(kg))})
        if not created:
            item.quantity += 1
            item.save()
        added += 1
    msg = f"{added} veggie(s) added to your cart! 🧺"
    if skipped:
        msg += f" (Unavailable: {', '.join(skipped)})"
    count = CartItem.objects.filter(user=request.user).aggregate(c=Sum("quantity"))["c"] or 0
    return Response({"ok": True, "message": msg, "count": count, "added": added})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cart_update(request, item_id):
    action = request.data.get("action")
    item = CartItem.objects.filter(id=item_id, user=request.user).first()
    if item:
        if action == "inc":
            item.quantity += 1
            item.save()
        elif action == "dec" and item.quantity > 1:
            item.quantity -= 1
            item.save()
        elif action in ("dec", "remove"):
            item.delete()
    return _cart_response(request.user, request.data.get("coupon", ""))


# ==========================================================
#  WISHLIST / REVIEWS / ADDRESSES
# ==========================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wishlist_view(request):
    ids = list(WishlistItem.objects.filter(user=request.user)
               .values_list("vegetable_id", flat=True))
    vegs = Vegetable.objects.filter(id__in=ids, is_active=True)
    return Response({"ids": ids, "vegetables": VegetableSerializer(vegs, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def wishlist_toggle(request):
    veg_id = request.data.get("veg_id")
    if not Vegetable.objects.filter(id=veg_id).exists():
        return Response({"error": "Not found."}, status=404)
    item, created = WishlistItem.objects.get_or_create(user=request.user, vegetable_id=veg_id)
    if not created:
        item.delete()
    ids = list(WishlistItem.objects.filter(user=request.user)
               .values_list("vegetable_id", flat=True))
    return Response({"ids": ids, "added": created})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def review_create(request, veg_id):
    rating = int(request.data.get("rating") or 0)
    comment = (request.data.get("comment") or "").strip()
    if not (1 <= rating <= 5):
        return Response({"error": "Rating must be 1-5 stars."}, status=400)
    veg = Vegetable.objects.filter(id=veg_id, is_active=True).first()
    if not veg:
        return Response({"error": "Not found."}, status=404)
    Review.objects.update_or_create(user=request.user, vegetable=veg,
                                    defaults={"rating": rating, "comment": comment})
    reviews = veg.reviews.select_related("user")[:20]
    return Response({"ok": True, "reviews": ReviewSerializer(reviews, many=True).data})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def addresses_view(request):
    if request.method == "POST":
        ser = AddressSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if ser.validated_data.get("is_default"):
            Address.objects.filter(user=request.user).update(is_default=False)
        ser.save(user=request.user)
    qs = Address.objects.filter(user=request.user)
    return Response(AddressSerializer(qs, many=True).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def address_delete(request, addr_id):
    Address.objects.filter(id=addr_id, user=request.user).delete()
    qs = Address.objects.filter(user=request.user)
    return Response(AddressSerializer(qs, many=True).data)


# ==========================================================
#  SMART SHOPPING
# ==========================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recently_viewed(request):
    ids = [r.vegetable_id for r in
           RecentlyViewed.objects.filter(user=request.user)[:8]]
    vegs = {v.id: v for v in Vegetable.objects.filter(id__in=ids, is_active=True)}
    ordered = [vegs[i] for i in ids if i in vegs]
    return Response(VegetableSerializer(ordered, many=True).data)


@api_view(["GET"])
def frequently_bought(request):
    """Suggestions based on order co-occurrence with the given veg ids
    (?with=1,2,3). Falls back to best-sellers."""
    raw = request.GET.get("with", "")
    base_ids = [int(x) for x in raw.split(",") if x.strip().isdigit()]

    suggestions = []
    if base_ids:
        order_ids = (OrderItem.objects.filter(vegetable_id__in=base_ids)
                     .values_list("order_id", flat=True).distinct())
        co = (OrderItem.objects.filter(order_id__in=list(order_ids))
              .exclude(vegetable_id__in=base_ids)
              .exclude(vegetable__isnull=True)
              .values("vegetable_id").annotate(n=Count("id")).order_by("-n")[:6])
        ids = [c["vegetable_id"] for c in co]
        vegs = {v.id: v for v in Vegetable.objects.filter(id__in=ids, is_active=True)}
        suggestions = [vegs[i] for i in ids if i in vegs]

    if not suggestions:
        best = (OrderItem.objects.exclude(vegetable__isnull=True)
                .exclude(vegetable_id__in=base_ids)
                .values("vegetable_id").annotate(n=Count("id")).order_by("-n")[:6])
        ids = [b["vegetable_id"] for b in best]
        vegs = {v.id: v for v in Vegetable.objects.filter(id__in=ids, is_active=True)}
        suggestions = [vegs[i] for i in ids if i in vegs]
        if not suggestions:  # brand-new store: seasonal picks
            suggestions = list(Vegetable.objects
                               .filter(is_active=True, is_seasonal=True)
                               .exclude(id__in=base_ids)[:6])
    return Response(VegetableSerializer(suggestions, many=True).data)


@api_view(["POST"])
def chatbot(request):
    return Response(get_reply(request.data.get("message", ""),
                              request.user if request.user.is_authenticated else None))


# ==========================================================
#  ORDERS & PAYMENT
# ==========================================================
def _razorpay_client():
    if razorpay and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def order_create(request):
    d = request.data
    name = (d.get("name") or "").strip()
    mobile = (d.get("mobile") or "").strip()
    address = (d.get("address") or "").strip()
    if not (name and mobile and address):
        return Response({"error": "Please fill name, mobile and address."}, status=400)

    items, t = _cart_totals(request.user, d.get("coupon_code", ""),
                            bool(d.get("redeem_points")))
    items = list(items)
    if not items:
        return Response({"error": "Your cart is empty."}, status=400)
    if t["coupon_error"]:
        return Response({"error": t["coupon_error"]}, status=400)

    method = d.get("payment_method", "cod")
    PAY_LABELS = {"cod": "Cash on Delivery", "upi": "UPI",
                  "card": "Credit / Debit Card", "netbanking": "Net Banking",
                  "online": "Online Payment"}
    pay_label = PAY_LABELS.get(method, "Cash on Delivery")

    points_earned = int(t["total"]) // settings.LOYALTY_EARN_PER_RS
    order = Order.objects.create(
        user=request.user, customer_name=name, mobile=mobile, address=address,
        city=(d.get("city") or "").strip(), pincode=(d.get("pincode") or "").strip(),
        delivery_slot=d.get("slot") or settings.DELIVERY_SLOTS[0],
        order_notes=(d.get("notes") or "").strip(),
        subtotal=t["subtotal"], discount=t["discount"],
        coupon_code=t["coupon"] or "", points_redeemed=t["points_redeemed"],
        points_earned=points_earned, delivery_charge=t["delivery"], total=t["total"],
        payment_method=pay_label,
        payment_status="Pending",
    )
    for it in items:
        OrderItem.objects.create(
            order=order, vegetable=it.vegetable, veg_name=it.vegetable.name,
            weight_label=it.weight_label, weight_kg=it.weight_kg,
            quantity=it.quantity, price=it.vegetable.weight_price(it.weight_kg))
        # auto stock deduction
        veg = it.vegetable
        veg.stock_kg = max(veg.stock_kg - it.weight_kg * it.quantity, Decimal("0"))
        veg.save(update_fields=["stock_kg"])

    # loyalty points: spend redeemed, credit earned
    user = request.user
    user.loyalty_points = user.loyalty_points - t["points_redeemed"] + points_earned
    user.save(update_fields=["loyalty_points"])

    CartItem.objects.filter(user=request.user).delete()

    resp = {"order_id": order.id, "total": int(order.total)}
    if method != "cod":
        client = _razorpay_client()
        if client:
            rzp = client.order.create({"amount": int(order.total) * 100,
                                       "currency": "INR",
                                       "receipt": f"order_{order.id}"})
            order.razorpay_order_id = rzp["id"]
            order.save(update_fields=["razorpay_order_id"])
            resp["razorpay"] = {"key": settings.RAZORPAY_KEY_ID,
                                "order_id": rzp["id"],
                                "amount": rzp["amount"], "currency": "INR"}
        else:
            resp["demo_payment"] = True   # no keys configured — demo mode
    else:
        order.payment_status = "Pending"  # COD: collected on delivery
        order.save(update_fields=["payment_status"])
    return Response(resp, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def order_pay(request, order_id):
    """Confirm an online payment (Razorpay callback data, or demo mode)."""
    order = Order.objects.filter(id=order_id, user=request.user).first()
    if not order:
        return Response({"error": "Order not found."}, status=404)
    d = request.data
    client = _razorpay_client()
    if client and order.razorpay_order_id:
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": d.get("razorpay_order_id"),
                "razorpay_payment_id": d.get("razorpay_payment_id"),
                "razorpay_signature": d.get("razorpay_signature"),
            })
        except Exception:
            return Response({"error": "Payment verification failed."}, status=400)
        order.razorpay_payment_id = d.get("razorpay_payment_id", "")
    else:
        # demo mode
        order.razorpay_payment_id = "demo_" + "".join(
            random.choices(string.ascii_lowercase + string.digits, k=10))
    order.payment_status = "Paid"
    order.save()
    return Response({"ok": True, "payment_status": "Paid"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def orders_list(request):
    qs = Order.objects.filter(user=request.user).prefetch_related("items")
    return Response(OrderSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    order = Order.objects.filter(id=order_id, user=request.user).first()
    if not order:
        return Response({"error": "Order not found."}, status=404)
    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def order_cancel(request, order_id):
    order = Order.objects.filter(id=order_id, user=request.user).first()
    if not order:
        return Response({"error": "Order not found."}, status=404)
    if order.status in ("Out for Delivery", "Delivered", "Cancelled"):
        return Response({"error": f"Order can't be cancelled once {order.status.lower()}."},
                        status=400)
    # restore stock
    for it in order.items.all():
        if it.vegetable:
            it.vegetable.stock_kg += it.weight_kg * it.quantity
            it.vegetable.save(update_fields=["stock_kg"])
    # revert loyalty points
    user = request.user
    user.loyalty_points = max(0, user.loyalty_points - order.points_earned) \
        + order.points_redeemed
    user.save(update_fields=["loyalty_points"])
    order.status = "Cancelled"
    if order.payment_status == "Paid":
        order.payment_status = "Refunded"
    order.save()
    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def order_reorder(request, order_id):
    order = Order.objects.filter(id=order_id, user=request.user).first()
    if not order:
        return Response({"error": "Order not found."}, status=404)
    added, skipped = 0, []
    for it in order.items.all():
        veg = it.vegetable
        if not veg or not veg.is_active or veg.stock_kg < it.weight_kg:
            skipped.append(it.veg_name)
            continue
        item, created = CartItem.objects.get_or_create(
            user=request.user, vegetable=veg, weight_label=it.weight_label,
            defaults={"weight_kg": it.weight_kg, "quantity": it.quantity})
        if not created:
            item.quantity += it.quantity
            item.save()
        added += 1
    msg = f"{added} item(s) added to cart."
    if skipped:
        msg += f" Unavailable: {', '.join(skipped)}."
    count = CartItem.objects.filter(user=request.user).aggregate(c=Sum("quantity"))["c"] or 0
    return Response({"ok": True, "message": msg, "count": count})


# ==========================================================
#  FEEDBACK & COMPLAINTS
# ==========================================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def feedback_view(request):
    if request.method == "POST":
        d = request.data
        ftype = d.get("ftype", "Feedback")
        subject = (d.get("subject") or "").strip()
        message = (d.get("message") or "").strip()
        if ftype not in Feedback.TYPES:
            ftype = "Feedback"
        if not (subject and message):
            return Response({"error": "Please fill subject and message."}, status=400)
        order = None
        if d.get("order_id"):
            order = Order.objects.filter(id=d["order_id"], user=request.user).first()
        Feedback.objects.create(user=request.user, order=order, ftype=ftype,
                                subject=subject, message=message)
    qs = Feedback.objects.filter(user=request.user)
    return Response(FeedbackSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_feedback(request):
    st = request.GET.get("status", "")
    ft = request.GET.get("type", "")
    qs = Feedback.objects.select_related("user", "order").all()
    if st:
        qs = qs.filter(status=st)
    if ft:
        qs = qs.filter(ftype=ft)
    return Response(FeedbackSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_feedback_detail(request, fid):
    fb = Feedback.objects.filter(id=fid).first()
    if not fb:
        return Response({"error": "Not found."}, status=404)
    if "reply" in request.data:
        fb.admin_reply = (request.data.get("reply") or "").strip()
        fb.replied_at = timezone.now()
    if request.data.get("toggle_status"):
        fb.status = "Resolved" if fb.status == "Open" else "Open"
    if request.data.get("resolve"):
        fb.status = "Resolved"
    fb.save()
    return Response(FeedbackSerializer(fb).data)


# ==========================================================
#  ADMIN API
# ==========================================================
@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    today = timezone.localdate()
    orders = Order.objects.exclude(status="Cancelled")
    stats = {
        "vegetables": Vegetable.objects.filter(is_active=True).count(),
        "users": User.objects.filter(is_staff=False).count(),
        "orders": Order.objects.count(),
        "pending": Order.objects.exclude(status__in=["Delivered", "Cancelled"]).count(),
        "today_orders": Order.objects.filter(created_at__date=today).count(),
        "revenue": int(orders.aggregate(s=Sum("total"))["s"] or 0),
        "open_tickets": Feedback.objects.filter(status="Open").count(),
    }
    low_stock = Vegetable.objects.filter(
        is_active=True, stock_kg__lt=settings.LOW_STOCK_KG).order_by("stock_kg")
    recent = Order.objects.all()[:8]
    return Response({"stats": stats,
                     "low_stock": VegetableSerializer(low_stock, many=True).data,
                     "recent": OrderSerializer(recent, many=True).data,
                     "low_kg": settings.LOW_STOCK_KG})


def _dec(val, default="0"):
    """Coerce a form value to Decimal (form data arrives as strings)."""
    try:
        return Decimal(str(val))
    except Exception:
        return Decimal(default)


def _save_upload(file):
    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
    if ext not in ALLOWED_IMG_EXT:
        return None
    path = default_storage.save(os.path.join("uploads", file.name), file)
    return path.replace("\\", "/")


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_vegetables(request):
    if request.method == "POST":
        d = request.data
        img = None
        if request.FILES.get("image"):
            img = _save_upload(request.FILES["image"])
        veg = Vegetable.objects.create(
            name=d.get("name", "").strip(), hindi_name=d.get("hindi_name", "").strip(),
            category_id=d.get("category") or None,
            price_per_kg=_dec(d.get("price_per_kg")),
            discount_pct=int(d.get("discount_pct") or 0),
            stock_kg=_dec(d.get("stock_kg")),
            image=img or "img/veg/tomato.svg",
            description=d.get("description", "").strip(),
            nutrition=d.get("nutrition", "").strip(),
            is_seasonal=d.get("is_seasonal") in ("1", "true", True),
            is_active=d.get("is_active") in ("1", "true", True),
        )
        return Response(VegetableSerializer(veg).data, status=201)
    qs = Vegetable.objects.select_related("category").all()
    return Response(VegetableSerializer(qs, many=True).data)


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAdminUser])
def admin_vegetable_detail(request, veg_id):
    veg = Vegetable.objects.filter(id=veg_id).first()
    if not veg:
        return Response({"error": "Not found."}, status=404)
    if request.method == "DELETE":
        veg.is_active = False
        veg.save()
        return Response({"ok": True})
    if request.method == "POST":
        d = request.data
        if request.FILES.get("image"):
            img = _save_upload(request.FILES["image"])
            if img:
                veg.image = img
        veg.name = d.get("name", veg.name).strip()
        veg.hindi_name = d.get("hindi_name", veg.hindi_name).strip()
        veg.category_id = d.get("category") or veg.category_id
        veg.price_per_kg = _dec(d.get("price_per_kg"), str(veg.price_per_kg))
        veg.discount_pct = int(d.get("discount_pct") or 0)
        veg.stock_kg = _dec(d.get("stock_kg"))
        veg.description = d.get("description", veg.description).strip()
        veg.nutrition = d.get("nutrition", veg.nutrition).strip()
        veg.is_seasonal = d.get("is_seasonal") in ("1", "true", True)
        veg.is_active = d.get("is_active") in ("1", "true", True)
        veg.save()
    return Response(VegetableSerializer(veg).data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_orders(request):
    st = request.GET.get("status", "")
    qs = Order.objects.prefetch_related("items").all()
    if st:
        qs = qs.filter(status=st)
    return Response(OrderSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_order_status(request, order_id):
    st = request.data.get("status")
    order = Order.objects.filter(id=order_id).first()
    if not order or st not in Order.STATUSES:
        return Response({"error": "Invalid."}, status=400)
    order.status = st
    if st == "Delivered" and order.payment_method == "Cash on Delivery":
        order.payment_status = "Paid"
    order.save()
    return Response(OrderSerializer(order).data)


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_coupons(request):
    if request.method == "POST":
        code = (request.data.get("code") or "").strip().upper()
        if not code:
            return Response({"error": "Code required."}, status=400)
        if Coupon.objects.filter(code=code).exists():
            return Response({"error": "Coupon code already exists."}, status=400)
        Coupon.objects.create(code=code,
                              discount_pct=int(request.data.get("discount_pct") or 0),
                              min_order=request.data.get("min_order") or 0)
    return Response(CouponSerializer(Coupon.objects.order_by("-id"), many=True).data)


@api_view(["POST", "DELETE"])
@permission_classes([IsAdminUser])
def admin_coupon_detail(request, cid):
    c = Coupon.objects.filter(id=cid).first()
    if not c:
        return Response({"error": "Not found."}, status=404)
    if request.method == "DELETE":
        c.delete()
    else:  # toggle
        c.is_active = not c.is_active
        c.save()
    return Response(CouponSerializer(Coupon.objects.order_by("-id"), many=True).data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    users = (User.objects.filter(is_staff=False)
             .annotate(order_count=Count("orders"),
                       spent=Sum("orders__total"))
             .order_by("-id"))
    data = []
    for u in users:
        row = UserSerializer(u).data
        row["order_count"] = u.order_count
        row["spent"] = int(u.spent or 0)
        data.append(row)
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_settings(request):
    for key in ("banner_title", "banner_subtitle", "banner_offer"):
        if key in request.data:
            Setting.objects.update_or_create(skey=key,
                                             defaults={"svalue": request.data[key]})
    return Response({s.skey: s.svalue for s in Setting.objects.all()})
