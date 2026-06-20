# -*- coding: utf-8 -*-
"""
琴乐启蒙AI导师 - Flask主应用
基于Tomplay智慧钢琴的小学低段钢琴启蒙智能体
"""
from flask import Flask, render_template, request, jsonify
from engine.matcher import generate_response, get_quick_questions, get_workflow_steps
from engine.knowledge_base import get_all_knowledge
from engine.repertoire import ALL_REPERTOIRE, LEVEL_INDEX, get_repertoire_by_level, search_repertoire

app = Flask(__name__, static_folder="static", template_folder="templates")

# ============ 学情驾驶舱数据 ============
DASHBOARD_DATA = {
    "student": {
        "name": "学生A",
        "grade": "一年级",
        "week": "第4周",
        "piece": "巴赫《G大调小步舞曲》",
        "rating": "B+"
    },
    "metrics": {
        "rhythm_accuracy": 82,
        "pitch_accuracy": 89,
        "hand_posture": 91,
        "error_rate": 11,
        "practice_minutes": 128
    },
    "charts": {
        "rhythm": "/static/img/charts/d_rhythm.png",
        "pitch": "/static/img/charts/d_pitch.png",
        "hand": "/static/img/charts/d_hand.png",
        "errors": "/static/img/charts/b_errors.png",
        "minutes": "/static/img/charts/b_minutes.png",
        "radar": "/static/img/charts/r_focus.png"
    },
    "diagnosis": [
        {"type": "warn", "text": "节奏准确率82%，低于目标值90%"},
        {"type": "warn", "text": "错音率11%，集中在四分音符长音"},
        {"type": "good", "text": "手型规范度良好，保持现有训练"},
        {"type": "suggest", "text": "建议：加强四分音符专项节奏训练"},
        {"type": "suggest", "text": "建议：增加跟灯模式循环练习5分钟"}
    ]
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
    return render_template("index.html",
                           assistants=ASSISTANTS,
                           dashboard=DASHBOARD_DATA)


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

    return jsonify({
        "reply": reply,
        "intent": intent,
        "assistant": assistant_info,
        "role": role,
        "animation": animation
    })


@app.route("/api/comic", methods=["POST"])
def comic():
    """生成教案漫画（SVG分格）"""
    data = request.json
    topic = data.get("topic", "中央C")

    # 根据主题生成6格漫画内容
    comics = {
        "中央C": [
            {"scene": "导入", "char": "老师", "emoji": "👩‍🏫", "bg": "#FFF5F8",
             "text": "今天我们来认识钢琴最重要的音——中央C！", "color": "#FF6B9D"},
            {"scene": "示范", "char": "老师", "emoji": "🎹", "bg": "#FFF8EE",
             "text": "看，两个黑键左边第一个白键就是中央C", "color": "#FFB84D"},
            {"scene": "练习", "char": "学生", "emoji": "🧒", "bg": "#F0FCF8",
             "text": "找到了！用大拇指轻轻按一下~", "color": "#5FC9A8"},
            {"scene": "跟灯", "char": "AI助手", "emoji": "💡", "bg": "#F0F8FF",
             "text": "跟灯模式开启，LED灯指引你弹对位置", "color": "#4FC3F7"},
            {"scene": "纠错", "char": "AI助手", "emoji": "✅", "bg": "#F0FCF8",
             "text": "太棒了！准确率95%，中央C弹对了！", "color": "#5FC9A8"},
            {"scene": "鼓励", "char": "老师", "emoji": "🌟", "bg": "#FFF5F8",
             "text": "你真棒！中央C侦探勋章送给你！", "color": "#FF6B9D"},
        ],
        "巴赫": [
            {"scene": "聆听", "char": "老师", "emoji": "👂", "bg": "#FFF5F8",
             "text": "先听一遍巴赫小步舞曲，感受3/4拍韵律", "color": "#FF6B9D"},
            {"scene": "分手", "char": "学生", "emoji": "✋", "bg": "#FFF8EE",
             "text": "右手先练D5下行音阶，大拇指起句", "color": "#FFB84D"},
            {"scene": "跟灯", "char": "AI助手", "emoji": "💡", "bg": "#F0F8FF",
             "text": "60BPM慢速跟灯，Visual guide关联五线谱", "color": "#4FC3F7"},
            {"scene": "循环", "char": "AI助手", "emoji": "🔄", "bg": "#F0FCF8",
             "text": "装饰音小节循环10遍，十次法则！", "color": "#5FC9A8"},
            {"scene": "合手", "char": "学生", "emoji": "🤲", "bg": "#FFF8EE",
             "text": "双手合奏！第一拍重音，强-弱-弱", "color": "#FFB84D"},
            {"scene": "展示", "char": "老师", "emoji": "👏", "bg": "#FFF5F8",
             "text": "优雅的小步舞曲！巴洛克风格满分！", "color": "#FF6B9D"},
        ],
        "default": [
            {"scene": "导入", "char": "老师", "emoji": "👩‍🏫", "bg": "#FFF5F8",
             "text": "今天我们来学一首新曲子！", "color": "#FF6B9D"},
            {"scene": "识谱", "char": "老师", "emoji": "📖", "bg": "#FFF8EE",
             "text": "先看谱子，认识音符和节奏", "color": "#FFB84D"},
            {"scene": "练习", "char": "学生", "emoji": "🧒", "bg": "#F0FCF8",
             "text": "跟灯慢练，一个音一个音弹准", "color": "#5FC9A8"},
            {"scene": "纠错", "char": "AI助手", "emoji": "✅", "bg": "#F0F8FF",
             "text": "AI检测准确率，错音即时提醒", "color": "#4FC3F7"},
            {"scene": "熟练", "char": "学生", "emoji": "🎹", "bg": "#FFF8EE",
             "text": "越来越熟练了！加速练习", "color": "#FFB84D"},
            {"scene": "鼓励", "char": "老师", "emoji": "🌟", "bg": "#FFF5F8",
             "text": "太棒了！继续加油！", "color": "#FF6B9D"},
        ]
    }

    # 选择漫画内容
    if "巴赫" in topic or "小步舞曲" in topic:
        panels = comics["巴赫"]
    elif "中央C" in topic or "中央c" in topic:
        panels = comics["中央C"]
    else:
        panels = comics["default"]

    return jsonify({"topic": topic, "panels": panels})


@app.route("/api/quick-questions")
def quick_questions():
    """快捷问题"""
    role = request.args.get("role", "teacher")
    return jsonify({"questions": get_quick_questions(role)})


@app.route("/api/dashboard")
def dashboard():
    """学情驾驶舱数据"""
    return jsonify(DASHBOARD_DATA)


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
