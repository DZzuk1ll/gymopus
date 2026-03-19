"""
Expand the exercise database using data from free-exercise-db (GitHub, Public Domain).
Source: https://github.com/yuhonas/free-exercise-db

Maps exercises to the GymOpus schema and merges with existing exercises.
"""

import json
from pathlib import Path

SOURCE_PATH = Path("/tmp/free-exercise-db.json")
EXISTING_PATH = Path(__file__).resolve().parent.parent / "knowledge-base" / "exercises" / "exercises.json"
OUTPUT_PATH = EXISTING_PATH

# --- Mapping tables ---

MUSCLE_GROUP_MAP = {
    "chest": "chest",
    "lats": "back",
    "middle back": "back",
    "lower back": "back",
    "traps": "back",
    "quadriceps": "legs",
    "hamstrings": "legs",
    "calves": "legs",
    "glutes": "legs",
    "adductors": "legs",
    "abductors": "legs",
    "shoulders": "shoulders",
    "neck": "shoulders",
    "biceps": "arms",
    "triceps": "arms",
    "forearms": "arms",
    "abdominals": "core",
}

EQUIPMENT_MAP = {
    "barbell": "barbell",
    "dumbbell": "dumbbell",
    "cable": "cable",
    "machine": "machine",
    "body only": "bodyweight",
    "bands": "band",
    "kettlebells": "kettlebell",
    "e-z curl bar": "barbell",
    "medicine ball": "dumbbell",
    "exercise ball": "bodyweight",
    "foam roll": None,  # skip
    "other": None,  # skip
    None: "bodyweight",
}

LEVEL_MAP = {
    "beginner": "beginner",
    "intermediate": "intermediate",
    "expert": "advanced",
}

# Categories to include (skip stretching, cardio, foam roll)
INCLUDE_CATEGORIES = {"strength", "powerlifting", "olympic weightlifting", "plyometrics", "strongman"}

# Movement pattern inference based on exercise name and muscles
def infer_movement_pattern(name: str, force: str | None, primary_muscles: list[str]) -> str:
    name_lower = name.lower()
    if any(w in name_lower for w in ["squat", "lunge", "leg press", "step up", "leg extension"]):
        return "squat"
    if any(w in name_lower for w in ["deadlift", "hip thrust", "good morning", "hyperextension", "glute bridge", "romanian", "kettlebell swing"]):
        return "hinge"
    if any(w in name_lower for w in ["carry", "farmer", "walk", "sled"]):
        return "carry"
    if any(w in name_lower for w in ["twist", "rotation", "wood chop", "russian twist", "windmill"]):
        return "rotation"
    if any(w in name_lower for w in ["curl", "extension", "raise", "fly", "flye", "kickback", "concentration"]):
        return "isolation"
    if force == "push":
        return "push"
    if force == "pull":
        return "pull"
    if force == "static":
        return "isolation"
    # Default based on muscle
    for m in primary_muscles:
        if m in ("chest", "shoulders", "triceps"):
            return "push"
        if m in ("lats", "middle back", "biceps", "traps"):
            return "pull"
        if m in ("quadriceps", "adductors", "abductors"):
            return "squat"
        if m in ("hamstrings", "glutes", "lower back"):
            return "hinge"
    return "isolation"


# Common exercise name translations (well-established in Chinese fitness community)
EXERCISE_NAME_ZH = {
    "Barbell Bench Press - Medium Grip": "杠铃卧推（中握距）",
    "Dumbbell Bench Press": "哑铃卧推",
    "Incline Dumbbell Press": "上斜哑铃卧推",
    "Decline Dumbbell Bench Press": "下斜哑铃卧推",
    "Dumbbell Flyes": "哑铃飞鸟",
    "Incline Dumbbell Flyes": "上斜哑铃飞鸟",
    "Cable Crossover": "绳索夹胸",
    "Pushups": "俯卧撑",
    "Wide-Grip Barbell Bench Press": "宽握杠铃卧推",
    "Close-Grip Barbell Bench Press": "窄握杠铃卧推",
    "Chest Dip": "双杠臂屈伸（胸部）",
    "Barbell Deadlift": "杠铃硬拉",
    "Sumo Deadlift": "相扑硬拉",
    "Romanian Deadlift With Dumbbells": "哑铃罗马尼亚硬拉",
    "Barbell Bent Over Row": "杠铃俯身划船",
    "One-Arm Dumbbell Row": "单臂哑铃划船",
    "Seated Cable Rows": "坐姿绳索划船",
    "Wide-Grip Lat Pulldown": "宽握高位下拉",
    "Pullups": "引体向上",
    "Chin-Up": "反握引体向上",
    "T-Bar Row": "T杠划船",
    "Straight-Arm Dumbbell Pullover": "哑铃仰卧上拉",
    "Barbell Shrug": "杠铃耸肩",
    "Face Pull": "绳索面拉",
    "Hyperextensions (Back Extensions)": "山羊挺身",
    "Barbell Squat": "杠铃深蹲",
    "Front Barbell Squat": "前蹲",
    "Leg Press": "腿举",
    "Hack Squat": "哈克深蹲",
    "Barbell Lunge": "杠铃弓步",
    "Dumbbell Lunges": "哑铃弓步",
    "Leg Extensions": "腿屈伸",
    "Lying Leg Curls": "俯卧腿弯举",
    "Seated Leg Curl": "坐姿腿弯举",
    "Standing Calf Raises": "站姿提踵",
    "Seated Calf Raise": "坐姿提踵",
    "Barbell Hip Thrust": "杠铃臀推",
    "Glute Bridge": "臀桥",
    "Bulgarian Split Squat": "保加利亚分腿蹲",
    "Goblet Squat": "高脚杯深蹲",
    "Step-up with Barbell": "杠铃箱上步",
    "Standing Military Press": "站姿杠铃推举",
    "Seated Barbell Military Press": "坐姿杠铃推举",
    "Dumbbell Shoulder Press": "哑铃肩推",
    "Arnold Dumbbell Press": "阿诺德推举",
    "Side Lateral Raise": "哑铃侧平举",
    "Front Dumbbell Raise": "哑铃前平举",
    "Reverse Flyes": "反向飞鸟",
    "Upright Barbell Row": "杠铃直立划船",
    "Barbell Rear Delt Row": "杠铃后三角划船",
    "Barbell Curl": "杠铃弯举",
    "Dumbbell Bicep Curl": "哑铃弯举",
    "Hammer Curls": "锤式弯举",
    "Preacher Curl": "传教士弯举",
    "Concentration Curls": "集中弯举",
    "Cable Hammer Curls - Rope Attachment": "绳索锤式弯举",
    "Incline Dumbbell Curl": "上斜哑铃弯举",
    "Triceps Pushdown": "绳索下压",
    "Triceps Pushdown - Rope Attachment": "绳索三头下压",
    "Lying Triceps Press": "仰卧臂屈伸",
    "Dumbbell Tricep Kickback": "哑铃三头后踢",
    "Overhead Triceps Extension": "过头三头臂屈伸",
    "Dips - Triceps Version": "双杠臂屈伸（三头）",
    "Close-Grip EZ Bar Curl": "窄握曲杠弯举",
    "Wrist Curl": "杠铃腕弯举",
    "Farmer's Walk": "农夫行走",
    "Plank": "平板支撑",
    "Ab Crunch Machine": "卷腹器械",
    "Hanging Leg Raise": "悬垂举腿",
    "Cable Crunch": "绳索卷腹",
    "Decline Crunch": "下斜卷腹",
    "Russian Twist": "俄罗斯转体",
    "Ab Roller": "健腹轮",
    "Bicycle Crunches": "自行车卷腹",
    "Mountain Climbers": "登山者",
    "Kettlebell Swing": "壶铃摆动",
    "Kettlebell Turkish Get-Up": "壶铃土耳其起立",
    "Clean and Jerk": "挺举",
    "Snatch": "抓举",
    "Power Clean": "翻站",
    "Clean and Press": "翻推",
    "Box Squat": "箱式深蹲",
    "Barbell Good Morning": "杠铃早安",
    "Thigh Abductor": "髋外展器械",
    "Thigh Adductor": "髋内收器械",
    "Dumbbell Shrug": "哑铃耸肩",
    "Smith Machine Squat": "史密斯深蹲",
    "Machine Shoulder (Military) Press": "器械肩推",
    "Lat Pulldown": "高位下拉",
    "Low Cable Crossover": "低位绳索夹胸",
    "Incline Cable Flye": "上斜绳索飞鸟",
    "Pec Deck Fly": "蝴蝶机夹胸",
    "Push Up (with handles)": "俯卧撑（手柄）",
    "Landmine Press": "地雷管推举",
    "Dumbbell Lateral Raise": "哑铃侧平举",
    "Cable Lateral Raise": "绳索侧平举",
    "Bent Over Dumbbell Rear Delt Raise With Head On Bench": "俯身哑铃反向飞鸟",
    "Machine Lateral Raise": "器械侧平举",
    "Machine Bicep Curl": "器械弯举",
    "Spider Curl": "蜘蛛弯举",
    "Dumbbell Alternate Bicep Curl": "交替哑铃弯举",
    "Cross Body Hammer Curl": "斜方锤式弯举",
    "Zottman Curl": "佐特曼弯举",
    "EZ-Bar Curl": "曲杠弯举",
    "Cable Curl": "绳索弯举",
    "Reverse Barbell Curl": "反握杠铃弯举",
    "Skullcrusher": "碎颅者",
    "Cable Overhead Triceps Extension": "绳索过头三头臂屈伸",
    "Bench Dips": "凳上臂屈伸",
    "Diamond Push-Ups": "钻石俯卧撑",
    "Dumbbell Floor Press": "哑铃地板卧推",
    "Single-Leg Deadlift": "单腿硬拉",
    "Pistol Squat": "手枪式深蹲",
    "Wall Sit": "靠墙静蹲",
    "Box Jump": "跳箱",
    "Burpees": "波比跳",
    "Jump Squat": "跳跃深蹲",
    "Battle Ropes": "战绳",
    "Bear Crawl": "熊爬",
    "Inverted Row": "反向划船",
    "Pike Push Up": "屈体俯卧撑",
    "Handstand Push-Ups": "倒立撑",
    "Muscle Up": "双力臂",
    "Dragon Flag": "龙旗",
    "L-Sit": "L字支撑",
    "Pallof Press": "帕洛夫推",
    "Dead Bug": "死虫",
    "Bird Dog": "鸟狗式",
    "Side Plank": "侧平板支撑",
    "Crunches": "卷腹",
    "Reverse Crunch": "反向卷腹",
    "Leg Raise": "举腿",
    "Sit-Up": "仰卧起坐",
    "V-Up": "V字起坐",
    "Woodchoppers": "伐木者",
    "Stiff-Legged Deadlift": "直腿硬拉",
    "Sumo Squat": "相扑深蹲",
    "Walking Lunges": "行走弓步",
    "Reverse Lunge": "后弓步",
    "Curtsy Lunge": "交叉弓步",
    "Hip Adduction": "髋内收",
    "Hip Abduction": "髋外展",
    "Donkey Calf Raises": "驴式提踵",
    "Single Leg Calf Raise": "单腿提踵",
    "Smith Machine Calf Raise": "史密斯提踵",
    "Barbell Front Raise": "杠铃前平举",
    "Cable Front Raise": "绳索前平举",
    "Cable Rear Delt Fly": "绳索反向飞鸟",
    "Prone Incline Curl": "俯身上斜弯举",
    "Palms-Down Wrist Curl Over A Bench": "反握腕弯举",
    "Wrist Roller": "卷腕器",
    "Plate Pinch": "捏杠铃片",
    "Tricep Dumbbell Kickback": "哑铃三头后伸",
    "Tate Press": "泰特推举",
    "JM Press": "JM推举",
    "Kneeling Cable Crunch": "跪姿绳索卷腹",
    "Toe Touchers": "手触脚趾",
    "Flutter Kicks": "交替抬腿",
    "Scissor Kick": "剪刀腿",
    "Knee Raise": "屈膝举腿",
    "Hollow Hold": "空心支撑",
    "Superman": "超人式",
    "Back Extension": "背伸展",
    "Rack Pull": "架上硬拉",
    "Deficit Deadlift": "垫高硬拉",
    "Trap Bar Deadlift": "六角杠硬拉",
    "Pendlay Row": "彭德雷划船",
    "Meadows Row": "梅多斯划船",
    "Seated Row": "坐姿划船",
    "Chest Supported Dumbbell Row": "俯身支撑哑铃划船",
    "Close-Grip Lat Pulldown": "窄握高位下拉",
    "Straight-Arm Pulldown": "直臂下拉",
    "Seal Row": "海豹划船",
    # --- Additional translations for 200+ target ---
    "Alternate Hammer Curl": "交替锤式弯举",
    "Alternate Incline Dumbbell Curl": "交替上斜哑铃弯举",
    "Alternating Cable Shoulder Press": "交替绳索肩推",
    "Alternating Deltoid Raise": "交替三角肌上举",
    "Alternating Floor Press": "交替地板卧推",
    "Alternating Kettlebell Press": "交替壶铃推举",
    "Alternating Kettlebell Row": "交替壶铃划船",
    "Alternating Renegade Row": "交替叛逆者划船",
    "Band Good Morning": "弹力带早安",
    "Band Pull Apart": "弹力带拉伸",
    "Band Skull Crusher": "弹力带碎颅者",
    "Barbell Ab Rollout - On Knees": "跪姿杠铃滚轮",
    "Barbell Full Squat": "杠铃全蹲",
    "Barbell Glute Bridge": "杠铃臀桥",
    "Barbell Hack Squat": "杠铃哈克深蹲",
    "Barbell Incline Bench Press - Medium Grip": "上斜杠铃卧推（中握距）",
    "Barbell Seated Calf Raise": "杠铃坐姿提踵",
    "Barbell Shoulder Press": "杠铃肩推",
    "Barbell Shrug Behind The Back": "杠铃身后耸肩",
    "Barbell Side Bend": "杠铃体侧屈",
    "Barbell Step Ups": "杠铃上台阶",
    "Barbell Walking Lunge": "杠铃行走弓步",
    "Bench Press - Powerlifting": "力量举卧推",
    "Bent Over Barbell Row": "杠铃俯身划船",
    "Bent Over Two-Dumbbell Row": "双哑铃俯身划船",
    "Bent-Arm Dumbbell Pullover": "屈臂哑铃仰卧上拉",
    "Bodyweight Squat": "徒手深蹲",
    "Bodyweight Walking Lunge": "徒手行走弓步",
    "Cable Chest Press": "绳索胸推",
    "Cable Deadlifts": "绳索硬拉",
    "Cable Lying Triceps Extension": "绳索仰卧三头臂屈伸",
    "Cable One Arm Tricep Extension": "单臂绳索三头伸展",
    "Cable Preacher Curl": "绳索传教士弯举",
    "Cable Reverse Crunch": "绳索反向卷腹",
    "Cable Russian Twists": "绳索俄罗斯转体",
    "Cable Seated Lateral Raise": "坐姿绳索侧平举",
    "Cable Shoulder Press": "绳索肩推",
    "Cable Shrugs": "绳索耸肩",
    "Cable Wrist Curl": "绳索腕弯举",
    "Calf Press On The Leg Press Machine": "腿举机提踵",
    "Clean": "翻站",
    "Clean Deadlift": "翻站硬拉",
    "Clean Pull": "翻站上拉",
    "Close-Grip Dumbbell Press": "窄握哑铃卧推",
    "Close-Grip Front Lat Pulldown": "窄握前高位下拉",
    "Close-Grip Standing Barbell Curl": "窄握站姿杠铃弯举",
    "Cross-Body Crunch": "交叉卷腹",
    "Decline Barbell Bench Press": "下斜杠铃卧推",
    "Decline Close-Grip Bench To Skull Crusher": "下斜窄握卧推转碎颅者",
    "Decline Dumbbell Flyes": "下斜哑铃飞鸟",
    "Decline EZ Bar Triceps Extension": "下斜曲杠三头臂屈伸",
    "Dip Machine": "助力双杠机",
    "Double Kettlebell Alternating Hang Clean": "双壶铃交替悬垂翻",
    "Dumbbell Bench Press with Neutral Grip": "对握哑铃卧推",
    "Dumbbell Clean": "哑铃翻站",
    "Dumbbell Front Raise": "哑铃前平举",
    "Dumbbell Goblet Squat": "哑铃高脚杯深蹲",
    "Dumbbell Incline Row": "上斜哑铃划船",
    "Dumbbell Lying Pronation": "哑铃俯卧旋前",
    "Dumbbell One-Arm Shoulder Press": "单臂哑铃肩推",
    "Dumbbell One-Arm Triceps Extension": "单臂哑铃三头臂屈伸",
    "Dumbbell Prone Incline Curl": "俯身上斜哑铃弯举",
    "Dumbbell Rear Lunge": "哑铃后弓步",
    "Dumbbell Seated One-Leg Calf Raise": "单腿坐姿哑铃提踵",
    "Dumbbell Squat": "哑铃深蹲",
    "Dumbbell Step Ups": "哑铃上台阶",
    "Dumbbell Sumo Squat": "哑铃相扑深蹲",
    "EZ-Bar Skullcrusher": "曲杠碎颅者",
    "Flat Bench Leg Pull-In": "平板凳屈膝收腿",
    "Floor Press": "地板卧推",
    "Front Cable Raise": "绳索前平举",
    "Front Plate Raise": "杠铃片前平举",
    "Front Squat (Clean Grip)": "前蹲（翻站握法）",
    "Full Range-Of-Motion Lat Pulldown": "全幅度高位下拉",
    "Gironda Sternum Chins": "胸骨引体向上",
    "Glute Ham Raise": "GHD挺身",
    "Groin and Back Stretch": "腹股沟背部拉伸",
    "Hammer Grip Incline DB Bench Press": "锤握上斜哑铃卧推",
    "Hang Clean": "悬垂翻",
    "Hang Snatch": "悬垂抓举",
    "Incline Barbell Bench Press": "上斜杠铃卧推",
    "Incline Cable Chest Press": "上斜绳索胸推",
    "Incline Dumbbell Bench Press With Palms Facing In": "对握上斜哑铃卧推",
    "Incline Hammer Curls": "上斜锤式弯举",
    "Incline Inner Biceps Curl": "上斜内旋弯举",
    "Intermediate Groin Stretch": "中级腹股沟拉伸",
    "Iron Cross": "铁十字",
    "Kettlebell Alternating Renegade Row": "壶铃交替叛逆者划船",
    "Kettlebell Clean": "壶铃翻站",
    "Kettlebell Dead Clean": "壶铃死停翻站",
    "Kettlebell Figure 8": "壶铃8字绕腿",
    "Kettlebell Goblet Squat": "壶铃高脚杯深蹲",
    "Kettlebell One-Legged Deadlift": "壶铃单腿硬拉",
    "Kettlebell Pistol Squat": "壶铃手枪式深蹲",
    "Kettlebell Snatch": "壶铃抓举",
    "Kettlebell Sumo Deadlift High Pull": "壶铃相扑硬拉高拉",
    "Kettlebell Thruster": "壶铃推举蹲",
    "Kettlebell Windmill": "壶铃风车",
    "Kneeling Squat": "跪姿深蹲",
    "Leverage Chest Press": "杠杆胸推",
    "Leverage Shrug": "杠杆耸肩",
    "Leverage Shoulder Press": "杠杆肩推",
    "Log Lift": "圆木举",
    "Lying Cable Curl": "仰卧绳索弯举",
    "Lying Close-Grip Barbell Triceps Extension Behind The Head": "仰卧窄握杠铃头后臂屈伸",
    "Lying Close-Grip Barbell Triceps Press To Chin": "仰卧窄握杠铃至下巴推",
    "Lying Dumbbell Tricep Extension": "仰卧哑铃三头臂屈伸",
    "Lying High Bench Barbell Curl": "高凳仰卧杠铃弯举",
    "Lying Machine Squat": "卧式器械深蹲",
    "Machine Bench Press": "器械卧推",
    "Machine Triceps Extension": "器械三头臂屈伸",
    "One Arm Chin-Up": "单臂引体向上",
    "One-Arm Dumbbell Preacher Curl": "单臂传教士弯举",
    "One Arm Dumbbell Row": "单臂哑铃划船",
    "One Arm Floor Press": "单臂地板卧推",
    "One Arm Lat Pulldown": "单臂高位下拉",
    "One Arm Pronated Dumbbell Triceps Extension": "单臂旋前三头伸展",
    "Overhead Cable Curl": "过头绳索弯举",
    "Overhead Squat": "过头深蹲",
    "Overhead Triceps Extension": "过头三头臂屈伸",
    "Pelvic Tilt Into Bridge": "骨盆倾斜桥",
    "Pin Presses": "插销卧推",
    "Platform Hamstring Slides": "平台腘绳肌滑动",
    "Power Snatch": "力量抓举",
    "Pullups": "引体向上",
    "Push Press": "借力推",
    "Push Press - Behind the Neck": "颈后借力推",
    "Pushups (Close and Wide Hand Positions)": "俯卧撑（窄宽握变式）",
    "Reverse Band Bench Press": "弹力带辅助卧推",
    "Reverse Barbell Preacher Curl": "反握传教士弯举",
    "Reverse Cable Curl": "反握绳索弯举",
    "Reverse Grip Bent-Over Rows": "反握俯身划船",
    "Reverse Grip Triceps Pushdown": "反握三头下压",
    "Reverse Machine Flyes": "器械反向飞鸟",
    "Reverse Plate Curls": "反握杠铃片弯举",
    "Ring Dips": "吊环臂屈伸",
    "Rocking Standing Calf Raise": "摇摆站姿提踵",
    "Rope Climb": "攀绳",
    "Rope Crunch": "绳索卷腹",
    "Seated Barbell Curl": "坐姿杠铃弯举",
    "Seated Bent-Over One-Arm Dumbbell Triceps Extension": "坐姿俯身单臂三头臂屈伸",
    "Seated Bent-Over Rear Delt Raise": "坐姿俯身后三角上举",
    "Seated Close-Grip Concentration Barbell Curl": "坐姿窄握集中弯举",
    "Seated Dumbbell Curl": "坐姿哑铃弯举",
    "Seated Dumbbell Inner Biceps Curl": "坐姿内旋哑铃弯举",
    "Seated Dumbbell Palms-Down Wrist Curl": "坐姿反握哑铃腕弯举",
    "Seated Flat Bench Leg Pull-In": "坐姿平板屈膝收腿",
    "Seated Overhead Press": "坐姿过头推",
    "Shotgun Row": "霰弹枪划船",
    "Side Bridge": "侧桥",
    "Single-Arm Cable Crossover": "单臂绳索夹胸",
    "Single-Arm Linear Jammer": "单臂地雷管推",
    "Single Leg Glute Bridge": "单腿臀桥",
    "Single Leg Push-off": "单腿蹬箱",
    "Smith Machine Behind the Back Shrug": "史密斯身后耸肩",
    "Smith Machine Bench Press": "史密斯卧推",
    "Smith Machine Close-Grip Bench Press": "史密斯窄握卧推",
    "Smith Machine Decline Press": "史密斯下斜卧推",
    "Smith Machine Incline Bench Press": "史密斯上斜卧推",
    "Smith Machine Overhead Press": "史密斯过头推",
    "Smith Machine Reverse Calf Raises": "史密斯反向提踵",
    "Smith Machine Shrug": "史密斯耸肩",
    "Smith Machine Squat": "史密斯深蹲",
    "Smith Machine Stiff-Legged Deadlift": "史密斯直腿硬拉",
    "Smith Machine Upright Row": "史密斯直立划船",
    "Smith Single-Leg Split Squat": "史密斯单腿分腿蹲",
    "Squat Jerk": "蹲举挺",
    "Squat with Chains": "链条深蹲",
    "Squat with Plate Movers": "杠铃片深蹲",
    "Standing Alternating Dumbbell Press": "站姿交替哑铃推举",
    "Standing Barbell Calf Raise": "站姿杠铃提踵",
    "Standing Barbell Press Behind Neck": "颈后杠铃推举",
    "Standing Bradford Press": "布拉德福德推举",
    "Standing Cable Chest Press": "站姿绳索胸推",
    "Standing Cable Lift": "站姿绳索上提",
    "Standing Cable Wood Chop": "站姿绳索伐木",
    "Standing Dumbbell Calf Raise": "站姿哑铃提踵",
    "Standing Dumbbell Press": "站姿哑铃推举",
    "Standing Dumbbell Reverse Curl": "站姿哑铃反握弯举",
    "Standing Dumbbell Straight-Arm Front Delt Raise Above Head": "站姿哑铃直臂前平举过头",
    "Standing Dumbbell Triceps Extension": "站姿哑铃三头臂屈伸",
    "Standing Dumbbell Upright Row": "站姿哑铃直立划船",
    "Standing Front Barbell Raise Over Head": "站姿杠铃前平举过头",
    "Standing Inner-Biceps Curl": "站姿内旋弯举",
    "Standing Low-Pulley Deltoid Raise": "站姿低位绳索侧平举",
    "Standing Low-Pulley One-Arm Triceps Extension": "站姿低位单臂三头伸展",
    "Standing Olympic Plate Hand Squeeze": "站姿捏杠铃片",
    "Standing One-Arm Cable Curl": "站姿单臂绳索弯举",
    "Standing One-Arm Dumbbell Curl Over Incline Bench": "上斜凳单臂哑铃弯举",
    "Standing Overhead Barbell Triceps Extension": "站姿过头杠铃三头臂屈伸",
    "Standing Palm-In One-Arm Dumbbell Press": "站姿对握单臂哑铃推",
    "Standing Palms-In Dumbbell Press": "站姿对握哑铃推举",
    "Standing Palms-Up Barbell Behind The Back Wrist Curl": "身后杠铃腕弯举",
    "Stiff Leg Barbell Good Morning": "杠铃直腿早安",
    "Stiff-Legged Barbell Deadlift": "杠铃直腿硬拉",
    "Stiff-Legged Dumbbell Deadlift": "哑铃直腿硬拉",
    "Straight Bar Bench Mid Rows": "直杠中位划船",
    "Suspended Push-Up": "悬挂俯卧撑",
    "Tire Flip": "翻轮胎",
    "Tricep Dumbbell Kickback": "哑铃三头后伸",
    "Triceps Overhead Extension with Rope": "绳索过头三头臂屈伸",
    "V-Bar Pulldown": "V杠下拉",
    "V-Bar Pullup": "V杠引体向上",
    "Weighted Bench Dip": "负重凳上臂屈伸",
    "Weighted Chin Up": "负重反握引体",
    "Weighted Crunches": "负重卷腹",
    "Weighted Pull Ups": "负重引体向上",
    "Weighted Sissy Squat": "负重西西深蹲",
    "Wide-Grip Barbell Curl": "宽握杠铃弯举",
    "Wide-Grip Decline Barbell Bench Press": "宽握下斜卧推",
    "Wide-Grip Decline Barbell Pullover": "宽握下斜杠铃仰卧上拉",
    "Wide-Grip Lat Pulldown": "宽握高位下拉",
    "Wide-Grip Rear Pull-Up": "宽握背后引体向上",
    "Wide-Grip Standing Barbell Curl": "宽握站姿杠铃弯举",
    "Zercher Squats": "泽奇深蹲",
}


def translate_name(name_en: str) -> str:
    """Look up Chinese translation, fall back to English."""
    if name_en in EXERCISE_NAME_ZH:
        return EXERCISE_NAME_ZH[name_en]
    # Try partial match
    for eng, zh in EXERCISE_NAME_ZH.items():
        if eng.lower() == name_en.lower():
            return zh
    return ""


def translate_instructions(instructions: list[str]) -> str:
    """Join English instructions as fallback."""
    return "；".join(instructions[:4]) if instructions else ""


def process():
    with open(SOURCE_PATH) as f:
        source_data = json.load(f)

    with open(EXISTING_PATH) as f:
        existing = json.load(f)

    existing_names = {e["name_en"].lower() for e in existing}

    # Filter and map source exercises
    new_exercises = []
    for ex in source_data:
        if ex.get("category") not in INCLUDE_CATEGORIES:
            continue
        equip = EQUIPMENT_MAP.get(ex.get("equipment"))
        if equip is None:
            continue
        primary = ex.get("primaryMuscles", [])
        if not primary:
            continue
        primary_group = MUSCLE_GROUP_MAP.get(primary[0])
        if not primary_group:
            continue

        name_en = ex["name"]
        # Skip duplicates
        if name_en.lower() in existing_names:
            continue

        name_zh = translate_name(name_en)
        if not name_zh:
            continue  # Only include exercises with Chinese translations

        secondary = []
        for m in ex.get("secondaryMuscles", []):
            g = MUSCLE_GROUP_MAP.get(m)
            if g and g != primary_group and g not in secondary:
                secondary.append(g)

        movement = infer_movement_pattern(name_en, ex.get("force"), primary)

        new_exercises.append({
            "name_zh": name_zh,
            "name_en": name_en,
            "primary_muscle_group": primary_group,
            "secondary_muscle_groups": secondary,
            "equipment": equip,
            "movement_pattern": movement,
            "difficulty": LEVEL_MAP.get(ex.get("level"), "intermediate"),
            "description_zh": f"目标肌肉：{primary_group}。" + (f"辅助肌群：{', '.join(secondary)}。" if secondary else ""),
            "instructions_zh": translate_instructions(ex.get("instructions", [])),
            "is_compound": ex.get("mechanic") == "compound",
        })
        existing_names.add(name_en.lower())

    merged = existing + new_exercises
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"Existing: {len(existing)}, New: {len(new_exercises)}, Total: {len(merged)}")

    # Distribution
    from collections import Counter
    groups = Counter(e["primary_muscle_group"] for e in merged)
    print(f"By muscle group: {dict(groups)}")


if __name__ == "__main__":
    process()
