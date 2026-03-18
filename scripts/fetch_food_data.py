"""Fetch food composition data from USDA FoodData Central API and supplement
with Chinese food data. Outputs a CSV to knowledge-base/foods/.

Usage:
    # With USDA API key (optional, for extra data):
    USDA_API_KEY=your_key python scripts/fetch_food_data.py

    # Without API key (uses built-in Chinese food data only):
    python scripts/fetch_food_data.py
"""

import csv
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "knowledge-base" / "foods"
OUTPUT_CSV = OUTPUT_DIR / "chinese_food_composition.csv"

FIELDS = [
    "name_zh", "name_en", "category",
    "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
    "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg",
    "vitamin_a_ug", "vitamin_c_mg",
    "common_portion_desc", "common_portion_g",
]

# ── Built-in Chinese food composition data (per 100g) ──
# Sources: China CDC, USDA FoodData Central, published nutrition references.

BUILTIN_FOODS: list[dict] = [
    # ── 谷物主食 (grain) ──
    {"name_zh": "白米饭（熟）", "name_en": "Cooked White Rice", "category": "grain", "calories_kcal": 116, "protein_g": 2.6, "fat_g": 0.3, "carbs_g": 25.6, "fiber_g": 0.3, "sodium_mg": 1, "potassium_mg": 30, "calcium_mg": 7, "iron_mg": 0.2, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一碗", "common_portion_g": 200},
    {"name_zh": "糙米饭（熟）", "name_en": "Cooked Brown Rice", "category": "grain", "calories_kcal": 112, "protein_g": 2.3, "fat_g": 0.8, "carbs_g": 23.5, "fiber_g": 1.8, "sodium_mg": 1, "potassium_mg": 43, "calcium_mg": 10, "iron_mg": 0.4, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一碗", "common_portion_g": 200},
    {"name_zh": "全麦面包", "name_en": "Whole Wheat Bread", "category": "grain", "calories_kcal": 247, "protein_g": 13.0, "fat_g": 3.4, "carbs_g": 41.3, "fiber_g": 6.8, "sodium_mg": 400, "potassium_mg": 250, "calcium_mg": 107, "iron_mg": 2.5, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一片", "common_portion_g": 30},
    {"name_zh": "白面条（熟）", "name_en": "Cooked Noodles", "category": "grain", "calories_kcal": 138, "protein_g": 4.5, "fat_g": 0.5, "carbs_g": 28.4, "fiber_g": 1.0, "sodium_mg": 3, "potassium_mg": 20, "calcium_mg": 7, "iron_mg": 0.5, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一碗", "common_portion_g": 250},
    {"name_zh": "馒头", "name_en": "Steamed Bun (Mantou)", "category": "grain", "calories_kcal": 223, "protein_g": 7.0, "fat_g": 1.1, "carbs_g": 45.7, "fiber_g": 1.3, "sodium_mg": 232, "potassium_mg": 95, "calcium_mg": 38, "iron_mg": 1.8, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一个", "common_portion_g": 100},
    {"name_zh": "燕麦片", "name_en": "Oats (Rolled)", "category": "grain", "calories_kcal": 379, "protein_g": 13.2, "fat_g": 6.5, "carbs_g": 67.7, "fiber_g": 10.1, "sodium_mg": 6, "potassium_mg": 362, "calcium_mg": 54, "iron_mg": 4.7, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一杯干燕麦", "common_portion_g": 40},
    {"name_zh": "红薯（熟）", "name_en": "Cooked Sweet Potato", "category": "grain", "calories_kcal": 86, "protein_g": 1.6, "fat_g": 0.1, "carbs_g": 20.1, "fiber_g": 3.0, "sodium_mg": 36, "potassium_mg": 337, "calcium_mg": 30, "iron_mg": 0.6, "vitamin_a_ug": 709, "vitamin_c_mg": 2.4, "common_portion_desc": "一个中等", "common_portion_g": 150},
    {"name_zh": "玉米（熟）", "name_en": "Cooked Corn", "category": "grain", "calories_kcal": 96, "protein_g": 3.4, "fat_g": 1.5, "carbs_g": 21.0, "fiber_g": 2.4, "sodium_mg": 1, "potassium_mg": 218, "calcium_mg": 2, "iron_mg": 0.5, "vitamin_a_ug": 10, "vitamin_c_mg": 5.5, "common_portion_desc": "一根", "common_portion_g": 180},
    {"name_zh": "土豆（熟）", "name_en": "Cooked Potato", "category": "grain", "calories_kcal": 87, "protein_g": 1.9, "fat_g": 0.1, "carbs_g": 20.1, "fiber_g": 1.8, "sodium_mg": 5, "potassium_mg": 379, "calcium_mg": 8, "iron_mg": 0.3, "vitamin_a_ug": 0, "vitamin_c_mg": 13, "common_portion_desc": "一个中等", "common_portion_g": 150},
    {"name_zh": "紫薯（熟）", "name_en": "Cooked Purple Sweet Potato", "category": "grain", "calories_kcal": 82, "protein_g": 1.3, "fat_g": 0.1, "carbs_g": 19.6, "fiber_g": 2.5, "sodium_mg": 20, "potassium_mg": 300, "calcium_mg": 18, "iron_mg": 0.5, "vitamin_a_ug": 0, "vitamin_c_mg": 15, "common_portion_desc": "一个中等", "common_portion_g": 150},

    # ── 蛋白质来源 (protein) ──
    {"name_zh": "鸡胸肉（熟）", "name_en": "Cooked Chicken Breast", "category": "protein", "calories_kcal": 165, "protein_g": 31.0, "fat_g": 3.6, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 74, "potassium_mg": 256, "calcium_mg": 15, "iron_mg": 1.0, "vitamin_a_ug": 6, "vitamin_c_mg": 0, "common_portion_desc": "一块", "common_portion_g": 150},
    {"name_zh": "鸡蛋（煮）", "name_en": "Boiled Egg", "category": "protein", "calories_kcal": 155, "protein_g": 12.6, "fat_g": 10.6, "carbs_g": 1.1, "fiber_g": 0, "sodium_mg": 124, "potassium_mg": 126, "calcium_mg": 50, "iron_mg": 1.2, "vitamin_a_ug": 149, "vitamin_c_mg": 0, "common_portion_desc": "一个", "common_portion_g": 50},
    {"name_zh": "鸡蛋白", "name_en": "Egg White", "category": "protein", "calories_kcal": 52, "protein_g": 10.9, "fat_g": 0.2, "carbs_g": 0.7, "fiber_g": 0, "sodium_mg": 166, "potassium_mg": 163, "calcium_mg": 7, "iron_mg": 0.1, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一个蛋的蛋白", "common_portion_g": 33},
    {"name_zh": "牛里脊（熟）", "name_en": "Cooked Beef Tenderloin", "category": "protein", "calories_kcal": 196, "protein_g": 29.0, "fat_g": 8.5, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 54, "potassium_mg": 318, "calcium_mg": 6, "iron_mg": 2.6, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一掌心", "common_portion_g": 120},
    {"name_zh": "猪瘦肉（熟）", "name_en": "Cooked Lean Pork", "category": "protein", "calories_kcal": 212, "protein_g": 27.3, "fat_g": 10.7, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 53, "potassium_mg": 340, "calcium_mg": 6, "iron_mg": 1.1, "vitamin_a_ug": 2, "vitamin_c_mg": 0, "common_portion_desc": "一掌心", "common_portion_g": 120},
    {"name_zh": "三文鱼（熟）", "name_en": "Cooked Salmon", "category": "protein", "calories_kcal": 208, "protein_g": 20.4, "fat_g": 13.4, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 59, "potassium_mg": 363, "calcium_mg": 12, "iron_mg": 0.3, "vitamin_a_ug": 12, "vitamin_c_mg": 0, "common_portion_desc": "一块", "common_portion_g": 120},
    {"name_zh": "虾仁（熟）", "name_en": "Cooked Shrimp", "category": "protein", "calories_kcal": 99, "protein_g": 20.9, "fat_g": 1.7, "carbs_g": 0.2, "fiber_g": 0, "sodium_mg": 224, "potassium_mg": 182, "calcium_mg": 52, "iron_mg": 0.3, "vitamin_a_ug": 1, "vitamin_c_mg": 0, "common_portion_desc": "一把", "common_portion_g": 100},
    {"name_zh": "豆腐（北豆腐）", "name_en": "Firm Tofu", "category": "protein", "calories_kcal": 76, "protein_g": 8.1, "fat_g": 4.8, "carbs_g": 0.9, "fiber_g": 0.3, "sodium_mg": 7, "potassium_mg": 121, "calcium_mg": 138, "iron_mg": 1.6, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一块", "common_portion_g": 150},
    {"name_zh": "豆腐干", "name_en": "Dried Tofu", "category": "protein", "calories_kcal": 140, "protein_g": 16.2, "fat_g": 7.5, "carbs_g": 2.8, "fiber_g": 0.5, "sodium_mg": 15, "potassium_mg": 150, "calcium_mg": 200, "iron_mg": 2.0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "两片", "common_portion_g": 60},
    {"name_zh": "鸡腿肉（去皮，熟）", "name_en": "Cooked Chicken Thigh (skinless)", "category": "protein", "calories_kcal": 177, "protein_g": 24.8, "fat_g": 8.2, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 84, "potassium_mg": 230, "calcium_mg": 11, "iron_mg": 1.0, "vitamin_a_ug": 10, "vitamin_c_mg": 0, "common_portion_desc": "一个去骨", "common_portion_g": 120},
    {"name_zh": "带鱼（熟）", "name_en": "Cooked Hairtail Fish", "category": "protein", "calories_kcal": 127, "protein_g": 17.7, "fat_g": 5.9, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 60, "potassium_mg": 280, "calcium_mg": 28, "iron_mg": 1.2, "vitamin_a_ug": 15, "vitamin_c_mg": 0, "common_portion_desc": "一段", "common_portion_g": 100},
    {"name_zh": "鳕鱼（熟）", "name_en": "Cooked Cod", "category": "protein", "calories_kcal": 105, "protein_g": 23.0, "fat_g": 0.9, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 78, "potassium_mg": 244, "calcium_mg": 18, "iron_mg": 0.4, "vitamin_a_ug": 10, "vitamin_c_mg": 1, "common_portion_desc": "一块", "common_portion_g": 120},
    {"name_zh": "毛豆（熟）", "name_en": "Cooked Edamame", "category": "protein", "calories_kcal": 122, "protein_g": 11.9, "fat_g": 5.2, "carbs_g": 8.9, "fiber_g": 5.2, "sodium_mg": 6, "potassium_mg": 436, "calcium_mg": 63, "iron_mg": 2.3, "vitamin_a_ug": 8, "vitamin_c_mg": 6, "common_portion_desc": "一碗", "common_portion_g": 100},

    # ── 蔬菜 (vegetable) ──
    {"name_zh": "西兰花（熟）", "name_en": "Cooked Broccoli", "category": "vegetable", "calories_kcal": 35, "protein_g": 2.4, "fat_g": 0.4, "carbs_g": 7.2, "fiber_g": 3.3, "sodium_mg": 41, "potassium_mg": 293, "calcium_mg": 40, "iron_mg": 0.7, "vitamin_a_ug": 77, "vitamin_c_mg": 64.9, "common_portion_desc": "一份", "common_portion_g": 150},
    {"name_zh": "菠菜（熟）", "name_en": "Cooked Spinach", "category": "vegetable", "calories_kcal": 23, "protein_g": 2.9, "fat_g": 0.4, "carbs_g": 3.6, "fiber_g": 2.2, "sodium_mg": 70, "potassium_mg": 466, "calcium_mg": 136, "iron_mg": 3.6, "vitamin_a_ug": 524, "vitamin_c_mg": 9.8, "common_portion_desc": "一份", "common_portion_g": 150},
    {"name_zh": "番茄", "name_en": "Tomato", "category": "vegetable", "calories_kcal": 18, "protein_g": 0.9, "fat_g": 0.2, "carbs_g": 3.9, "fiber_g": 1.2, "sodium_mg": 5, "potassium_mg": 237, "calcium_mg": 10, "iron_mg": 0.3, "vitamin_a_ug": 42, "vitamin_c_mg": 13.7, "common_portion_desc": "一个中等", "common_portion_g": 150},
    {"name_zh": "黄瓜", "name_en": "Cucumber", "category": "vegetable", "calories_kcal": 15, "protein_g": 0.7, "fat_g": 0.1, "carbs_g": 3.6, "fiber_g": 0.5, "sodium_mg": 2, "potassium_mg": 147, "calcium_mg": 16, "iron_mg": 0.3, "vitamin_a_ug": 5, "vitamin_c_mg": 2.8, "common_portion_desc": "一根", "common_portion_g": 200},
    {"name_zh": "胡萝卜（熟）", "name_en": "Cooked Carrot", "category": "vegetable", "calories_kcal": 35, "protein_g": 0.8, "fat_g": 0.2, "carbs_g": 8.2, "fiber_g": 3.0, "sodium_mg": 58, "potassium_mg": 235, "calcium_mg": 30, "iron_mg": 0.3, "vitamin_a_ug": 852, "vitamin_c_mg": 3.6, "common_portion_desc": "一根", "common_portion_g": 120},
    {"name_zh": "生菜", "name_en": "Lettuce", "category": "vegetable", "calories_kcal": 15, "protein_g": 1.4, "fat_g": 0.2, "carbs_g": 2.9, "fiber_g": 1.3, "sodium_mg": 28, "potassium_mg": 194, "calcium_mg": 36, "iron_mg": 0.9, "vitamin_a_ug": 370, "vitamin_c_mg": 9.2, "common_portion_desc": "几片", "common_portion_g": 50},
    {"name_zh": "青椒", "name_en": "Green Bell Pepper", "category": "vegetable", "calories_kcal": 20, "protein_g": 0.9, "fat_g": 0.2, "carbs_g": 4.6, "fiber_g": 1.7, "sodium_mg": 3, "potassium_mg": 175, "calcium_mg": 10, "iron_mg": 0.3, "vitamin_a_ug": 18, "vitamin_c_mg": 80.4, "common_portion_desc": "一个", "common_portion_g": 120},
    {"name_zh": "白菜（熟）", "name_en": "Cooked Napa Cabbage", "category": "vegetable", "calories_kcal": 12, "protein_g": 1.0, "fat_g": 0.2, "carbs_g": 2.2, "fiber_g": 1.0, "sodium_mg": 11, "potassium_mg": 105, "calcium_mg": 32, "iron_mg": 0.3, "vitamin_a_ug": 16, "vitamin_c_mg": 11.6, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "芹菜", "name_en": "Celery", "category": "vegetable", "calories_kcal": 14, "protein_g": 0.7, "fat_g": 0.2, "carbs_g": 3.0, "fiber_g": 1.6, "sodium_mg": 80, "potassium_mg": 260, "calcium_mg": 40, "iron_mg": 0.2, "vitamin_a_ug": 22, "vitamin_c_mg": 3.1, "common_portion_desc": "两根", "common_portion_g": 100},
    {"name_zh": "蘑菇（熟）", "name_en": "Cooked Mushroom", "category": "vegetable", "calories_kcal": 28, "protein_g": 2.2, "fat_g": 0.5, "carbs_g": 4.4, "fiber_g": 2.2, "sodium_mg": 2, "potassium_mg": 356, "calcium_mg": 6, "iron_mg": 1.7, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一份", "common_portion_g": 100},
    {"name_zh": "茄子（熟）", "name_en": "Cooked Eggplant", "category": "vegetable", "calories_kcal": 35, "protein_g": 0.8, "fat_g": 0.2, "carbs_g": 8.7, "fiber_g": 2.5, "sodium_mg": 1, "potassium_mg": 123, "calcium_mg": 6, "iron_mg": 0.3, "vitamin_a_ug": 1, "vitamin_c_mg": 1.3, "common_portion_desc": "一个", "common_portion_g": 200},
    {"name_zh": "豆芽", "name_en": "Bean Sprouts", "category": "vegetable", "calories_kcal": 31, "protein_g": 3.0, "fat_g": 0.2, "carbs_g": 5.9, "fiber_g": 1.8, "sodium_mg": 6, "potassium_mg": 149, "calcium_mg": 13, "iron_mg": 0.9, "vitamin_a_ug": 1, "vitamin_c_mg": 13.2, "common_portion_desc": "一份", "common_portion_g": 100},

    # ── 水果 (fruit) ──
    {"name_zh": "香蕉", "name_en": "Banana", "category": "fruit", "calories_kcal": 89, "protein_g": 1.1, "fat_g": 0.3, "carbs_g": 22.8, "fiber_g": 2.6, "sodium_mg": 1, "potassium_mg": 358, "calcium_mg": 5, "iron_mg": 0.3, "vitamin_a_ug": 3, "vitamin_c_mg": 8.7, "common_portion_desc": "一根中等", "common_portion_g": 120},
    {"name_zh": "苹果", "name_en": "Apple", "category": "fruit", "calories_kcal": 52, "protein_g": 0.3, "fat_g": 0.2, "carbs_g": 13.8, "fiber_g": 2.4, "sodium_mg": 1, "potassium_mg": 107, "calcium_mg": 6, "iron_mg": 0.1, "vitamin_a_ug": 3, "vitamin_c_mg": 4.6, "common_portion_desc": "一个中等", "common_portion_g": 180},
    {"name_zh": "橙子", "name_en": "Orange", "category": "fruit", "calories_kcal": 47, "protein_g": 0.9, "fat_g": 0.1, "carbs_g": 11.8, "fiber_g": 2.4, "sodium_mg": 0, "potassium_mg": 181, "calcium_mg": 40, "iron_mg": 0.1, "vitamin_a_ug": 11, "vitamin_c_mg": 53.2, "common_portion_desc": "一个中等", "common_portion_g": 150},
    {"name_zh": "蓝莓", "name_en": "Blueberries", "category": "fruit", "calories_kcal": 57, "protein_g": 0.7, "fat_g": 0.3, "carbs_g": 14.5, "fiber_g": 2.4, "sodium_mg": 1, "potassium_mg": 77, "calcium_mg": 6, "iron_mg": 0.3, "vitamin_a_ug": 3, "vitamin_c_mg": 9.7, "common_portion_desc": "一杯", "common_portion_g": 150},
    {"name_zh": "葡萄", "name_en": "Grapes", "category": "fruit", "calories_kcal": 69, "protein_g": 0.7, "fat_g": 0.2, "carbs_g": 18.1, "fiber_g": 0.9, "sodium_mg": 2, "potassium_mg": 191, "calcium_mg": 10, "iron_mg": 0.4, "vitamin_a_ug": 3, "vitamin_c_mg": 3.2, "common_portion_desc": "一串", "common_portion_g": 150},
    {"name_zh": "西瓜", "name_en": "Watermelon", "category": "fruit", "calories_kcal": 30, "protein_g": 0.6, "fat_g": 0.2, "carbs_g": 7.6, "fiber_g": 0.4, "sodium_mg": 1, "potassium_mg": 112, "calcium_mg": 7, "iron_mg": 0.2, "vitamin_a_ug": 28, "vitamin_c_mg": 8.1, "common_portion_desc": "一块", "common_portion_g": 300},
    {"name_zh": "猕猴桃", "name_en": "Kiwi", "category": "fruit", "calories_kcal": 61, "protein_g": 1.1, "fat_g": 0.5, "carbs_g": 14.7, "fiber_g": 3.0, "sodium_mg": 3, "potassium_mg": 312, "calcium_mg": 34, "iron_mg": 0.3, "vitamin_a_ug": 4, "vitamin_c_mg": 92.7, "common_portion_desc": "一个", "common_portion_g": 80},

    # ── 乳制品 (dairy) ──
    {"name_zh": "全脂牛奶", "name_en": "Whole Milk", "category": "dairy", "calories_kcal": 61, "protein_g": 3.2, "fat_g": 3.3, "carbs_g": 4.8, "fiber_g": 0, "sodium_mg": 44, "potassium_mg": 132, "calcium_mg": 113, "iron_mg": 0, "vitamin_a_ug": 46, "vitamin_c_mg": 0, "common_portion_desc": "一杯", "common_portion_g": 250},
    {"name_zh": "脱脂牛奶", "name_en": "Skim Milk", "category": "dairy", "calories_kcal": 34, "protein_g": 3.4, "fat_g": 0.1, "carbs_g": 5.0, "fiber_g": 0, "sodium_mg": 42, "potassium_mg": 156, "calcium_mg": 122, "iron_mg": 0, "vitamin_a_ug": 1, "vitamin_c_mg": 0, "common_portion_desc": "一杯", "common_portion_g": 250},
    {"name_zh": "原味酸奶", "name_en": "Plain Yogurt", "category": "dairy", "calories_kcal": 63, "protein_g": 5.3, "fat_g": 1.6, "carbs_g": 7.0, "fiber_g": 0, "sodium_mg": 46, "potassium_mg": 155, "calcium_mg": 110, "iron_mg": 0.1, "vitamin_a_ug": 14, "vitamin_c_mg": 0.5, "common_portion_desc": "一杯", "common_portion_g": 200},
    {"name_zh": "希腊酸奶", "name_en": "Greek Yogurt", "category": "dairy", "calories_kcal": 97, "protein_g": 9.0, "fat_g": 5.0, "carbs_g": 3.6, "fiber_g": 0, "sodium_mg": 47, "potassium_mg": 141, "calcium_mg": 100, "iron_mg": 0.1, "vitamin_a_ug": 30, "vitamin_c_mg": 0, "common_portion_desc": "一杯", "common_portion_g": 150},
    {"name_zh": "乳清蛋白粉", "name_en": "Whey Protein Powder", "category": "dairy", "calories_kcal": 380, "protein_g": 75.0, "fat_g": 4.0, "carbs_g": 10.0, "fiber_g": 0, "sodium_mg": 200, "potassium_mg": 450, "calcium_mg": 400, "iron_mg": 2.0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一勺", "common_portion_g": 30},

    # ── 油脂坚果 (oil) ──
    {"name_zh": "橄榄油", "name_en": "Olive Oil", "category": "oil", "calories_kcal": 884, "protein_g": 0, "fat_g": 100, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 2, "potassium_mg": 1, "calcium_mg": 1, "iron_mg": 0.6, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一汤匙", "common_portion_g": 14},
    {"name_zh": "花生", "name_en": "Peanuts", "category": "oil", "calories_kcal": 567, "protein_g": 25.8, "fat_g": 49.2, "carbs_g": 16.1, "fiber_g": 8.5, "sodium_mg": 18, "potassium_mg": 705, "calcium_mg": 92, "iron_mg": 4.6, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一小把", "common_portion_g": 30},
    {"name_zh": "杏仁", "name_en": "Almonds", "category": "oil", "calories_kcal": 579, "protein_g": 21.2, "fat_g": 49.9, "carbs_g": 21.6, "fiber_g": 12.5, "sodium_mg": 1, "potassium_mg": 733, "calcium_mg": 269, "iron_mg": 3.7, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一小把", "common_portion_g": 30},
    {"name_zh": "核桃", "name_en": "Walnuts", "category": "oil", "calories_kcal": 654, "protein_g": 15.2, "fat_g": 65.2, "carbs_g": 13.7, "fiber_g": 6.7, "sodium_mg": 2, "potassium_mg": 441, "calcium_mg": 98, "iron_mg": 2.9, "vitamin_a_ug": 1, "vitamin_c_mg": 1.3, "common_portion_desc": "三个", "common_portion_g": 30},
    {"name_zh": "花生酱", "name_en": "Peanut Butter", "category": "oil", "calories_kcal": 588, "protein_g": 25.1, "fat_g": 50.4, "carbs_g": 19.6, "fiber_g": 6.0, "sodium_mg": 426, "potassium_mg": 649, "calcium_mg": 45, "iron_mg": 1.7, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一汤匙", "common_portion_g": 16},
    {"name_zh": "牛油果", "name_en": "Avocado", "category": "oil", "calories_kcal": 160, "protein_g": 2.0, "fat_g": 14.7, "carbs_g": 8.5, "fiber_g": 6.7, "sodium_mg": 7, "potassium_mg": 485, "calcium_mg": 12, "iron_mg": 0.6, "vitamin_a_ug": 7, "vitamin_c_mg": 10, "common_portion_desc": "半个", "common_portion_g": 75},

    # ── 中式菜品 (dish) ──
    {"name_zh": "黄焖鸡米饭", "name_en": "Braised Chicken Rice (Huangmen)", "category": "dish", "calories_kcal": 174, "protein_g": 10.5, "fat_g": 7.2, "carbs_g": 17.0, "fiber_g": 0.8, "sodium_mg": 520, "potassium_mg": 180, "calcium_mg": 20, "iron_mg": 1.0, "vitamin_a_ug": 15, "vitamin_c_mg": 2, "common_portion_desc": "一份", "common_portion_g": 450},
    {"name_zh": "宫保鸡丁", "name_en": "Kung Pao Chicken", "category": "dish", "calories_kcal": 190, "protein_g": 15.0, "fat_g": 12.0, "carbs_g": 6.5, "fiber_g": 1.5, "sodium_mg": 680, "potassium_mg": 220, "calcium_mg": 25, "iron_mg": 1.3, "vitamin_a_ug": 20, "vitamin_c_mg": 8, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "西红柿炒鸡蛋", "name_en": "Scrambled Eggs with Tomato", "category": "dish", "calories_kcal": 120, "protein_g": 7.5, "fat_g": 8.0, "carbs_g": 4.5, "fiber_g": 0.8, "sodium_mg": 350, "potassium_mg": 200, "calcium_mg": 35, "iron_mg": 1.0, "vitamin_a_ug": 80, "vitamin_c_mg": 10, "common_portion_desc": "一份", "common_portion_g": 250},
    {"name_zh": "红烧肉", "name_en": "Braised Pork Belly (Hongshao)", "category": "dish", "calories_kcal": 330, "protein_g": 12.0, "fat_g": 28.0, "carbs_g": 8.0, "fiber_g": 0, "sodium_mg": 750, "potassium_mg": 200, "calcium_mg": 10, "iron_mg": 1.5, "vitamin_a_ug": 5, "vitamin_c_mg": 0, "common_portion_desc": "一份", "common_portion_g": 200},
    {"name_zh": "鱼香肉丝", "name_en": "Yu Xiang Shredded Pork", "category": "dish", "calories_kcal": 165, "protein_g": 11.0, "fat_g": 10.0, "carbs_g": 8.5, "fiber_g": 1.5, "sodium_mg": 620, "potassium_mg": 210, "calcium_mg": 20, "iron_mg": 1.2, "vitamin_a_ug": 15, "vitamin_c_mg": 5, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "麻婆豆腐", "name_en": "Mapo Tofu", "category": "dish", "calories_kcal": 135, "protein_g": 8.0, "fat_g": 9.5, "carbs_g": 4.5, "fiber_g": 0.8, "sodium_mg": 580, "potassium_mg": 180, "calcium_mg": 120, "iron_mg": 2.0, "vitamin_a_ug": 10, "vitamin_c_mg": 2, "common_portion_desc": "一份", "common_portion_g": 300},
    {"name_zh": "清炒时蔬", "name_en": "Stir-fried Vegetables", "category": "dish", "calories_kcal": 55, "protein_g": 2.5, "fat_g": 3.0, "carbs_g": 5.0, "fiber_g": 2.0, "sodium_mg": 350, "potassium_mg": 250, "calcium_mg": 40, "iron_mg": 0.8, "vitamin_a_ug": 80, "vitamin_c_mg": 20, "common_portion_desc": "一份", "common_portion_g": 250},
    {"name_zh": "蛋炒饭", "name_en": "Egg Fried Rice", "category": "dish", "calories_kcal": 186, "protein_g": 6.5, "fat_g": 7.5, "carbs_g": 24.0, "fiber_g": 0.5, "sodium_mg": 450, "potassium_mg": 100, "calcium_mg": 25, "iron_mg": 0.8, "vitamin_a_ug": 40, "vitamin_c_mg": 1, "common_portion_desc": "一份", "common_portion_g": 350},
    {"name_zh": "酸辣土豆丝", "name_en": "Hot and Sour Shredded Potato", "category": "dish", "calories_kcal": 95, "protein_g": 2.0, "fat_g": 4.5, "carbs_g": 12.5, "fiber_g": 1.5, "sodium_mg": 400, "potassium_mg": 280, "calcium_mg": 10, "iron_mg": 0.4, "vitamin_a_ug": 2, "vitamin_c_mg": 8, "common_portion_desc": "一份", "common_portion_g": 250},
    {"name_zh": "回锅肉", "name_en": "Twice-cooked Pork", "category": "dish", "calories_kcal": 260, "protein_g": 14.0, "fat_g": 20.0, "carbs_g": 5.0, "fiber_g": 1.0, "sodium_mg": 700, "potassium_mg": 250, "calcium_mg": 15, "iron_mg": 1.3, "vitamin_a_ug": 10, "vitamin_c_mg": 15, "common_portion_desc": "一份", "common_portion_g": 250},
    {"name_zh": "水煮牛肉", "name_en": "Boiled Beef in Spicy Sauce", "category": "dish", "calories_kcal": 145, "protein_g": 14.0, "fat_g": 8.0, "carbs_g": 4.0, "fiber_g": 1.0, "sodium_mg": 850, "potassium_mg": 300, "calcium_mg": 20, "iron_mg": 2.0, "vitamin_a_ug": 30, "vitamin_c_mg": 5, "common_portion_desc": "一份", "common_portion_g": 350},
    {"name_zh": "盖浇饭（肉末茄子）", "name_en": "Rice with Minced Pork and Eggplant", "category": "dish", "calories_kcal": 155, "protein_g": 7.0, "fat_g": 6.0, "carbs_g": 19.0, "fiber_g": 1.5, "sodium_mg": 500, "potassium_mg": 160, "calcium_mg": 15, "iron_mg": 0.8, "vitamin_a_ug": 10, "vitamin_c_mg": 3, "common_portion_desc": "一份", "common_portion_g": 450},
    {"name_zh": "兰州拉面（牛肉面）", "name_en": "Lanzhou Beef Noodle Soup", "category": "dish", "calories_kcal": 125, "protein_g": 7.0, "fat_g": 3.5, "carbs_g": 17.5, "fiber_g": 0.8, "sodium_mg": 680, "potassium_mg": 120, "calcium_mg": 15, "iron_mg": 1.0, "vitamin_a_ug": 5, "vitamin_c_mg": 2, "common_portion_desc": "一碗", "common_portion_g": 500},
    {"name_zh": "沙县扁肉（馄饨）", "name_en": "Shaxian Wonton", "category": "dish", "calories_kcal": 110, "protein_g": 6.0, "fat_g": 4.0, "carbs_g": 12.5, "fiber_g": 0.5, "sodium_mg": 550, "potassium_mg": 100, "calcium_mg": 15, "iron_mg": 0.8, "vitamin_a_ug": 5, "vitamin_c_mg": 1, "common_portion_desc": "一碗", "common_portion_g": 350},
    {"name_zh": "饺子（猪肉白菜）", "name_en": "Pork and Cabbage Dumplings", "category": "dish", "calories_kcal": 210, "protein_g": 9.5, "fat_g": 8.0, "carbs_g": 24.5, "fiber_g": 1.0, "sodium_mg": 480, "potassium_mg": 150, "calcium_mg": 25, "iron_mg": 1.2, "vitamin_a_ug": 8, "vitamin_c_mg": 3, "common_portion_desc": "10个", "common_portion_g": 300},
    {"name_zh": "包子（猪肉）", "name_en": "Steamed Pork Bun (Baozi)", "category": "dish", "calories_kcal": 220, "protein_g": 8.5, "fat_g": 7.0, "carbs_g": 30.0, "fiber_g": 1.0, "sodium_mg": 400, "potassium_mg": 120, "calcium_mg": 30, "iron_mg": 1.5, "vitamin_a_ug": 5, "vitamin_c_mg": 0, "common_portion_desc": "两个", "common_portion_g": 160},
    {"name_zh": "煎饼果子", "name_en": "Jianbing (Chinese Crepe)", "category": "dish", "calories_kcal": 230, "protein_g": 8.0, "fat_g": 10.0, "carbs_g": 27.5, "fiber_g": 1.5, "sodium_mg": 550, "potassium_mg": 130, "calcium_mg": 35, "iron_mg": 1.0, "vitamin_a_ug": 30, "vitamin_c_mg": 2, "common_portion_desc": "一套", "common_portion_g": 250},

    # ── 零食 (snack) ──
    {"name_zh": "黑巧克力（70%）", "name_en": "Dark Chocolate (70%)", "category": "snack", "calories_kcal": 598, "protein_g": 7.8, "fat_g": 42.6, "carbs_g": 45.9, "fiber_g": 10.9, "sodium_mg": 20, "potassium_mg": 715, "calcium_mg": 73, "iron_mg": 11.9, "vitamin_a_ug": 2, "vitamin_c_mg": 0, "common_portion_desc": "两小块", "common_portion_g": 20},
    {"name_zh": "能量棒（蛋白棒）", "name_en": "Protein Bar", "category": "snack", "calories_kcal": 350, "protein_g": 20.0, "fat_g": 12.0, "carbs_g": 40.0, "fiber_g": 5.0, "sodium_mg": 200, "potassium_mg": 250, "calcium_mg": 150, "iron_mg": 3.0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一根", "common_portion_g": 60},
    {"name_zh": "全麦饼干", "name_en": "Whole Wheat Crackers", "category": "snack", "calories_kcal": 443, "protein_g": 9.0, "fat_g": 15.0, "carbs_g": 68.0, "fiber_g": 6.0, "sodium_mg": 680, "potassium_mg": 200, "calcium_mg": 50, "iron_mg": 3.5, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "5片", "common_portion_g": 30},

    # ── 饮品 (beverage) ──
    {"name_zh": "美式咖啡（黑咖啡）", "name_en": "Black Coffee (Americano)", "category": "beverage", "calories_kcal": 2, "protein_g": 0.3, "fat_g": 0, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 5, "potassium_mg": 116, "calcium_mg": 5, "iron_mg": 0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一杯大杯", "common_portion_g": 350},
    {"name_zh": "拿铁咖啡", "name_en": "Caffè Latte", "category": "beverage", "calories_kcal": 42, "protein_g": 2.5, "fat_g": 1.8, "carbs_g": 3.8, "fiber_g": 0, "sodium_mg": 35, "potassium_mg": 100, "calcium_mg": 80, "iron_mg": 0, "vitamin_a_ug": 20, "vitamin_c_mg": 0, "common_portion_desc": "一杯大杯", "common_portion_g": 350},
    {"name_zh": "豆浆（无糖）", "name_en": "Unsweetened Soy Milk", "category": "beverage", "calories_kcal": 33, "protein_g": 2.9, "fat_g": 1.6, "carbs_g": 1.7, "fiber_g": 0.4, "sodium_mg": 12, "potassium_mg": 118, "calcium_mg": 25, "iron_mg": 0.6, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一杯", "common_portion_g": 300},
    {"name_zh": "椰子水", "name_en": "Coconut Water", "category": "beverage", "calories_kcal": 19, "protein_g": 0.7, "fat_g": 0.2, "carbs_g": 3.7, "fiber_g": 1.1, "sodium_mg": 105, "potassium_mg": 250, "calcium_mg": 24, "iron_mg": 0.3, "vitamin_a_ug": 0, "vitamin_c_mg": 2.4, "common_portion_desc": "一杯", "common_portion_g": 330},
    {"name_zh": "运动饮料", "name_en": "Sports Drink", "category": "beverage", "calories_kcal": 26, "protein_g": 0, "fat_g": 0, "carbs_g": 6.4, "fiber_g": 0, "sodium_mg": 41, "potassium_mg": 12, "calcium_mg": 0, "iron_mg": 0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一瓶", "common_portion_g": 500},
    {"name_zh": "可乐", "name_en": "Cola", "category": "beverage", "calories_kcal": 42, "protein_g": 0, "fat_g": 0, "carbs_g": 10.6, "fiber_g": 0, "sodium_mg": 4, "potassium_mg": 2, "calcium_mg": 2, "iron_mg": 0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一罐", "common_portion_g": 330},
    {"name_zh": "绿茶（无糖）", "name_en": "Green Tea (Unsweetened)", "category": "beverage", "calories_kcal": 1, "protein_g": 0.2, "fat_g": 0, "carbs_g": 0, "fiber_g": 0, "sodium_mg": 1, "potassium_mg": 27, "calcium_mg": 0, "iron_mg": 0, "vitamin_a_ug": 0, "vitamin_c_mg": 0, "common_portion_desc": "一杯", "common_portion_g": 250},
]


def fetch_usda_foods(api_key: str, queries: list[str]) -> list[dict]:
    """Fetch foods from USDA FoodData Central API (supplementary)."""
    results = []
    for query in queries:
        url = f"https://api.nal.usda.gov/fdc/v1/foods/search?api_key={api_key}&query={query}&pageSize=5&dataType=Foundation,SR%20Legacy"
        try:
            req = Request(url, headers={"Accept": "application/json"})
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            for food in data.get("foods", [])[:2]:
                nutrients = {n["nutrientName"]: n.get("value", 0) for n in food.get("foodNutrients", [])}
                results.append({
                    "name_zh": query,
                    "name_en": food.get("description", ""),
                    "category": "protein",  # needs manual mapping
                    "calories_kcal": nutrients.get("Energy", 0),
                    "protein_g": nutrients.get("Protein", 0),
                    "fat_g": nutrients.get("Total lipid (fat)", 0),
                    "carbs_g": nutrients.get("Carbohydrate, by difference", 0),
                    "fiber_g": nutrients.get("Fiber, total dietary", ""),
                    "sodium_mg": nutrients.get("Sodium, Na", ""),
                    "potassium_mg": nutrients.get("Potassium, K", ""),
                    "calcium_mg": nutrients.get("Calcium, Ca", ""),
                    "iron_mg": nutrients.get("Iron, Fe", ""),
                    "vitamin_a_ug": nutrients.get("Vitamin A, RAE", ""),
                    "vitamin_c_mg": nutrients.get("Vitamin C, total ascorbic acid", ""),
                    "common_portion_desc": "",
                    "common_portion_g": "",
                })
        except (URLError, json.JSONDecodeError, KeyError) as e:
            print(f"  Warning: failed to fetch '{query}' from USDA: {e}")
    return results


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    foods = list(BUILTIN_FOODS)
    print(f"Built-in foods: {len(foods)}")

    # Optionally fetch from USDA
    api_key = os.environ.get("USDA_API_KEY")
    if api_key:
        print("Fetching supplementary data from USDA FoodData Central...")
        extra = fetch_usda_foods(api_key, ["chicken breast", "salmon", "brown rice", "broccoli", "sweet potato"])
        foods.extend(extra)
        print(f"  Fetched {len(extra)} additional entries from USDA")
    else:
        print("No USDA_API_KEY set. Using built-in data only.")

    # Write CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        for food in foods:
            writer.writerow({k: food.get(k, "") for k in FIELDS})

    print(f"Wrote {len(foods)} foods to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
