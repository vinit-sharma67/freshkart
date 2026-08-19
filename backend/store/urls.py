from django.urls import path

from . import views

urlpatterns = [
    # auth
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    # catalog
    path("vegetables/", views.vegetables_list),
    path("vegetables/<int:veg_id>/", views.vegetable_detail),
    path("vegetables/<int:veg_id>/reviews/", views.review_create),
    path("categories/", views.categories_list),
    path("config/", views.store_config),
    # cart
    path("cart/", views.cart_view),
    path("cart/add/", views.cart_add),
    path("cart/add-many/", views.cart_add_many),
    path("cart/<int:item_id>/", views.cart_update),
    # wishlist / addresses
    path("wishlist/", views.wishlist_view),
    path("wishlist/toggle/", views.wishlist_toggle),
    path("addresses/", views.addresses_view),
    path("addresses/<int:addr_id>/", views.address_delete),
    # smart shopping
    path("recently-viewed/", views.recently_viewed),
    path("frequently-bought/", views.frequently_bought),
    path("chatbot/", views.chatbot),
    # orders
    path("orders/", views.orders_list),
    path("orders/create/", views.order_create),
    path("orders/<int:order_id>/", views.order_detail),
    path("orders/<int:order_id>/pay/", views.order_pay),
    path("orders/<int:order_id>/cancel/", views.order_cancel),
    path("orders/<int:order_id>/reorder/", views.order_reorder),
    # feedback
    path("feedback/", views.feedback_view),
    # admin
    path("admin/stats/", views.admin_stats),
    path("admin/feedback/", views.admin_feedback),
    path("admin/feedback/<int:fid>/", views.admin_feedback_detail),
    path("admin/vegetables/", views.admin_vegetables),
    path("admin/vegetables/<int:veg_id>/", views.admin_vegetable_detail),
    path("admin/orders/", views.admin_orders),
    path("admin/orders/<int:order_id>/status/", views.admin_order_status),
    path("admin/coupons/", views.admin_coupons),
    path("admin/coupons/<int:cid>/", views.admin_coupon_detail),
    path("admin/users/", views.admin_users),
    path("admin/settings/", views.admin_settings),
]
