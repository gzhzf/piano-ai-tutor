# -*- coding: utf-8 -*-
"""
琴乐启蒙AI导师 - Flask主应用
基于Tomplay智慧钢琴的小学低段钢琴启蒙智能体
"""
from flask import Flask, render_template, request, jsonify
from engine.matcher import generate_response, get_quick_questions, get_workflow_steps
from engine.knowledge_base import get_all_knowledge
from engine.repertoire import ALL_REPERTOIRE, LEVEL_INDEX, get_repertoire_by_level, search_repertoire
import hashlib, random, os, time

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 教学资源存储（内存中，重启后保留已上传文件但列表清空）
RESOURCES = []

app = Flask(__name__, static_folder="static", template_folder="templates")

# ============ 学生数据 ============
STUDENTS = [
    {"id": "s1", "name": "小明", "level": "初级", "avatar": "🧒"},
    {"id": "s2", "name": "小红", "level": "中级", "avatar": "👧"},
    {"id": "s3", "name": "小华", "level": "进阶", "avatar": "👦"},
]

# ============ 动态数据生成 ============
def generate_dashboard_data(student_id, piece_name):
    """根据学生+曲目生成动态学情数据"""
    student = next((s for s in STUDENTS if s["id"] == student_id), STUDENTS[0])

    # 用学生ID+曲目名做种子，确保同一组合数据一致
    seed_str = f"{student_id}_{piece_name}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    # 学生水平基准
    level_base = {"初级": (70, 85), "中级": (80, 92), "进阶": (88, 97)}
    base_low, base_high = level_base.get(student["level"], (75, 88))

    # 曲目难度系数（越难分数越低）
    piece_info = None
    for name, info in ALL_REPERTOIRE.items():
        if name in piece_name or piece_name in name:
            piece_info = info; break
    difficulty_mod = 0
    if piece_info:
        diff = piece_info.get("难度", "")
        if "3级" in diff: difficulty_mod = -8
        elif "2级" in diff: difficulty_mod = -4
        elif "1级" in diff: difficulty_mod = -2
        elif "零基础" in diff: difficulty_mod = 2

    # 生成各项指标
    rhythm = max(50, min(99, rng.randint(base_low, base_high) + difficulty_mod))
    pitch = max(50, min(99, rng.randint(base_low, base_high) + difficulty_mod + 2))
    completion = max(50, min(99, rng.randint(base_low - 3, base_high - 1) + difficulty_mod))
    fluency = max(50, min(99, rng.randint(base_low - 5, base_high - 3) + difficulty_mod))
    error_rate = max(1, 100 - pitch - rng.randint(0, 8))
    practice_min = rng.randint(80, 180)

    # 自动评分：节奏35%+音准30%+完整度20%+流畅度15%
    score = rhythm * 0.35 + pitch * 0.30 + completion * 0.20 + fluency * 0.15
    if score >= 90: rating, grade_color = "A", "#5FC9A8"
    elif score >= 80: rating, grade_color = "B+", "#4FC3F7"
    elif score >= 70: rating, grade_color = "B", "#FFB84D"
    elif score >= 60: rating, grade_color = "C", "#FF6B9D"
    else: rating, grade_color = "D", "#FF4444"

    # AI动态诊断
    diagnosis = []
    if rhythm < 85:
        diagnosis.append({"type": "warn", "text": f"节奏准确率{rhythm}%，低于目标值90%"})
    else:
        diagnosis.append({"type": "good", "text": f"节奏准确率{rhythm}%，表现稳定"})
    if error_rate > 10:
        diagnosis.append({"type": "warn", "text": f"错音率{error_rate}%，需加强音准练习"})
    else:
        diagnosis.append({"type": "good", "text": f"错音率{error_rate}%，控制良好"})
    if fluency >= 85:
        diagnosis.append({"type": "good", "text": f"演奏流畅度{fluency}%，乐句衔接自然"})
    else:
        diagnosis.append({"type": "warn", "text": f"演奏流畅度{fluency}%，注意乐句间衔接"})

    # 曲目针对性建议
    if piece_info:
        teaching_points = piece_info.get("教学要点", [])
        if teaching_points:
            diagnosis.append({"type": "suggest", "text": f"建议：重点练习「{teaching_points[0][:15]}」"})
        if len(teaching_points) > 1:
            diagnosis.append({"type": "suggest", "text": f"建议：{teaching_points[1][:20]}"})
    else:
        diagnosis.append({"type": "suggest", "text": "建议：慢速练习，确保每个音准确"})
        diagnosis.append({"type": "suggest", "text": "建议：使用跟灯模式辅助练习"})

    # 四周趋势数据（错音率下降）
    error_trend = [error_rate + 10, error_rate + 6, error_rate + 3, error_rate]

    # 本周练习时长（7天）
    practice_week = [rng.randint(10, 30) for _ in range(7)]
    practice_week[3] = 0  # 周四休息

    return {
        "student": {
            "id": student["id"], "name": student["name"],
            "level": student["level"], "avatar": student["avatar"],
            "piece": piece_name, "rating": rating,
            "grade_color": grade_color, "score": round(score, 1)
        },
        "metrics": {
            "rhythm": rhythm, "pitch": pitch,
            "completion": completion, "fluency": fluency,
            "error_rate": error_rate,
            "practice_minutes": practice_min,
            "error_trend": error_trend,
            "practice_week": practice_week
        },
        "score_detail": {
            "rhythm_weight": "35%", "pitch_weight": "30%",
            "completion_weight": "20%", "fluency_weight": "15%",
            "rhythm_score": rhythm, "pitch_score": pitch,
            "completion_score": completion, "fluency_score": fluency,
            "total_score": round(score, 1)
        },
        "diagnosis": diagnosis
    }

# ============ 七大助手信息 ============
ASSISTANTS = [
    {"id": "lesson_plan", "name": "教案生成助手", "icon": "📋", "color": "#FF6B9D",
     "desc": "自动生成结构化教案"},
    {"id": "activity", "name": "课堂活动助手", "icon": "🎮", "color": "#FFB84D",
     "desc": "设计游戏化课堂活动"},
    {"id": "rhythm_train", "name": "节奏训练助手", "icon": "⏱", "color": "#5FC9A8",
     "desc": "节拍稳定性训练方案"},
    {"id": "analysis", "name": "学情分析助手", "icon": "📊", "color": "#4FC3F7",
     "desc": "数据驱动教学诊断"},
    {"id": "parent_guide", "name": "家长指导助手", "icon": "🏠", "color": "#FF6B9D",
     "desc": "家庭陪练方案指导"},
    {"id": "growth", "name": "成长档案助手", "icon": "📈", "color": "#FFB84D",
     "desc": "学习轨迹记录"},
    {"id": "student_qa", "name": "学生问答助手", "icon": "🧒", "color": "#5FC9A8",
     "desc": "趣味儿童化问答"}
]

# ============ 路由 ============
@app.route("/")
def index():
    return render_template("index.html", students=STUDENTS)


@app.route("/api/dashboard")
def dashboard():
    """学情驾驶舱数据 — 动态生成"""
    student_id = request.args.get("student", "s1")
    piece = request.args.get("piece", "巴赫")
    # 从曲目库匹配
    piece_name = "巴赫小步舞曲Anh.114"
    for name in ALL_REPERTOIRE:
        if name in piece or piece in name:
            piece_name = name; break
    return jsonify(generate_dashboard_data(student_id, piece_name))


@app.route("/api/chat", methods=["POST"])
def chat():
    """对话接口"""
    data = request.json
    message = data.get("message", "").strip()
    role = data.get("role", "teacher")

    if not message:
        return jsonify({"error": "消息不能为空"}), 400

    # 生成回复
    reply, intent, sub_intent = generate_response(message, role)

    # 找到对应助手信息
    assistant_info = None
    for a in ASSISTANTS:
        if a["id"] == intent:
            assistant_info = a
            break

    # 确定动画类型（学生问答时配动画）
    animation = None
    if intent == "student_qa" and sub_intent:
        animation = sub_intent  # "中央C" / "手型" / "节奏"
    elif intent == "rhythm_train":
        animation = "节奏"
    elif intent == "teaching_assist" and sub_intent == "舞蹈路线图":
        animation = "dance_map"
    elif intent == "teaching_assist" and sub_intent == "节奏游戏":
        animation = "rhythm_game"

    # 检查是否有上传的教学资源可引用
    related_resources = []
    if intent == "lesson_plan":
        for r in RESOURCES:
            if r.get("piece") and (r["piece"] in message or message in r["piece"] or
               any(k in r["piece"] for k in ["巴赫", "小步舞曲", "小星星", "欢乐颂"] if k in message)):
                related_resources.append({"filename": r["filename"], "url": r["url"], "type": r["type"]})

    return jsonify({
        "reply": reply,
        "intent": intent,
        "assistant": assistant_info,
        "role": role,
        "animation": animation,
        "resources": related_resources
    })


@app.route("/api/comic", methods=["POST"])
def comic():
    """生成教案漫画（对话式分格）"""
    data = request.json
    topic = data.get("topic", "中央C")

    # 每格：speaker + text + action + expression + scene_type(场景动画类型)
    comics = {
        "中央C": [
            {"speaker": "teacher", "text": "同学们，今天我们来认识钢琴上最重要的音——中央C！", "action": "课堂导入", "expression": "smile", "scene": "piano_intro"},
            {"speaker": "teacher", "text": "看这里！两个黑键左边第一个白键，就是中央C哦~", "action": "教师示范", "expression": "explain", "scene": "find_c"},
            {"speaker": "student", "text": "老师我找到了！用大拇指轻轻按一下...叮咚！", "action": "学生弹奏", "expression": "happy", "scene": "press_c"},
            {"speaker": "ai", "text": "跟灯模式已开启，LED灯会指引你弹对位置~", "action": "AI辅助", "expression": "help", "scene": "led_guide"},
            {"speaker": "ai", "text": "太棒了！准确率95%，中央C弹对了！", "action": "AI反馈", "expression": "praise", "scene": "score_95"},
            {"speaker": "teacher", "text": "你真棒！「中央C侦探」勋章送给你！", "action": "颁发勋章", "expression": "proud", "scene": "medal"},
        ],
        "巴赫": [
            {"speaker": "teacher", "text": "今天我们学巴赫G大调小步舞曲，先听一遍感受3/4拍~", "action": "聆听曲目", "expression": "smile", "scene": "music_34"},
            {"speaker": "student", "text": "老师，右手D5开始弹吗？大拇指起句对吗？", "action": "分手练习", "expression": "think", "scene": "right_hand"},
            {"speaker": "ai", "text": "对的！60BPM慢速跟灯，Visual guide关联五线谱~", "action": "跟灯慢练", "expression": "help", "scene": "led_slow"},
            {"speaker": "student", "text": "装饰音这里有点难...上波音G-A-G总是弹慢", "action": "遇到困难", "expression": "worry", "scene": "ornament"},
            {"speaker": "ai", "text": "别急！循环练习这个小节10遍，十次法则！", "action": "循环攻坚", "expression": "encourage", "scene": "loop_10"},
            {"speaker": "teacher", "text": "双手合奏很优雅！巴洛克风格满分！", "action": "成果展示", "expression": "proud", "scene": "both_hands"},
        ],
        "default": [
            {"speaker": "teacher", "text": "今天我们来学一首新曲子，准备好了吗？", "action": "课堂导入", "expression": "smile", "scene": "piano_intro"},
            {"speaker": "student", "text": "准备好了！我先看谱子认识音符~", "action": "识谱", "expression": "think", "scene": "read_score"},
            {"speaker": "student", "text": "跟灯慢练，一个音一个音弹准...", "action": "跟灯练习", "expression": "focus", "scene": "led_guide"},
            {"speaker": "ai", "text": "检测到2个错音，已高亮标记，注意这里~", "action": "AI纠错", "expression": "help", "scene": "error_mark"},
            {"speaker": "student", "text": "再来一遍！这次准确率98%了！", "action": "再次练习", "expression": "happy", "scene": "score_98"},
            {"speaker": "teacher", "text": "进步很大！继续加油，下周学新曲子~", "action": "课堂总结", "expression": "proud", "scene": "medal"},
        ]
    }

    if "巴赫" in topic or "小步舞曲" in topic:
        panels = comics["巴赫"]
    elif "中央C" in topic or "中央c" in topic:
        panels = comics["中央C"]
    else:
        panels = comics["default"]

    return jsonify({"topic": topic, "panels": panels})


# ============ 曲目音符数据（用于演奏动画）============
# 每首曲目：音符序列 [(音名, 起始拍, 时值拍, 手), ...]
# 手: R=右手, L=左手
PIECE_NOTES = {
    "中央C": [
        ("C4", 0, 1, "R"), ("C4", 1, 1, "R"), ("C4", 2, 1, "R"), ("C4", 3, 1, "R"),
        ("G3", 0, 4, "L"),
    ],
    "小星星": [
        ("C4",0,1,"R"),("C4",1,1,"R"),("G4",2,1,"R"),("G4",3,1,"R"),
        ("A4",4,1,"R"),("A4",5,1,"R"),("G4",6,2,"R"),
        ("F4",8,1,"R"),("F4",9,1,"R"),("E4",10,1,"R"),("E4",11,1,"R"),
        ("D4",12,1,"R"),("D4",13,1,"R"),("C4",14,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "欢乐颂": [
        ("E4",0,1,"R"),("E4",1,1,"R"),("F4",2,1,"R"),("G4",3,1,"R"),
        ("G4",4,1,"R"),("F4",5,1,"R"),("E4",6,1,"R"),("D4",7,1,"R"),
        ("C4",8,1,"R"),("C4",9,1,"R"),("D4",10,1,"R"),("E4",11,1,"R"),
        ("E4",12,1.5,"R"),("D4",13.5,0.5,"R"),("D4",14,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "两只老虎": [
        ("C4",0,1,"R"),("D4",1,1,"R"),("E4",2,1,"R"),("C4",3,1,"R"),
        ("C4",4,1,"R"),("D4",5,1,"R"),("E4",6,1,"R"),("C4",7,1,"R"),
        ("E4",8,1,"R"),("F4",9,1,"R"),("G4",10,2,"R"),
        ("E4",12,1,"R"),("F4",13,1,"R"),("G4",14,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "玛丽有只小羊羔": [
        ("E4",0,1,"R"),("D4",1,1,"R"),("C4",2,1,"R"),("D4",3,1,"R"),
        ("E4",4,1,"R"),("E4",5,1,"R"),("E4",6,2,"R"),
        ("D4",8,1,"R"),("D4",9,1,"R"),("D4",10,2,"R"),
        ("E4",12,1,"R"),("G4",13,1,"R"),("G4",14,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "巴赫": [
        ("D5",0,2,"R"),("G4",2,1,"R"),
        ("A4",3,1,"R"),("B4",4,1,"R"),("C5",5,1,"R"),
        ("B4",6,1.5,"R"),("A4",7.5,0.5,"R"),("G4",8,1,"R"),
        ("A4",9,1.5,"R"),("D5",10.5,0.5,"R"),("D5",11,1,"R"),
        ("G3",0,3,"L"),("G3",3,3,"L"),("G3",6,3,"L"),
        ("F3",9,3,"L"),
    ],
    "生日快乐歌": [
        ("C4",0,0.75,"R"),("C4",0.75,0.25,"R"),("D4",1,1,"R"),("C4",2,1,"R"),("F4",3,1,"R"),("E4",4,2,"R"),
        ("C4",6,0.75,"R"),("C4",6.75,0.25,"R"),("D4",7,1,"R"),("C4",8,1,"R"),("G4",9,1,"R"),("F4",10,2,"R"),
        ("C3",0,4,"L"),("F3",4,4,"L"),("C3",8,4,"L"),
    ],
    "铃儿响叮当": [
        ("E4",0,1,"R"),("E4",1,1,"R"),("E4",2,2,"R"),
        ("E4",4,1,"R"),("E4",5,1,"R"),("E4",6,2,"R"),
        ("E4",8,1,"R"),("G4",9,1,"R"),("C4",10,1.5,"R"),("D4",11.5,0.5,"R"),
        ("E4",12,4,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "天空之城": [
        ("G4",0,1,"R"),("A4",1,1,"R"),("B4",2,1.5,"R"),("A4",3.5,0.5,"R"),
        ("G4",4,1,"R"),("E4",5,1,"R"),("E4",6,2,"R"),
        ("D4",8,1,"R"),("E4",9,1,"R"),("G4",10,1.5,"R"),("E4",11.5,0.5,"R"),
        ("D4",12,4,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    # === 以下为补充曲目 ===
    "伦敦桥": [
        ("G4",0,1,"R"),("A4",1,1,"R"),("G4",2,1,"R"),("E4",3,1,"R"),
        ("C4",4,1,"R"),("D4",5,1,"R"),("E4",6,2,"R"),
        ("D4",8,1,"R"),("E4",9,1,"R"),("F4",10,1,"R"),("D4",11,1,"R"),
        ("E4",12,1,"R"),("C4",13,1,"R"),("D4",14,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "小蜜蜂": [
        ("G4",0,1,"R"),("E4",1,1,"R"),("E4",2,1,"R"),("F4",3,1,"R"),
        ("G4",4,1,"R"),("G4",5,1,"R"),("A4",6,2,"R"),
        ("G4",8,1,"R"),("E4",9,1,"R"),("E4",10,1,"R"),("F4",11,1,"R"),
        ("D4",12,1,"R"),("D4",13,1,"R"),("C4",14,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),("G3",12,4,"L"),
    ],
    "划船歌": [
        ("C4",0,1,"R"),("E4",1,0.5,"R"),("G4",1.5,0.5,"R"),
        ("C4",2,1,"R"),("E4",3,0.5,"R"),("G4",3.5,0.5,"R"),
        ("A4",4,1,"R"),("G4",5,1,"R"),("E4",6,1,"R"),("C4",7,1,"R"),
        ("G4",8,1,"R"),("E4",9,1,"R"),("C4",10,2,"R"),
        ("C3",0,4,"L"),("G3",4,4,"L"),("C3",8,4,"L"),
    ],
    "致爱丽丝": [
        ("E5",0,0.5,"R"),("D#5",0.5,0.5,"R"),("E5",1,0.5,"R"),("D#5",1.5,0.5,"R"),
        ("E5",2,0.5,"R"),("B4",2.5,0.5,"R"),("D5",3,0.5,"R"),("C5",3.5,0.5,"R"),
        ("A4",4,1,"R"),("C4",5,0.5,"R"),("E4",5.5,0.5,"R"),("A4",6,0.5,"R"),
        ("B4",6.5,1,"R"),
        ("A3",0,2,"L"),("E4",2,2,"L"),("A4",4,2,"L"),
    ],
    "土耳其进行曲": [
        ("B4",0,0.5,"R"),("A4",0.5,0.5,"R"),("G#4",1,0.5,"R"),("A4",1.5,0.5,"R"),
        ("B4",2,0.5,"R"),("C5",2.5,0.5,"R"),("B4",3,0.5,"R"),("A4",3.5,0.5,"R"),
        ("G#4",4,0.5,"R"),("A4",4.5,0.5,"R"),("B4",5,0.5,"R"),("C5",5.5,0.5,"R"),
        ("B4",6,1,"R"),("A4",7,1,"R"),
        ("A3",0,2,"L"),("E4",2,2,"L"),("A3",4,2,"L"),("E4",6,2,"L"),
    ],
    "千与千寻": [
        ("F4",0,1,"R"),("G4",1,1,"R"),("A4",2,1.5,"R"),("G4",3.5,0.5,"R"),
        ("F4",4,1,"R"),("D4",5,1,"R"),("F4",6,2,"R"),
        ("C4",8,1,"R"),("D4",9,1,"R"),("F4",10,1.5,"R"),("D4",11.5,0.5,"R"),
        ("C4",12,4,"R"),
        ("F3",0,4,"L"),("C4",4,4,"L"),("F3",8,4,"L"),("C4",12,4,"L"),
    ],
    "巴赫Anh115": [
        ("G4",0,1,"R"),("B4",1,1,"R"),("D5",2,1,"R"),
        ("C5",3,1,"R"),("B4",4,1,"R"),("A4",5,1,"R"),
        ("G4",6,1.5,"R"),("F#4",7.5,0.5,"R"),("G4",8,1,"R"),
        ("B4",9,1,"R"),("A4",10,1,"R"),("G4",11,1,"R"),
        ("G3",0,3,"L"),("D4",3,3,"L"),("G3",6,3,"L"),("D4",9,3,"L"),
    ],
    "巴赫Anh116": [
        ("G4",0,1,"R"),("B4",1,0.5,"R"),("D5",1.5,0.5,"R"),
        ("G4",2,1,"R"),("B4",3,0.5,"R"),("D5",3.5,0.5,"R"),
        ("C5",4,1,"R"),("B4",5,1,"R"),("A4",6,1,"R"),("G4",7,1,"R"),
        ("D5",8,1,"R"),("C5",9,1,"R"),("B4",10,2,"R"),
        ("G3",0,4,"L"),("D4",4,4,"L"),("G3",8,4,"L"),
    ],
    "巴赫Anh119": [
        ("G4",0,1.5,"R"),("A4",1.5,0.5,"R"),("B4",2,1,"R"),
        ("C5",3,1,"R"),("B4",4,1.5,"R"),("A4",5.5,0.5,"R"),
        ("G4",6,1,"R"),("F#4",7,1,"R"),("G4",8,2,"R"),
        ("G3",0,3,"L"),("D4",3,3,"L"),("G3",6,3,"L"),
    ],
    "巴赫Anh122": [
        ("D5",0,1,"R"),("C#5",1,1,"R"),("D5",2,1,"R"),("E5",3,1,"R"),
        ("F#5",4,1,"R"),("E5",5,1,"R"),("D5",6,1,"R"),("C#5",7,1,"R"),
        ("D5",8,1.5,"R"),("E5",9.5,0.5,"R"),("F#5",10,1,"R"),("G5",11,1,"R"),
        ("A5",12,2,"R"),
        ("D3",0,4,"L"),("A3",4,4,"L"),("D3",8,4,"L"),("A3",12,2,"L"),
    ],
    # 练习曲型曲目（用调性音阶/练习型音符表示）
    "拜厄": [
        ("C4",0,1,"R"),("D4",1,1,"R"),("E4",2,1,"R"),("F4",3,1,"R"),
        ("G4",4,1,"R"),("F4",5,1,"R"),("E4",6,1,"R"),("D4",7,1,"R"),
        ("C4",8,2,"R"),("G3",10,2,"R"),("E3",12,2,"R"),("C3",14,2,"R"),
        ("C3",0,2,"L"),("G3",2,2,"L"),("C4",4,2,"L"),("G3",6,2,"L"),
        ("C3",8,2,"L"),("G3",10,2,"L"),("C3",12,2,"L"),("G3",14,2,"L"),
    ],
    "小汤": [
        ("C4",0,1,"R"),("D4",1,1,"R"),("E4",2,1,"R"),("F4",3,1,"R"),
        ("G4",4,1,"R"),("F4",5,1,"R"),("E4",6,1,"R"),("D4",7,1,"R"),
        ("C4",8,4,"R"),
        ("C3",0,2,"L"),("G3",2,2,"L"),("C3",4,2,"L"),("G3",6,2,"L"),
        ("C3",8,4,"L"),
    ],
    "央音": [
        ("G4",0,1,"R"),("A4",1,1,"R"),("B4",2,1,"R"),("C5",3,1,"R"),
        ("D5",4,1,"R"),("C5",5,1,"R"),("B4",6,1,"R"),("A4",7,1,"R"),
        ("G4",8,1.5,"R"),("A4",9.5,0.5,"R"),("B4",10,1,"R"),("A4",11,1,"R"),
        ("G4",12,4,"R"),
        ("G3",0,4,"L"),("D4",4,4,"L"),("G3",8,4,"L"),("D4",12,4,"L"),
    ],
    "小奏鸣曲": [
        ("C4",0,1,"R"),("E4",1,1,"R"),("G4",2,1,"R"),("C5",3,1,"R"),
        ("B4",4,1,"R"),("G4",5,1,"R"),("E4",6,1,"R"),("C4",7,1,"R"),
        ("D4",8,1,"R"),("F4",9,1,"R"),("A4",10,1,"R"),("D5",11,1,"R"),
        ("C5",12,2,"R"),("G4",14,2,"R"),
        ("C3",0,2,"L"),("G3",2,2,"L"),("C3",4,2,"L"),("G3",6,2,"L"),
        ("G3",8,2,"L"),("D4",10,2,"L"),("G3",12,2,"L"),("C3",14,2,"L"),
    ],
    "车尔尼": [
        ("C4",0,1,"R"),("E4",1,1,"R"),("G4",2,1,"R"),("C5",3,1,"R"),
        ("G4",4,1,"R"),("E4",5,1,"R"),("C4",6,1,"R"),("E4",7,1,"R"),
        ("D4",8,1,"R"),("F4",9,1,"R"),("A4",10,1,"R"),("D5",11,1,"R"),
        ("A4",12,1,"R"),("F4",13,1,"R"),("D4",14,2,"R"),
        ("C3",0,2,"L"),("G3",2,2,"L"),("C3",4,2,"L"),("G3",6,2,"L"),
        ("G3",8,2,"L"),("D4",10,2,"L"),("G3",12,2,"L"),("C3",14,2,"L"),
    ],
}

@app.route("/api/play")
def play_piece():
    """获取曲目音符数据（用于演奏动画）"""
    import urllib.parse
    topic = urllib.parse.unquote(request.args.get("topic", ""))
    # 匹配曲目 — 最长key优先匹配（更具体的优先）
    piece_key = None
    best_len = 0
    for key in PIECE_NOTES:
        if key in topic and len(key) > best_len:
            piece_key = key
            best_len = len(key)
    if not piece_key:
        piece_key = "小星星"  # 默认

    notes = PIECE_NOTES[piece_key]
    return jsonify({"piece": piece_key, "notes": notes, "count": len(notes)})


@app.route("/api/quick-questions")
def quick_questions():
    """快捷问题"""
    role = request.args.get("role", "teacher")
    return jsonify({"questions": get_quick_questions(role)})


@app.route("/api/workflow", methods=["POST"])
def workflow():
    """工作流演示"""
    data = request.json
    params = {
        "grade": data.get("grade", "一年级"),
        "content": data.get("content", "中央C"),
        "duration": data.get("duration", "15")
    }
    steps = get_workflow_steps(params)
    return jsonify({"steps": steps, "params": params})


@app.route("/api/knowledge")
def knowledge():
    """知识库数据（RAG展示）"""
    return jsonify(get_all_knowledge())


# ============ 教学资源上传与管理 ============
@app.route("/api/upload", methods=["POST"])
def upload_file():
    """上传教案/曲谱文件"""
    if "file" not in request.files:
        return jsonify({"error": "未选择文件"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "文件名为空"}), 400

    file_type = request.form.get("type", "score")  # score=曲谱, plan=教案
    piece = request.form.get("piece", "")

    # 安全文件名
    safe_name = f"resource_{int(time.time())}_{f.filename}"
    safe_name = safe_name.replace(" ", "_").replace("/", "_")
    filepath = os.path.join(UPLOAD_DIR, safe_name)
    f.save(filepath)

    is_image = f.filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))

    resource = {
        "id": f"r{len(RESOURCES) + 1}",
        "filename": f.filename,
        "type": file_type,
        "piece": piece,
        "url": f"/static/uploads/{safe_name}",
        "is_image": is_image,
        "size": os.path.getsize(filepath),
        "time": int(time.time())
    }
    RESOURCES.append(resource)
    return jsonify({"success": True, "resource": resource})


@app.route("/api/resources")
def get_resources():
    """获取教学资源列表"""
    piece = request.args.get("piece", "")
    if piece:
        filtered = [r for r in RESOURCES if piece in r.get("piece", "") or r.get("piece", "") in piece]
    else:
        filtered = RESOURCES
    return jsonify({"resources": filtered, "count": len(filtered)})


@app.route("/api/resources/<rid>", methods=["DELETE"])
def delete_resource(rid):
    """删除教学资源"""
    global RESOURCES
    target = None
    for r in RESOURCES:
        if r["id"] == rid:
            target = r
            break
    if target:
        try:
            os.remove(os.path.join(UPLOAD_DIR, os.path.basename(target["url"])))
        except:
            pass
        RESOURCES = [r for r in RESOURCES if r["id"] != rid]
        return jsonify({"success": True})
    return jsonify({"error": "资源不存在"}), 404


@app.route("/api/resources/check")
def check_resources():
    """检查某曲目是否有关联资源（对话中引用）"""
    piece = request.args.get("piece", "")
    matched = [r for r in RESOURCES if piece and (piece in r.get("piece", "") or r.get("piece", "") in piece)]
    return jsonify({"has_resources": len(matched) > 0, "resources": matched})


@app.route("/api/repertoire")
def repertoire():
    """曲目库数据"""
    level = request.args.get("level", "")
    if level:
        names = get_repertoire_by_level(level)
        result = {name: ALL_REPERTOIRE[name] for name in names if name in ALL_REPERTOIRE}
        return jsonify({"level": level, "count": len(result), "pieces": result})
    return jsonify({"count": len(ALL_REPERTOIRE), "pieces": ALL_REPERTOIRE, "level_index": LEVEL_INDEX})


@app.route("/api/repertoire/search")
def repertoire_search():
    """曲目搜索"""
    q = request.args.get("q", "")
    if not q:
        return jsonify({"results": []})
    results = search_repertoire(q)
    return jsonify({"query": q, "count": len(results), "results": results})


@app.route("/api/lesson-plans")
def lesson_plans():
    """教案列表 — 按难度分组的可选教案"""
    from engine.repertoire import ALL_REPERTOIRE, LEVEL_INDEX
    groups = []
    level_labels = {"零基础": "零基础入门", "预备级": "预备级", "1级": "1级基础", "2级": "2级进阶", "3级": "3级提升"}
    for level, names in LEVEL_INDEX.items():
        pieces = []
        for name in names:
            if name in ALL_REPERTOIRE:
                info = ALL_REPERTOIRE[name]
                pieces.append({
                    "name": name,
                    "difficulty": info.get("难度", ""),
                    "key": info.get("调性", ""),
                    "time_sig": info.get("拍号", ""),
                    "tomplay": info.get("Tomplay功能", "")
                })
        if pieces:
            groups.append({"level": level, "label": level_labels.get(level, level), "pieces": pieces})
    return jsonify({"groups": groups, "total": len(ALL_REPERTOIRE)})


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    print("=" * 50)
    print("🎹 琴乐启蒙AI导师 已启动")
    print(f"📱 访问地址: http://localhost:{port}")
    print("💡 按 Ctrl+C 停止服务")
    print("=" * 50)
    app.run(host="0.0.0.0", port=port, debug=False)
