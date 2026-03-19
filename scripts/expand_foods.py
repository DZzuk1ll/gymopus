"""
Expand the food database using data from:
1. Sanotsu/china-food-composition-data (GitHub) - China Food Composition Table 6th Ed.
2. USDA FoodData Central / HK CFS - prepared Chinese dishes

Sources:
- https://github.com/Sanotsu/china-food-composition-data
- https://fdc.nal.usda.gov/
- https://www.cfs.gov.hk/english/programme/programme_rafs/programme_rafs_n_01_01_nvic.html
"""

import csv
import json
import os
from pathlib import Path

DATA_DIR = Path("/tmp/food_data")
EXISTING_CSV = Path(__file__).resolve().parent.parent / "knowledge-base" / "foods" / "chinese_food_composition.csv"
OUTPUT_CSV = EXISTING_CSV

# Category mapping from file prefix to our category system
FILE_CATEGORY_MAP = {
    "grain_": "grain",
    "meat_": "meat",
    "poultry_": "poultry",
    "seafood_": "seafood",
    "egg_": "egg",
    "bean_": "legume",
    "veg_": "vegetable",
    "dairy_": "dairy",
    "nuts_": "nut",
    "tuber_": "grain",
}

# Fitness-relevant food selection criteria
# We want representative items, not every variant
SKIP_KEYWORDS = [
    "罐装", "罐头", "腌制", "咸", "糟", "酒",  # preserved/pickled
    "婴儿", "婴幼儿",  # baby food
    "奶粉",  # milk powder (keep protein powder though)
    "内脏",  # organ meats (keep some)
]


def parse_val(v: str) -> float | None:
    """Parse a string value to float, handling special markers."""
    if not v or v.strip() in ("", "-", "--", "…", "Tr", "0(Tr)"):
        return None
    # Remove parenthetical notes
    v = v.strip().split("(")[0].split("（")[0].strip()
    try:
        return float(v)
    except ValueError:
        return None


def should_include(food_name: str) -> bool:
    """Filter out non-fitness-relevant items."""
    for kw in SKIP_KEYWORDS:
        if kw in food_name:
            return False
    return True


# Common English translations for Chinese food categories
ZH_TO_EN = {
    # Poultry
    "鸡（代表值）": "Chicken (representative)",
    "鸡胸肉": "Chicken Breast",
    "鸡腿肉": "Chicken Thigh",
    "鸡翅": "Chicken Wing",
    "鸡蛋": "Chicken Egg",
    "鸭肉": "Duck Meat",
    "鹅肉": "Goose Meat",
    "火鸡腿": "Turkey Leg",
    # Beef
    "牛肉（代表值）": "Beef (representative)",
    "牛里脊": "Beef Tenderloin",
    "牛腱肉": "Beef Shank",
    "牛腩": "Beef Brisket",
    "牛肉干": "Beef Jerky",
    # Pork
    "猪肉（代表值）": "Pork (representative)",
    "猪里脊肉": "Pork Tenderloin",
    "猪瘦肉": "Lean Pork",
    "猪排骨": "Pork Ribs",
    "火腿": "Ham",
    # Seafood
    "鲈鱼": "Sea Bass",
    "三文鱼": "Salmon",
    "金枪鱼": "Tuna",
    "虾（代表值）": "Shrimp (representative)",
    "基围虾": "White Shrimp",
    # Grains
    "大米（代表值）": "Rice (representative)",
    "糙米": "Brown Rice",
    "小麦粉（标准粉）": "Wheat Flour (standard)",
    "全麦粉": "Whole Wheat Flour",
    "燕麦片": "Oats",
    "小米": "Millet",
    "玉米（鲜）": "Fresh Corn",
    "藜麦": "Quinoa",
    # Beans
    "黄豆": "Soybeans",
    "黑豆": "Black Beans",
    "绿豆": "Mung Beans",
    "红豆": "Red Beans",
    "豆腐": "Tofu",
    "豆浆": "Soy Milk",
    # Vegetables
    "西兰花": "Broccoli",
    "菠菜": "Spinach",
    "芹菜": "Celery",
    "番茄": "Tomato",
    "黄瓜": "Cucumber",
    "胡萝卜": "Carrot",
    "洋葱": "Onion",
    "蘑菇": "Mushroom",
    # Dairy
    "牛奶（代表值）": "Milk (representative)",
    "酸奶": "Yogurt",
    "奶酪": "Cheese",
    # Nuts
    "花生": "Peanuts",
    "核桃": "Walnuts",
    "杏仁": "Almonds",
    "腰果": "Cashews",
    # Eggs
    "鸡蛋（代表值）": "Chicken Egg (representative)",
    "鸡蛋白": "Egg White",
    "鸡蛋黄": "Egg Yolk",
    "鹌鹑蛋": "Quail Egg",
    # Tubers
    "马铃薯": "Potato",
    "红薯": "Sweet Potato",
    "山药": "Chinese Yam",
    "芋头": "Taro",
}

# Prepared Chinese dishes (from USDA FoodData Central & HK CFS, per 100g)
PREPARED_DISHES = [
    {"name_zh": "宫保鸡丁", "name_en": "Kung Pao Chicken", "category": "dish", "calories_kcal": 129, "protein_g": 9.8, "fat_g": 7.0, "carbs_g": 6.9, "fiber_g": 1.5, "sodium_mg": 402, "potassium_mg": 218, "calcium_mg": 20, "iron_mg": 0.76, "vitamin_a_ug": 65, "vitamin_c_mg": 7.1, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "糖醋鸡", "name_en": "Sweet and Sour Chicken", "category": "dish", "calories_kcal": 250, "protein_g": 10.1, "fat_g": 12.6, "carbs_g": 23.8, "fiber_g": 1.0, "sodium_mg": 246, "potassium_mg": 158, "calcium_mg": 45, "iron_mg": 2.1, "vitamin_a_ug": 18, "vitamin_c_mg": 2.4, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "左宗棠鸡", "name_en": "General Tso's Chicken", "category": "dish", "calories_kcal": 295, "protein_g": 12.9, "fat_g": 16.4, "carbs_g": 24.0, "fiber_g": 0.9, "sodium_mg": 435, "potassium_mg": 201, "calcium_mg": 12, "iron_mg": 1.2, "vitamin_a_ug": 11, "vitamin_c_mg": 1.6, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "芝麻鸡", "name_en": "Sesame Chicken", "category": "dish", "calories_kcal": 293, "protein_g": 14.3, "fat_g": 14.3, "carbs_g": 26.9, "fiber_g": 0.7, "sodium_mg": 482, "potassium_mg": 204, "calcium_mg": 12, "iron_mg": 1.1, "vitamin_a_ug": 83, "vitamin_c_mg": 1.0, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "牛肉炒蔬菜", "name_en": "Beef and Vegetables Stir-fry", "category": "dish", "calories_kcal": 105, "protein_g": 7.1, "fat_g": 5.3, "carbs_g": 7.3, "fiber_g": 1.5, "sodium_mg": 409, "potassium_mg": 204, "calcium_mg": 22, "iron_mg": 1.1, "vitamin_a_ug": 63, "vitamin_c_mg": 12, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "鸡肉炒蔬菜", "name_en": "Chicken and Vegetables Stir-fry", "category": "dish", "calories_kcal": 95, "protein_g": 8.2, "fat_g": 4.6, "carbs_g": 5.4, "fiber_g": 0.9, "sodium_mg": 413, "potassium_mg": 185, "calcium_mg": 20, "iron_mg": 0.56, "vitamin_a_ug": 56, "vitamin_c_mg": 8.1, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "虾仁炒蔬菜", "name_en": "Shrimp and Vegetables Stir-fry", "category": "dish", "calories_kcal": 78, "protein_g": 5.9, "fat_g": 4.0, "carbs_g": 4.5, "fiber_g": 1.4, "sodium_mg": 375, "potassium_mg": 192, "calcium_mg": 36, "iron_mg": 0.72, "vitamin_a_ug": 66, "vitamin_c_mg": 11.3, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "橙汁鸡", "name_en": "Orange Chicken", "category": "dish", "calories_kcal": 262, "protein_g": 14.5, "fat_g": 12.7, "carbs_g": 22.5, "fiber_g": 0.8, "sodium_mg": 553, "potassium_mg": 209, "calcium_mg": 14, "iron_mg": 0.94, "vitamin_a_ug": 75, "vitamin_c_mg": 0.9, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "鸡肉炒面", "name_en": "Chicken Chow Mein", "category": "dish", "calories_kcal": 85, "protein_g": 6.8, "fat_g": 2.8, "carbs_g": 8.3, "fiber_g": 1.0, "sodium_mg": 311, "potassium_mg": 124, "calcium_mg": 21, "iron_mg": 0.67, "vitamin_a_ug": 19, "vitamin_c_mg": 2.0, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "鸡肉捞面", "name_en": "Chicken Lo Mein", "category": "dish", "calories_kcal": 130, "protein_g": 9.15, "fat_g": 3.15, "carbs_g": 16.15, "fiber_g": 1.0, "sodium_mg": 413, "potassium_mg": 140, "calcium_mg": 20, "iron_mg": 1.0, "vitamin_a_ug": 9, "vitamin_c_mg": 1.4, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "牛肉捞面", "name_en": "Beef Lo Mein", "category": "dish", "calories_kcal": 129, "protein_g": 9.73, "fat_g": 2.77, "carbs_g": 16.18, "fiber_g": 1.0, "sodium_mg": 358, "potassium_mg": 160, "calcium_mg": 20, "iron_mg": 1.43, "vitamin_a_ug": 8, "vitamin_c_mg": 1.4, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "扬州炒饭", "name_en": "Yangzhou Fried Rice", "category": "dish", "calories_kcal": 200, "protein_g": 7.0, "fat_g": 7.9, "carbs_g": 25, "fiber_g": 2.2, "sodium_mg": 310, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "蛋炒饭", "name_en": "Egg Fried Rice", "category": "dish", "calories_kcal": 174, "protein_g": 4.1, "fat_g": 3.0, "carbs_g": 32.8, "fiber_g": 1.1, "sodium_mg": 387, "potassium_mg": 76, "calcium_mg": 12, "iron_mg": 0.66, "vitamin_a_ug": 22, "vitamin_c_mg": 3.8, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "蒸饺（肉馅）", "name_en": "Steamed Dumpling (meat)", "category": "dish", "calories_kcal": 112, "protein_g": 11.55, "fat_g": 2.64, "carbs_g": 9.56, "fiber_g": 0.5, "sodium_mg": 435, "potassium_mg": 188, "calcium_mg": 19, "iron_mg": 1.38, "vitamin_a_ug": 13, "vitamin_c_mg": 1.3, "common_portion_desc": "6个", "common_portion_g": 180},
    {"name_zh": "馄饨汤", "name_en": "Wonton Soup", "category": "dish", "calories_kcal": 32, "protein_g": 2.1, "fat_g": 0.3, "carbs_g": 5.3, "fiber_g": 0.2, "sodium_mg": 406, "potassium_mg": 32, "calcium_mg": 5, "iron_mg": 0.21, "vitamin_a_ug": 1, "vitamin_c_mg": 0.7, "common_portion_desc": "一碗", "common_portion_g": 350},
    {"name_zh": "蛋花汤", "name_en": "Egg Drop Soup", "category": "dish", "calories_kcal": 27, "protein_g": 1.16, "fat_g": 0.61, "carbs_g": 4.29, "fiber_g": 0.4, "sodium_mg": 370, "potassium_mg": 22, "calcium_mg": 7, "iron_mg": 0.26, "vitamin_a_ug": 20, "vitamin_c_mg": 6.5, "common_portion_desc": "一碗", "common_portion_g": 250},
    {"name_zh": "酸辣汤", "name_en": "Hot and Sour Soup", "category": "dish", "calories_kcal": 39, "protein_g": 2.6, "fat_g": 1.2, "carbs_g": 4.4, "fiber_g": 0.5, "sodium_mg": 376, "potassium_mg": 55, "calcium_mg": 19, "iron_mg": 0.64, "vitamin_a_ug": 9, "vitamin_c_mg": 0, "common_portion_desc": "一碗", "common_portion_g": 250},
    {"name_zh": "春卷", "name_en": "Egg Roll / Spring Roll", "category": "dish", "calories_kcal": 251, "protein_g": 8.3, "fat_g": 11.9, "carbs_g": 27.3, "fiber_g": 2.6, "sodium_mg": 468, "potassium_mg": 165, "calcium_mg": 40, "iron_mg": 1.4, "vitamin_a_ug": None, "vitamin_c_mg": 0, "common_portion_desc": "两个", "common_portion_g": 120},
    {"name_zh": "白粥", "name_en": "Plain Congee", "category": "dish", "calories_kcal": 39, "protein_g": 0.8, "fat_g": 0.08, "carbs_g": 8.4, "fiber_g": 0.1, "sodium_mg": 234, "potassium_mg": 10, "calcium_mg": 5, "iron_mg": 0.36, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一碗", "common_portion_g": 300},
    {"name_zh": "皮蛋瘦肉粥", "name_en": "Preserved Egg and Pork Congee", "category": "dish", "calories_kcal": 56, "protein_g": 3.4, "fat_g": 2.5, "carbs_g": 4.8, "fiber_g": None, "sodium_mg": 280, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一碗", "common_portion_g": 300},
    {"name_zh": "叉烧饭", "name_en": "BBQ Pork Rice", "category": "dish", "calories_kcal": 200, "protein_g": 7.3, "fat_g": 7.1, "carbs_g": 26, "fiber_g": None, "sodium_mg": 250, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一份", "common_portion_g": 350},
    {"name_zh": "咖喱牛肉饭", "name_en": "Curry Beef Rice", "category": "dish", "calories_kcal": 160, "protein_g": 7.7, "fat_g": 6.3, "carbs_g": 18, "fiber_g": None, "sodium_mg": 290, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一份", "common_portion_g": 350},
    {"name_zh": "焗猪排饭", "name_en": "Baked Pork Chop Rice", "category": "dish", "calories_kcal": 190, "protein_g": 7.4, "fat_g": 8.8, "carbs_g": 21, "fiber_g": 1.0, "sodium_mg": 320, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一份", "common_portion_g": 350},
    {"name_zh": "牛腩面", "name_en": "Beef Brisket Noodles", "category": "dish", "calories_kcal": 84, "protein_g": 7.5, "fat_g": 2.5, "carbs_g": 7.9, "fiber_g": 1.3, "sodium_mg": 480, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一碗", "common_portion_g": 450},
    {"name_zh": "新加坡炒米粉", "name_en": "Singapore Fried Vermicelli", "category": "dish", "calories_kcal": 180, "protein_g": 6.3, "fat_g": 8.4, "carbs_g": 19, "fiber_g": 3.6, "sodium_mg": 350, "potassium_mg": None, "calcium_mg": None, "iron_mg": None, "vitamin_a_ug": None, "vitamin_c_mg": None, "common_portion_desc": "一份", "common_portion_g": 300},
]


def get_en_name(food_name_zh: str) -> str:
    """Try to get English name from mapping."""
    if food_name_zh in ZH_TO_EN:
        return ZH_TO_EN[food_name_zh]
    # Strip common suffixes and try again
    for suffix in ["（代表值）", "（鲜）", "（干）", "（生）", "（熟）"]:
        stripped = food_name_zh.replace(suffix, "")
        if stripped in ZH_TO_EN:
            return ZH_TO_EN[stripped]
    return ""


def get_category(filename: str) -> str:
    for prefix, cat in FILE_CATEGORY_MAP.items():
        if filename.startswith(prefix):
            return cat
    return "other"


def process():
    # Read existing CSV
    existing_names = set()
    existing_rows = []
    with open(EXISTING_CSV, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_names.add(row["name_zh"].strip())
            existing_rows.append(row)

    print(f"Existing items: {len(existing_rows)}")

    # Process Sanotsu data
    new_items = []
    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.endswith(".json") or filename == "glycemic_index.json":
            continue
        category = get_category(filename)
        with open(DATA_DIR / filename) as f:
            items = json.load(f)
        for item in items:
            name_zh = item.get("foodName", "").strip()
            if not name_zh or name_zh in existing_names:
                continue
            if not should_include(name_zh):
                continue
            cal = parse_val(item.get("energyKCal", ""))
            if cal is None or cal == 0:
                continue

            en_name = get_en_name(name_zh)
            new_items.append({
                "name_zh": name_zh,
                "name_en": en_name,
                "category": category,
                "calories_kcal": cal,
                "protein_g": parse_val(item.get("protein", "")) or 0,
                "fat_g": parse_val(item.get("fat", "")) or 0,
                "carbs_g": parse_val(item.get("CHO", "")) or 0,
                "fiber_g": parse_val(item.get("dietaryFiber", "")),
                "sodium_mg": parse_val(item.get("Na", "")),
                "potassium_mg": parse_val(item.get("K", "")),
                "calcium_mg": parse_val(item.get("Ca", "")),
                "iron_mg": parse_val(item.get("Fe", "")),
                "vitamin_a_ug": parse_val(item.get("vitaminA", "")),
                "vitamin_c_mg": parse_val(item.get("vitaminC", "")),
                "common_portion_desc": None,
                "common_portion_g": None,
            })
            existing_names.add(name_zh)

    # Add prepared dishes
    dish_count = 0
    for dish in PREPARED_DISHES:
        if dish["name_zh"] in existing_names:
            continue
        new_items.append(dish)
        existing_names.add(dish["name_zh"])
        dish_count += 1

    # Select fitness-relevant subset if too many
    # Priority: high-protein items, common ingredients, prepared dishes
    print(f"Raw ingredients from Sanotsu: {len(new_items) - dish_count}")
    print(f"Prepared dishes: {dish_count}")

    # Write merged CSV
    fieldnames = [
        "name_zh", "name_en", "category", "calories_kcal", "protein_g",
        "fat_g", "carbs_g", "fiber_g", "sodium_mg", "potassium_mg",
        "calcium_mg", "iron_mg", "vitamin_a_ug", "vitamin_c_mg",
        "common_portion_desc", "common_portion_g",
    ]

    total = len(existing_rows) + len(new_items)
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in existing_rows:
            writer.writerow(row)
        for item in new_items:
            # Format floats nicely
            formatted = {}
            for k, v in item.items():
                if v is None:
                    formatted[k] = ""
                elif isinstance(v, float):
                    formatted[k] = f"{v:.1f}" if v != int(v) else str(int(v))
                else:
                    formatted[k] = str(v)
            writer.writerow(formatted)

    print(f"Total: {total} items written to {OUTPUT_CSV.name}")

    # Count by category
    from collections import Counter
    all_items = existing_rows + new_items
    cats = Counter(
        item.get("category", item.get("category", "?"))
        for item in all_items
    )
    print(f"By category: {dict(cats)}")


if __name__ == "__main__":
    process()
