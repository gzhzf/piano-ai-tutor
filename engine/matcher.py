# -*- coding: utf-8 -*-
"""
智能匹配引擎 - 琴乐启蒙AI导师
关键词分类 + 槽位提取 + 模板选择
"""

from .responses import RESPONSES


# ============ 意图关键词映射 ============
INTENT_KEYWORDS = {
    "lesson_plan": {
        "keywords": ["教案", "课程", "备课", "教学课", "教学设计", "帮我设计",
                     "一节课", "上课", "教学目标", "教学重点", "怎么练", "怎么教",
                     "练习曲", "拜厄", "车尔尼", "599"],
        "sub_keys": {
            "中央C": ["中央c", "中央c", "c音", "中央"],
            "节奏": ["节奏", "节拍", "四分音符", "八分音符"],
            "小星星": ["小星星", "一闪一闪"],
            "欢乐颂": ["欢乐颂", "贝多芬"],
            "小羊羔": ["小羊羔", "玛丽"],
            "巴赫": ["巴赫", "小步舞曲", "g大调"],
            "两只老虎": ["两只老虎", "frere"],
            "生日快乐": ["生日快乐", "happy birthday"],
            "铃儿响叮当": ["铃儿响叮当", "jingle"],
            "伦敦桥": ["伦敦桥"],
            "小蜜蜂": ["小蜜蜂"],
            "拜厄": ["拜厄", "beyer"],
            "车尔尼": ["车尔尼", "czerny", "599"],
            "小汤": ["小汤", "汤普森", "thompson"],
            "致爱丽丝": ["致爱丽丝", "for elise"],
            "土耳其进行曲": ["土耳其进行曲", "turkish march"],
            "天空之城": ["天空之城", "castle in the sky"],
            "千与千寻": ["千与千寻", "永远同在"],
            "小奏鸣曲": ["小奏鸣曲", "克莱门蒂", "clementi", "库劳", "kuhlau"],
        }
    },
    "parent_guide": {
        "keywords": ["陪练", "练琴", "不愿意", "不想练", "回家", "家长",
                     "孩子不", "没兴趣", "进度", "练习计划", "家庭"],
        "sub_keys": {
            "不愿意练琴": ["不愿意", "不想练", "没兴趣", "不练", "讨厌"],
            "陪练": ["陪练", "怎么练", "练习计划", "每天练", "练多久", "家庭练习"],
            "进度": ["进度", "怎么样", "学得", "表现", "反馈", "成绩"]
        }
    },
    "analysis": {
        "keywords": ["分析", "数据", "错音", "节奏不稳", "学情", "诊断",
                     "准确率", "问题", "评估", "驾驶舱", "装饰音", "弹不好", "弹不对"],
        "sub_keys": {
            "节奏不稳": ["节奏不稳", "节奏不", "忽快忽慢", "节拍不稳", "速度不"],
            "错音": ["错音", "弹错", "音不准", "按错", "错音率"],
            "巴赫": ["巴赫", "小步舞曲", "g大调", "anh", "装饰音", "波音"]
        }
    },
    "student_qa": {
        "keywords": ["中央c在哪", "琴键在哪", "在哪里", "什么是", "怎么找",
                     "手型", "怎么放", "手指", "节奏是什么", "是什么呀",
                     "教我", "黑键", "白键", "高音谱号", "节拍器"],
        "sub_keys": {
            "中央C": ["中央c在哪", "中央c在哪", "c在哪", "c在哪", "中央在哪", "c在哪", "中央c"],
            "手型": ["手型", "怎么放手", "手指怎么", "握鸡蛋", "怎么放"],
            "节奏": ["节奏是什么", "什么是节奏", "节拍是什么", "四分音符是什么", "怎么数拍", "节奏"],
            "黑键白键": ["黑键", "白键", "黑键和白键", "黑白键"],
            "高音谱号": ["高音谱号", "谱号", "g谱号"],
            "节拍器": ["节拍器", "节拍器是", "什么是节拍器"]
        }
    },
    "rhythm_train": {
        "keywords": ["节奏训练", "节拍训练", "练节奏", "节拍器", "节奏练习",
                     "节奏方案", "训练节奏"],
        "sub_keys": {}
    },
    "activity": {
        "keywords": ["游戏", "活动", "好玩", "课堂活动", "互动", "闯关",
                     "比赛", "趣味"],
        "sub_keys": {
            "中央C游戏": ["中央c游戏", "中央c游戏", "c游戏", "找中央c", "寻找中央"],
            "节奏游戏": ["节奏游戏", "节奏接龙", "节奏火车", "节奏活动"]
        }
    },
    "growth": {
        "keywords": ["档案", "进度", "成长", "轨迹", "里程碑", "学习记录",
                     "学了多少", "成长档案"],
        "sub_keys": {}
    }
}


def classify_intent(message):
    """
    意图分类：将用户消息分类到7大助手之一
    返回 (intent, sub_intent)
    """
    msg = message.lower().strip()

    # 按优先级匹配
    # 学生问答优先匹配（因为学生问题通常较短且具体）
    if any(k in msg for k in ["在哪", "是什么", "怎么找", "什么是"]):
        sub = _match_sub(msg, "student_qa")
        return "student_qa", sub

    # 逐个意图匹配
    best_intent = None
    best_score = 0

    for intent, config in INTENT_KEYWORDS.items():
        score = 0
        for kw in config["keywords"]:
            if kw in msg:
                score += len(kw)  # 长关键词权重更高
        if score > best_score:
            best_score = score
            best_intent = intent

    if best_intent and best_score > 0:
        sub = _match_sub(msg, best_intent)
        return best_intent, sub

    # 兜底
    return "fallback", None


def _match_sub(msg, intent):
    """子意图匹配"""
    config = INTENT_KEYWORDS.get(intent, {})
    for sub, keywords in config.get("sub_keys", {}).items():
        for kw in keywords:
            if kw in msg:
                return sub
    return None


def generate_response(message, role="teacher"):
    """
    生成回复：意图分类 → 选择模板 → 返回回复
    返回 (reply, intent, sub_intent)
    """
    intent, sub = classify_intent(message)

    # 兜底
    if intent == "fallback":
        return RESPONSES["fallback"], "fallback", None

    # 获取对应回复库
    resp_pool = RESPONSES.get(intent, {})

    # 尝试子意图
    if sub and sub in resp_pool:
        return resp_pool[sub], intent, sub

    # 尝试默认
    if "default" in resp_pool:
        return resp_pool["default"], intent, sub

    # 尝试第一个可用回复
    for key, val in resp_pool.items():
        if key != "default":
            return val, intent, key

    return RESPONSES["fallback"], "fallback", None


def get_quick_questions(role):
    """根据角色返回分类快捷问题"""
    questions = {
        "teacher": {
            "教案生成": [
                "帮我设计一节一年级中央C教学课",
                "帮我设计一节巴赫小步舞曲教学课",
                "帮我设计一节两只老虎教学课",
                "帮我设计一节天空之城教学课",
            ],
            "学情分析": [
                "帮我分析巴赫小步舞曲的学情",
                "帮我分析学生节奏不稳的问题",
                "帮我分析学生错音较多的问题",
            ],
            "课堂活动": [
                "设计一个中央C课堂游戏",
                "设计一个节奏接龙游戏",
            ],
            "教材教法": [
                "拜厄练习曲怎么练",
                "车尔尼599怎么教",
            ],
        },
        "parent": {
            "陪练指导": [
                "孩子不愿意练琴怎么办？",
                "每天练琴20分钟怎么安排？",
                "陪练时家长应该注意什么？",
            ],
            "进度反馈": [
                "孩子这周学习进度怎么样？",
                "孩子学琴多久能弹完整曲子？",
            ],
            "兴趣培养": [
                "怎么培养孩子练琴习惯？",
                "孩子弹错了要不要马上纠正？",
            ],
        },
        "student": {
            "趣味问答": [
                "中央C在哪里？",
                "手型应该怎么放？",
                "节奏是什么呀？",
            ],
            "钢琴知识": [
                "黑键和白键有什么区别？",
                "什么是高音谱号？",
                "节拍器是做什么的？",
            ],
        }
    }
    return questions.get(role, questions["teacher"])


def get_workflow_steps(params):
    """
    工作流演示：教案生成逐步输出
    返回5个步骤的内容
    """
    grade = params.get("grade", "一年级")
    content = params.get("content", "中央C")
    duration = params.get("duration", "15")

    # 根据内容选择模板
    content_map = {
        "中央C": ("中央C", "认识中央C位置"),
        "节奏": ("节奏", "四分与八分音符节奏"),
        "小星星": ("小星星", "弹奏《小星星》"),
    }
    topic, focus = content_map.get(content, ("中央C", "认识中央C位置"))

    steps = [
        {
            "title": "工作流1：教学目标生成",
            "content": f"知识目标：认识{topic}，掌握{focus}\n技能目标：完成稳定弹奏练习\n情感目标：激发学琴兴趣，培养乐感"
        },
        {
            "title": "工作流2：教学活动设计",
            "content": f"导入活动：「寻找{topic}」趣味动画\n节奏训练：Tomplay节拍器跟拍\n游戏环节：{topic}闯关游戏"
        },
        {
            "title": "工作流3：课堂评价生成",
            "content": "过程性评价：课堂参与度观察\n成果评价：全员合奏AI准确率检测\n反馈建议：个性化改进方向"
        },
        {
            "title": "工作流4：教案整合输出",
            "content": f"结构化教案已生成\n适用年级：{grade}\n课时时长：{duration}分钟\n包含：目标·重点·流程·活动·评价"
        },
        {
            "title": "✅ 完整教案",
            "content": RESPONSES["lesson_plan"].get(topic, RESPONSES["lesson_plan"]["中央C"]),
            "final": True
        }
    ]
    return steps
