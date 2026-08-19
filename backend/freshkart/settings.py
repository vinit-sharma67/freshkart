"""
FreshKart — Django settings.
Dev-friendly defaults: SQLite database, media served locally.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("FK_SECRET_KEY", "freshkart-dev-secret-change-me")
DEBUG = os.environ.get("FK_DEBUG", "1") == "1"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "store",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "freshkart.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "freshkart.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "store.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 4}},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "UNAUTHENTICATED_USER": "django.contrib.auth.models.AnonymousUser",
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------- FreshKart store settings ----------------
FREE_DELIVERY_ABOVE = 199     # Rs
DELIVERY_CHARGE = 30          # Rs
LOW_STOCK_KG = 5              # admin low-stock alert threshold
LOYALTY_EARN_PER_RS = 50      # earn 1 point per Rs 50 spent
LOYALTY_MAX_REDEEM_PCT = 10   # points can cover at most 10% of subtotal

DELIVERY_SLOTS = [
    "Today, 6 PM - 9 PM",
    "Tomorrow, 7 AM - 10 AM",
    "Tomorrow, 10 AM - 1 PM",
    "Tomorrow, 4 PM - 7 PM",
    "Tomorrow, 7 PM - 9 PM",
]

WEIGHT_OPTIONS = [
    ("250 g", 0.25),
    ("500 g", 0.5),
    ("1 kg", 1.0),
    ("2 kg", 2.0),
    ("5 kg", 5.0),
]

ORDER_STATUSES = ["Order Received", "Packed", "Out for Delivery", "Delivered"]

# Razorpay (leave blank to run online payments in demo mode)
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
