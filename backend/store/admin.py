from django.contrib import admin

from .models import (Address, CartItem, Category, Coupon, Feedback, Order,
                     OrderItem, Review, Setting, User, Vegetable, WishlistItem)

admin.site.register([User, Category, Vegetable, CartItem, Coupon, Address,
                     Order, OrderItem, Review, WishlistItem, Setting, Feedback])
