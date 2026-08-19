from decimal import Decimal

from django.conf import settings
from django.db.models import Avg, Count
from rest_framework import serializers

from .models import (Address, CartItem, Category, Coupon, Feedback, Order,
                     OrderItem, Review, User, Vegetable)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "emoji"]


class VegetableSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    sale_per_kg = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Vegetable
        fields = ["id", "name", "hindi_name", "category", "category_name",
                  "price_per_kg", "discount_pct", "stock_kg", "image",
                  "description", "nutrition", "is_seasonal", "is_active",
                  "sale_per_kg", "options", "rating", "rating_count"]

    def get_sale_per_kg(self, veg):
        return int(veg.sale_price_per_kg.quantize(Decimal("1")))

    def get_options(self, veg):
        return [
            {"label": lbl, "kg": kg, "price": veg.weight_price(kg)}
            for lbl, kg in settings.WEIGHT_OPTIONS
            if Decimal(str(kg)) <= veg.stock_kg
        ]

    def _stats(self, veg):
        if not hasattr(veg, "_review_stats"):
            veg._review_stats = veg.reviews.aggregate(avg=Avg("rating"), n=Count("id"))
        return veg._review_stats

    def get_rating(self, veg):
        avg = self._stats(veg)["avg"]
        return round(avg, 1) if avg else None

    def get_rating_count(self, veg):
        return self._stats(veg)["n"]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "created_at", "user_name"]

    def get_user_name(self, r):
        return r.user.first_name or r.user.username


class CartItemSerializer(serializers.ModelSerializer):
    vegetable = VegetableSerializer(read_only=True)
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "vegetable", "weight_label", "weight_kg", "quantity",
                  "unit_price", "line_total"]

    def get_unit_price(self, item):
        return item.vegetable.weight_price(item.weight_kg)

    def get_line_total(self, item):
        return self.get_unit_price(item) * item.quantity


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "label", "name", "mobile", "address", "city", "pincode", "is_default"]


class OrderItemSerializer(serializers.ModelSerializer):
    vegetable_id = serializers.IntegerField(source="vegetable.id", read_only=True, default=None)
    image = serializers.CharField(source="vegetable.image", read_only=True, default="")

    class Meta:
        model = OrderItem
        fields = ["id", "vegetable_id", "veg_name", "weight_label", "weight_kg",
                  "quantity", "price", "image"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    step = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "customer_name", "mobile", "address", "city", "pincode",
                  "delivery_slot", "order_notes", "subtotal", "discount",
                  "coupon_code", "points_redeemed", "points_earned",
                  "delivery_charge", "total", "payment_method", "payment_status",
                  "status", "created_at", "items", "step"]

    def get_step(self, order):
        try:
            return settings.ORDER_STATUSES.index(order.status)
        except ValueError:
            return -1  # Cancelled


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ["id", "code", "discount_pct", "min_order", "is_active", "created_at"]


class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_mobile = serializers.CharField(source="user.mobile", read_only=True, default="")
    order_id = serializers.IntegerField(source="order.id", read_only=True, default=None)

    class Meta:
        model = Feedback
        fields = ["id", "ftype", "subject", "message", "status", "admin_reply",
                  "created_at", "replied_at", "user_name", "user_mobile", "order_id"]

    def get_user_name(self, f):
        return f.user.first_name or f.user.username


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name")

    class Meta:
        model = User
        fields = ["id", "name", "mobile", "email", "loyalty_points", "is_staff", "date_joined"]
