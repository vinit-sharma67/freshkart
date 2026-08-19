from decimal import Decimal

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Customer account. `username` mirrors the mobile number for customers."""
    mobile = models.CharField(max_length=15, unique=True, null=True, blank=True)
    loyalty_points = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.get_full_name() or self.username


class Category(models.Model):
    name = models.CharField(max_length=60)
    emoji = models.CharField(max_length=10, default="🥬")

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["id"]

    def __str__(self):
        return self.name


class Vegetable(models.Model):
    name = models.CharField(max_length=100)
    hindi_name = models.CharField(max_length=100, blank=True)
    category = models.ForeignKey(Category, null=True, on_delete=models.SET_NULL,
                                 related_name="vegetables")
    price_per_kg = models.DecimalField(max_digits=8, decimal_places=2)
    discount_pct = models.PositiveIntegerField(default=0)
    stock_kg = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    # Either a bundled path like "img/veg/tomato.svg" or "uploads/<file>"
    image = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    nutrition = models.CharField(max_length=255, blank=True)
    is_seasonal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def sale_price_per_kg(self) -> Decimal:
        price = self.price_per_kg
        if self.discount_pct:
            price = price * (Decimal(100 - self.discount_pct) / 100)
        return price

    def weight_price(self, weight_kg) -> int:
        """Price for a given weight, rounded to the nearest rupee."""
        return int((self.sale_price_per_kg * Decimal(str(weight_kg))).quantize(Decimal("1")))


class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    vegetable = models.ForeignKey(Vegetable, on_delete=models.CASCADE)
    weight_label = models.CharField(max_length=20)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=3)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "vegetable", "weight_label")]
        ordering = ["-id"]


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    discount_pct = models.PositiveIntegerField()
    min_order = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=30, default="Home")   # Home / Office / Other
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    address = models.TextField()
    city = models.CharField(max_length=60, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-id"]


class Order(models.Model):
    STATUSES = settings.ORDER_STATUSES + ["Cancelled"]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    customer_name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    address = models.TextField()
    city = models.CharField(max_length=60, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    delivery_slot = models.CharField(max_length=60, blank=True)
    order_notes = models.CharField(max_length=255, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=30, blank=True)
    points_redeemed = models.PositiveIntegerField(default=0)
    points_earned = models.PositiveIntegerField(default=0)
    delivery_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=30, default="Cash on Delivery")
    payment_status = models.CharField(max_length=20, default="Pending")  # Pending / Paid / Refunded
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=30, default="Order Received")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    vegetable = models.ForeignKey(Vegetable, null=True, on_delete=models.SET_NULL)
    veg_name = models.CharField(max_length=100)
    weight_label = models.CharField(max_length=20)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=3)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # unit price


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vegetable = models.ForeignKey(Vegetable, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField()  # 1..5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "vegetable")]
        ordering = ["-id"]


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlist")
    vegetable = models.ForeignKey(Vegetable, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "vegetable")]
        ordering = ["-id"]


class RecentlyViewed(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recently_viewed")
    vegetable = models.ForeignKey(Vegetable, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("user", "vegetable")]
        ordering = ["-viewed_at"]


class Feedback(models.Model):
    """Customer feedback, complaints and suggestions — with admin replies."""
    TYPES = ["Complaint", "Feedback", "Suggestion"]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="feedback")
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL)
    ftype = models.CharField(max_length=20, default="Feedback")
    subject = models.CharField(max_length=120)
    message = models.TextField()
    status = models.CharField(max_length=20, default="Open")  # Open / Resolved
    admin_reply = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.ftype}: {self.subject}"


class Setting(models.Model):
    skey = models.CharField(max_length=50, unique=True)
    svalue = models.TextField(blank=True)

    def __str__(self):
        return self.skey
