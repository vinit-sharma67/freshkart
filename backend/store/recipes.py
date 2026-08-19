"""
FreshKart recipe knowledge base.
Each recipe lists store vegetables (matched by exact name from the catalog),
pantry staples, and short cooking steps. The chatbot serves these when a
user asks about a dish.
"""

RECIPES = [
    {
        "aliases": ["palak paneer", "paneer palak", "spinach paneer"],
        "name": "Palak Paneer", "emoji": "🍛", "time": "35 min", "serves": 3,
        "description": "Creamy spinach gravy with soft paneer cubes — a North-Indian classic.",
        "veggies": [("Spinach", "500 g"), ("Tomato", "250 g"), ("Onion", "250 g"),
                    ("Green Chilli", "250 g"), ("Ginger", "250 g"), ("Garlic", "250 g")],
        "pantry": ["Paneer 200 g", "Fresh cream", "Butter", "Cumin seeds",
                   "Garam masala", "Salt"],
        "steps": [
            "Blanch spinach in boiling water for 2 min, then blend to a smooth purée.",
            "Sauté cumin, garlic, ginger and onion in butter till golden.",
            "Add chopped tomato and green chilli; cook till soft, then add the purée.",
            "Simmer 5 min with garam masala; add paneer cubes and cream.",
            "Serve hot with roti or naan.",
        ],
    },
    {
        "aliases": ["aloo gobi", "alu gobi", "aloo gobhi", "potato cauliflower"],
        "name": "Aloo Gobi", "emoji": "🥘", "time": "30 min", "serves": 3,
        "description": "Dry-spiced potato and cauliflower sabzi, perfect with roti.",
        "veggies": [("Potato", "500 g"), ("Cauliflower", "500 g"), ("Tomato", "250 g"),
                    ("Ginger", "250 g"), ("Coriander", "250 g")],
        "pantry": ["Turmeric", "Cumin seeds", "Coriander powder", "Oil", "Salt"],
        "steps": [
            "Heat oil, splutter cumin seeds, add ginger and sauté.",
            "Add potato cubes; cook covered 5 min.",
            "Add cauliflower florets, turmeric and spices; cook covered till tender.",
            "Toss in chopped tomato for the last 5 min.",
            "Garnish with fresh coriander and serve.",
        ],
    },
    {
        "aliases": ["pav bhaji", "pavbhaji", "bhaji pav"],
        "name": "Pav Bhaji", "emoji": "🍞", "time": "45 min", "serves": 4,
        "description": "Mumbai-style mashed vegetable curry served with buttered pav.",
        "veggies": [("Potato", "500 g"), ("Tomato", "500 g"), ("Onion", "500 g"),
                    ("Capsicum", "250 g"), ("Green Peas", "250 g"),
                    ("Cauliflower", "250 g"), ("Lemon", "250 g"), ("Coriander", "250 g")],
        "pantry": ["Pav buns", "Butter", "Pav bhaji masala", "Red chilli powder", "Salt"],
        "steps": [
            "Boil potato, peas and cauliflower; mash roughly.",
            "Sauté onion, capsicum and tomato in butter till soft.",
            "Add mashed veggies, pav bhaji masala and water; simmer 15 min, mashing well.",
            "Finish with butter, lemon juice and coriander.",
            "Toast pav in butter and serve with onion rings.",
        ],
    },
    {
        "aliases": ["veg biryani", "biryani", "pulao", "pulav", "veg pulao"],
        "name": "Veg Biryani", "emoji": "🍚", "time": "50 min", "serves": 4,
        "description": "Fragrant basmati rice layered with spiced garden vegetables.",
        "veggies": [("Carrot", "250 g"), ("Green Peas", "250 g"), ("Cauliflower", "250 g"),
                    ("Potato", "250 g"), ("Onion", "500 g"), ("Mint", "250 g"),
                    ("Coriander", "250 g")],
        "pantry": ["Basmati rice 2 cups", "Yogurt", "Biryani masala", "Whole spices",
                   "Ghee", "Saffron (optional)"],
        "steps": [
            "Soak rice 20 min; par-boil with whole spices.",
            "Fry sliced onion till golden; keep half for garnish.",
            "Cook veggies with yogurt and biryani masala for 10 min.",
            "Layer rice and veggies, top with mint, coriander, fried onion and saffron milk.",
            "Steam (dum) on low heat 15 min. Serve with raita.",
        ],
    },
    {
        "aliases": ["bhindi masala", "bhindi", "okra", "lady finger fry", "bhindi fry"],
        "name": "Bhindi Masala", "emoji": "🫕", "time": "25 min", "serves": 3,
        "description": "Crispy okra tossed with onion, tomato and tangy spices.",
        "veggies": [("Lady Finger", "500 g"), ("Onion", "250 g"), ("Tomato", "250 g")],
        "pantry": ["Amchur (dry mango powder)", "Coriander powder", "Turmeric", "Oil"],
        "steps": [
            "Wash and fully dry bhindi; cut into 1-inch pieces.",
            "Fry bhindi on high heat till crisp; set aside.",
            "Sauté onion, then tomato with spices.",
            "Return bhindi, toss with amchur, cook 3 min uncovered.",
        ],
    },
    {
        "aliases": ["baingan bharta", "bharta", "baingan", "brinjal bharta"],
        "name": "Baingan Bharta", "emoji": "🍆", "time": "40 min", "serves": 3,
        "description": "Smoky fire-roasted brinjal mash with garlic and coriander.",
        "veggies": [("Brinjal", "500 g"), ("Onion", "250 g"), ("Tomato", "250 g"),
                    ("Garlic", "250 g"), ("Green Chilli", "250 g"), ("Coriander", "250 g")],
        "pantry": ["Mustard oil", "Cumin seeds", "Red chilli powder", "Salt"],
        "steps": [
            "Roast whole brinjal on open flame till skin chars; peel and mash.",
            "Sauté garlic, onion and green chilli in mustard oil.",
            "Add tomato; cook till oil separates.",
            "Mix in mashed brinjal; cook 10 min. Garnish with coriander.",
        ],
    },
    {
        "aliases": ["tomato soup", "tamatar soup"],
        "name": "Tomato Soup", "emoji": "🍅", "time": "25 min", "serves": 2,
        "description": "Silky restaurant-style tomato soup with a buttery finish.",
        "veggies": [("Tomato", "500 g"), ("Carrot", "250 g"), ("Garlic", "250 g"),
                    ("Ginger", "250 g")],
        "pantry": ["Butter", "Black pepper", "Fresh cream", "Bread croutons"],
        "steps": [
            "Sauté garlic, ginger, carrot and tomato in butter for 5 min.",
            "Add 2 cups water; simmer 15 min, then blend smooth.",
            "Strain, season with pepper and salt, finish with cream.",
            "Serve hot with croutons.",
        ],
    },
    {
        "aliases": ["sweet corn soup", "corn soup"],
        "name": "Sweet Corn Soup", "emoji": "🌽", "time": "25 min", "serves": 2,
        "description": "Comforting Indo-Chinese soup with crunchy vegetables.",
        "veggies": [("Sweet Corn", "500 g"), ("Carrot", "250 g"), ("Cabbage", "250 g"),
                    ("Ginger", "250 g")],
        "pantry": ["Corn flour", "White pepper", "Vinegar", "Salt"],
        "steps": [
            "Blend half the corn with water; keep the rest whole.",
            "Boil corn purée with finely chopped carrot, cabbage and ginger.",
            "Thicken with corn-flour slurry; simmer 5 min.",
            "Season with white pepper and a dash of vinegar.",
        ],
    },
    {
        "aliases": ["veg manchurian", "manchurian", "gobi manchurian"],
        "name": "Veg Manchurian", "emoji": "🥡", "time": "40 min", "serves": 3,
        "description": "Crispy veggie balls tossed in a garlicky Indo-Chinese sauce.",
        "veggies": [("Cabbage", "500 g"), ("Carrot", "250 g"), ("Capsicum", "250 g"),
                    ("Ginger", "250 g"), ("Garlic", "250 g")],
        "pantry": ["Corn flour", "Maida", "Soy sauce", "Chilli sauce", "Spring onion (optional)"],
        "steps": [
            "Mix grated cabbage and carrot with corn flour and maida; shape into balls.",
            "Deep-fry balls till golden and crisp.",
            "Sauté ginger, garlic and capsicum; add sauces and a corn-flour slurry.",
            "Toss the balls in the sauce just before serving.",
        ],
    },
    {
        "aliases": ["gajar halwa", "gajar ka halwa", "carrot halwa", "halwa"],
        "name": "Gajar Ka Halwa", "emoji": "🍮", "time": "60 min", "serves": 4,
        "description": "Slow-cooked winter dessert of grated carrots, milk and ghee.",
        "veggies": [("Carrot", "1 kg")],
        "pantry": ["Full-cream milk 1 L", "Sugar", "Ghee", "Cardamom", "Cashews & raisins"],
        "steps": [
            "Grate carrots; cook in ghee for 10 min.",
            "Add milk; simmer till fully absorbed, stirring often.",
            "Add sugar and cardamom; cook till thick and glossy.",
            "Garnish with ghee-fried cashews and raisins.",
        ],
    },
    {
        "aliases": ["lauki sabzi", "lauki", "dudhi", "bottle gourd curry", "lauki ki sabzi"],
        "name": "Lauki Sabzi", "emoji": "🥣", "time": "25 min", "serves": 3,
        "description": "Light, homely bottle-gourd curry — easy on the stomach.",
        "veggies": [("Bottle Gourd", "500 g"), ("Tomato", "250 g"), ("Ginger", "250 g")],
        "pantry": ["Cumin seeds", "Turmeric", "Coriander powder", "Oil"],
        "steps": [
            "Splutter cumin in oil; add ginger and tomato.",
            "Add cubed lauki, turmeric and salt.",
            "Cook covered with a splash of water till soft (12–15 min).",
        ],
    },
    {
        "aliases": ["methi thepla", "thepla", "methi paratha"],
        "name": "Methi Thepla", "emoji": "🫓", "time": "30 min", "serves": 4,
        "description": "Soft Gujarati flatbreads packed with fresh fenugreek.",
        "veggies": [("Fenugreek", "250 g"), ("Green Chilli", "250 g"), ("Ginger", "250 g")],
        "pantry": ["Wheat flour", "Yogurt", "Turmeric", "Sesame seeds", "Oil"],
        "steps": [
            "Knead flour with chopped methi, spices, yogurt and oil.",
            "Rest the dough 15 min; roll thin theplas.",
            "Roast on a tawa with oil till golden spots appear.",
            "Great with pickle and chai — stays fresh for travel!",
        ],
    },
    {
        "aliases": ["green salad", "salad", "kachumber"],
        "name": "Garden Green Salad", "emoji": "🥗", "time": "10 min", "serves": 2,
        "description": "Crunchy no-cook salad with a lemon-mint dressing.",
        "veggies": [("Cucumber", "250 g"), ("Tomato", "250 g"), ("Carrot", "250 g"),
                    ("Beetroot", "250 g"), ("Onion", "250 g"), ("Lemon", "250 g"),
                    ("Mint", "250 g")],
        "pantry": ["Chaat masala", "Black salt", "Olive oil (optional)"],
        "steps": [
            "Chop all vegetables into thin rounds or cubes.",
            "Whisk lemon juice, chaat masala and mint.",
            "Toss everything together just before serving.",
        ],
    },
    {
        "aliases": ["dal palak", "palak dal", "spinach dal"],
        "name": "Dal Palak", "emoji": "🍲", "time": "35 min", "serves": 3,
        "description": "Protein-rich lentils simmered with fresh spinach and garlic tadka.",
        "veggies": [("Spinach", "250 g"), ("Tomato", "250 g"), ("Garlic", "250 g"),
                    ("Green Chilli", "250 g")],
        "pantry": ["Toor dal 1 cup", "Ghee", "Cumin seeds", "Turmeric", "Red chilli"],
        "steps": [
            "Pressure-cook dal with turmeric till soft.",
            "Add chopped spinach and tomato; simmer 8 min.",
            "Temper garlic, cumin and red chilli in ghee; pour over the dal.",
        ],
    },
    {
        "aliases": ["mushroom masala", "mushroom curry", "mushroom"],
        "name": "Mushroom Masala", "emoji": "🍄", "time": "30 min", "serves": 3,
        "description": "Button mushrooms in a rich onion-tomato gravy.",
        "veggies": [("Mushroom", "500 g"), ("Onion", "250 g"), ("Tomato", "250 g"),
                    ("Ginger", "250 g"), ("Garlic", "250 g")],
        "pantry": ["Fresh cream", "Kasuri methi", "Garam masala", "Oil"],
        "steps": [
            "Sauté sliced mushrooms till golden; set aside.",
            "Cook onion-ginger-garlic paste till browned; add tomato purée.",
            "Simmer with spices, return mushrooms, finish with cream and kasuri methi.",
        ],
    },
    {
        "aliases": ["matar paneer", "mutter paneer", "peas paneer"],
        "name": "Matar Paneer", "emoji": "🧀", "time": "35 min", "serves": 3,
        "description": "Sweet green peas and paneer in a classic tomato gravy.",
        "veggies": [("Green Peas", "500 g"), ("Tomato", "500 g"), ("Onion", "250 g"),
                    ("Ginger", "250 g")],
        "pantry": ["Paneer 200 g", "Fresh cream", "Garam masala", "Kasuri methi"],
        "steps": [
            "Blend onion, tomato and ginger; cook the paste in oil till glossy.",
            "Add peas and a cup of water; simmer 10 min.",
            "Add paneer cubes, garam masala and cream; simmer 5 min.",
        ],
    },
    {
        "aliases": ["raita", "cucumber raita"],
        "name": "Cucumber Raita", "emoji": "🥒", "time": "10 min", "serves": 3,
        "description": "Cooling yogurt side with cucumber and roasted cumin.",
        "veggies": [("Cucumber", "250 g"), ("Mint", "250 g"), ("Coriander", "250 g"),
                    ("Onion", "250 g")],
        "pantry": ["Yogurt 2 cups", "Roasted cumin powder", "Black salt"],
        "steps": [
            "Whisk yogurt smooth with a little water.",
            "Stir in grated cucumber, chopped onion, mint and coriander.",
            "Top with roasted cumin and black salt; chill before serving.",
        ],
    },
    {
        "aliases": ["karela fry", "karela", "bitter gourd fry"],
        "name": "Crispy Karela Fry", "emoji": "🥬", "time": "30 min", "serves": 2,
        "description": "Thin-sliced bitter gourd fried crisp with besan and spices.",
        "veggies": [("Bitter Gourd", "500 g"), ("Onion", "250 g")],
        "pantry": ["Besan (gram flour)", "Rice flour", "Turmeric", "Oil"],
        "steps": [
            "Slice karela thin; salt for 15 min, then squeeze out the juice.",
            "Toss with besan, rice flour and spices.",
            "Shallow-fry with sliced onion till deeply crisp.",
        ],
    },
    {
        "aliases": ["pumpkin soup", "kaddu soup"],
        "name": "Creamy Pumpkin Soup", "emoji": "🎃", "time": "30 min", "serves": 2,
        "description": "Velvety roasted-pumpkin soup with garlic and pepper.",
        "veggies": [("Pumpkin", "500 g"), ("Garlic", "250 g"), ("Ginger", "250 g")],
        "pantry": ["Butter", "Black pepper", "Fresh cream"],
        "steps": [
            "Sauté garlic, ginger and pumpkin cubes in butter.",
            "Add 2 cups water; simmer till soft, then blend silky-smooth.",
            "Season, finish with cream and cracked pepper.",
        ],
    },
]


def find_recipe(message: str):
    """Return the best-matching recipe for a message, or None."""
    msg = message.lower()
    best, best_len = None, 0
    for r in RECIPES:
        for a in r["aliases"]:
            if a in msg and len(a) > best_len:
                best, best_len = r, len(a)
    return best


def all_dish_names():
    return [f'{r["emoji"]} {r["name"]}' for r in RECIPES]
