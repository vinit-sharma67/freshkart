"""Seed the FreshKart database: admin user, categories, 26 vegetables,
coupons and homepage banner. Safe to re-run (idempotent)."""
from django.core.management.base import BaseCommand

from store.models import Category, Coupon, Setting, User, Vegetable

CATEGORIES = [
    ("Leafy Greens", "🥬"), ("Root Vegetables", "🥕"), ("Gourds", "🥒"),
    ("Daily Essentials", "🧅"), ("Exotic", "🥦"), ("Herbs & Seasoning", "🌿"),
]

# name, hindi, cat#, price, disc%, stock, img, description, nutrition, seasonal
VEGETABLES = [
    ("Tomato", "Tamatar / ટમેટા", 4, 40, 10, 80, "tomato",
     "Farm-fresh red tomatoes, perfect for curries, salads and chutneys.",
     "Rich in Vitamin C & Lycopene", 0),
    ("Potato", "Aloo / બટાકા", 2, 30, 0, 150, "potato",
     "All-purpose potatoes for sabzi, fries and parathas.",
     "Good source of Potassium & Carbs", 0),
    ("Onion", "Pyaz / ડુંગળી", 4, 35, 5, 120, "onion",
     "Pink Nashik onions with strong flavour.",
     "Contains antioxidants & Vitamin B6", 0),
    ("Carrot", "Gajar / ગાજર", 2, 50, 10, 60, "carrot",
     "Sweet red carrots — great for salads, juice and gajar halwa.",
     "High in Vitamin A & fibre", 1),
    ("Cucumber", "Kheera / કાકડી", 3, 35, 0, 70, "cucumber",
     "Crisp green cucumbers, ideal for salads and raita.",
     "95% water, keeps you hydrated", 0),
    ("Spinach", "Palak / પાલક", 1, 60, 15, 25, "spinach",
     "Tender palak leaves for palak paneer, dal and soups.",
     "Iron, Calcium & Vitamin K", 1),
    ("Cauliflower", "Phool Gobi / ફ્લાવર", 5, 45, 10, 40, "cauliflower",
     "Fresh white cauliflower florets for gobi masala.",
     "Vitamin C & fibre rich", 1),
    ("Capsicum", "Shimla Mirch / કેપ્સિકમ", 5, 80, 0, 30, "capsicum",
     "Crunchy green capsicum for stir-fries and pizza.",
     "Vitamin C powerhouse", 0),
    ("Brinjal", "Baingan / રીંગણ", 3, 40, 0, 45, "brinjal",
     "Purple brinjals for bharta and Gujarati shaak.",
     "Fibre & antioxidants", 0),
    ("Lady Finger", "Bhindi / ભીંડા", 3, 55, 10, 35, "ladyfinger",
     "Tender bhindi for crispy fry and masala bhindi.",
     "Folate & Vitamin C", 0),
    ("Cabbage", "Patta Gobi / કોબીજ", 1, 30, 0, 55, "cabbage",
     "Fresh green cabbage for sabzi, salads and momos.",
     "Vitamin K & C", 0),
    ("Green Chilli", "Hari Mirch / લીલાં મરચાં", 6, 90, 0, 15, "greenchilli",
     "Spicy green chillies to fire up any dish.",
     "Capsaicin & Vitamin C", 0),
    ("Ginger", "Adrak / આદુ", 6, 120, 5, 20, "ginger",
     "Aromatic fresh ginger for chai and curries.",
     "Anti-inflammatory properties", 0),
    ("Garlic", "Lahsun / લસણ", 6, 150, 0, 18, "garlic",
     "Strong desi garlic pods.",
     "Allicin — immunity booster", 0),
    ("Coriander", "Dhaniya / કોથમીર", 1, 80, 20, 12, "coriander",
     "Fragrant dhaniya bunches for garnishing.",
     "Vitamin A, C & K", 0),
    ("Mint", "Pudina / ફુદીનો", 1, 100, 0, 8, "mint",
     "Cool pudina for chutney and mojito.",
     "Aids digestion", 1),
    ("Beetroot", "Chukandar / બીટ", 2, 45, 0, 30, "beetroot",
     "Deep red beetroots for salads and juice.",
     "Iron & folate rich", 0),
    ("Bottle Gourd", "Lauki / દૂધી", 3, 30, 0, 40, "bottlegourd",
     "Fresh dudhi for lauki sabzi, halwa and muthiya.",
     "Low calorie, high water", 0),
    ("Bitter Gourd", "Karela / કારેલા", 3, 55, 0, 25, "bittergourd",
     "Fresh karela — bitter but healthy.",
     "Helps manage blood sugar", 0),
    ("Pumpkin", "Kaddu / કોળું", 3, 25, 0, 60, "pumpkin",
     "Sweet yellow pumpkin for sabzi and soup.",
     "Vitamin A & fibre", 1),
    ("Sweet Corn", "Bhutta / મકાઈ", 5, 60, 10, 35, "sweetcorn",
     "Juicy sweet corn kernels and cobs.",
     "Fibre & B vitamins", 1),
    ("Green Peas", "Matar / વટાણા", 5, 70, 15, 28, "peas",
     "Sweet winter matar for pulao and curry.",
     "Plant protein & fibre", 1),
    ("Mushroom", "Khumbi / મશરૂમ", 5, 220, 10, 10, "mushroom",
     "Fresh button mushrooms, cleaned and packed.",
     "Protein & Vitamin D", 0),
    ("Broccoli", "Brokli / બ્રોકલી", 5, 180, 15, 12, "broccoli",
     "Exotic green broccoli florets.",
     "Vitamin C, K & fibre", 0),
    ("Lemon", "Nimbu / લીંબુ", 6, 80, 0, 22, "lemon",
     "Juicy lemons for nimbu pani and seasoning.",
     "Vitamin C boost", 0),
    ("Fenugreek", "Methi / મેથી", 1, 70, 10, 15, "fenugreek",
     "Fresh methi leaves for theplas and methi aloo.",
     "Iron & fibre", 1),
]

COUPONS = [("FRESH10", 10, 150), ("VEGGIE20", 20, 400), ("WELCOME15", 15, 250)]

SETTINGS = [
    ("banner_title", "Farm-fresh vegetables, delivered to your door"),
    ("banner_subtitle", "Handpicked every morning from local farms. Free delivery above ₹199."),
    ("banner_offer", "Use code FRESH10 for 10% off"),
]


class Command(BaseCommand):
    help = "Seed FreshKart demo data (idempotent)."

    def handle(self, *args, **opts):
        # admin
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", password="admin123",
                                          first_name="Admin")
            self.stdout.write("Created admin user (admin / admin123)")

        # categories
        cats = {}
        for i, (name, emoji) in enumerate(CATEGORIES, start=1):
            cat, _ = Category.objects.get_or_create(name=name, defaults={"emoji": emoji})
            cats[i] = cat

        # vegetables
        created = 0
        for (name, hindi, cat_i, price, disc, stock, img, desc, nutr, seas) in VEGETABLES:
            _, was_created = Vegetable.objects.get_or_create(
                name=name,
                defaults=dict(hindi_name=hindi, category=cats[cat_i],
                              price_per_kg=price, discount_pct=disc, stock_kg=stock,
                              image=f"img/veg/{img}.svg", description=desc,
                              nutrition=nutr, is_seasonal=bool(seas)))
            created += was_created
        self.stdout.write(f"Vegetables: {created} created, "
                          f"{Vegetable.objects.count()} total")

        # coupons
        for code, pct, min_order in COUPONS:
            Coupon.objects.get_or_create(code=code, defaults={
                "discount_pct": pct, "min_order": min_order})

        # banner
        for k, v in SETTINGS:
            Setting.objects.get_or_create(skey=k, defaults={"svalue": v})

        self.stdout.write(self.style.SUCCESS("Seed complete."))
