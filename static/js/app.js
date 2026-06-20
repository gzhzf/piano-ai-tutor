/* ===== 琴乐启蒙AI导师 前端交互 ===== */
let currentRole = "teacher";
let isTyping = false;

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const quickQuestions = document.getElementById("quickQuestions");

// ===== 视图切换 =====
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
        document.getElementById("view-" + view).classList.add("active");
    });
});

// ===== 角色切换 =====
document.querySelectorAll(".role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        currentRole = btn.dataset.role;
        document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadQuickQuestions();
    });
});

// ===== 帮助弹窗 =====
const helpBtn = document.getElementById("helpBtn");
const helpOverlay = document.getElementById("helpOverlay");
const helpClose = document.getElementById("helpClose");
helpBtn.addEventListener("click", () => helpOverlay.classList.add("show"));
helpClose.addEventListener("click", () => helpOverlay.classList.remove("show"));
helpOverlay.addEventListener("click", (e) => { if (e.target === helpOverlay) helpOverlay.classList.remove("show"); });

// ===== 快捷问题加载（分类） =====
async function loadQuickQuestions() {
    try {
        const res = await fetch(`/api/quick-questions?role=${currentRole}`);
        const data = await res.json();
        quickQuestions.innerHTML = "";
        for (const [category, questions] of Object.entries(data.questions)) {
            const cat = document.createElement("div");
            cat.className = "qq-category";
            const title = document.createElement("div");
            title.className = "qq-category-title";
            title.textContent = category;
            const btns = document.createElement("div");
            btns.className = "qq-btns";
            questions.forEach(q => btns.appendChild(makeQQBtn(q)));
            cat.appendChild(title);
            cat.appendChild(btns);
            quickQuestions.appendChild(cat);
        }
    } catch (e) { console.error(e); }
}

function makeQQBtn(question) {
    const btn = document.createElement("button");
    btn.className = "qq-btn";
    btn.textContent = question;
    btn.addEventListener("click", () => { chatInput.value = question; sendMessage(); });
    return btn;
}

// ===== 发送消息 =====
function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg || isTyping) return;
    const welcome = chatMessages.querySelector(".welcome-msg");
    if (welcome) welcome.remove();
    appendMessage(msg, "user");
    chatInput.value = "";
    chatInput.style.height = "auto";
    showTyping();
    isTyping = true; sendBtn.disabled = true;
    fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, role: currentRole })
    })
    .then(res => res.json())
    .then(data => {
        hideTyping();
        typewriterAppend(data.reply, data.assistant, data.animation, msg, data.intent);
        isTyping = false; sendBtn.disabled = false;
    })
    .catch(() => {
        hideTyping(); appendMessage("抱歉，出了点小问题，请重试", "ai");
        isTyping = false; sendBtn.disabled = false;
    });
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
chatInput.addEventListener("input", () => { chatInput.style.height = "auto"; chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px"; });

// ===== 消息气泡 =====
function appendMessage(text, sender, assistant) {
    const msg = document.createElement("div");
    msg.className = "msg msg-" + sender;
    if (sender === "ai") {
        const avatar = document.createElement("div");
        avatar.className = "ai-avatar"; avatar.textContent = assistant ? assistant.icon : "🎹";
        const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.innerHTML = formatText(text);
        msg.appendChild(avatar); msg.appendChild(bubble);
    } else {
        const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.textContent = text;
        msg.appendChild(bubble);
    }
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== 打字机效果 =====
function typewriterAppend(text, assistant, animation, userMsg, intent) {
    const msg = document.createElement("div"); msg.className = "msg msg-ai";
    const avatar = document.createElement("div"); avatar.className = "ai-avatar"; avatar.textContent = assistant ? assistant.icon : "🎹";
    const bubble = document.createElement("div"); bubble.className = "bubble";
    msg.appendChild(avatar); msg.appendChild(bubble); chatMessages.appendChild(msg);
    const formatted = formatText(text);
    let i = 0;
    function type() {
        if (i < formatted.length) {
            bubble.innerHTML = formatted.substring(0, i + 1); i += 2;
            chatMessages.scrollTop = chatMessages.scrollHeight; setTimeout(type, 12);
        } else {
            bubble.innerHTML = formatted;
            // 打字结束后添加动画
            if (animation) {
                setTimeout(() => appendAnimation(msg, animation), 300);
            }
            // 教案类回复添加漫画按钮
            if (intent === "lesson_plan" && userMsg) {
                setTimeout(() => appendComicButton(bubble, userMsg), animation ? 1500 : 300);
            }
        }
    }
    type();
}

// ===== 教案漫画按钮 =====
function appendComicButton(bubble, userMsg) {
    const btn = document.createElement("button");
    btn.className = "comic-btn";
    btn.textContent = "🎨 查看漫画教案";
    btn.addEventListener("click", () => loadComic(userMsg, btn));
    bubble.appendChild(btn);
}

// ===== 加载教案漫画 =====
async function loadComic(userMsg, btn) {
    const bubble = btn.parentElement;
    btn.disabled = true; btn.textContent = "生成中...";
    try {
        const res = await fetch("/api/comic", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: userMsg })
        });
        const data = await res.json();
        btn.remove();
        const comicEl = document.createElement("div");
        comicEl.className = "comic-strip";
        data.panels.forEach((p, idx) => {
            const panel = document.createElement("div");
            panel.className = "comic-panel comic-speaker-" + p.speaker;
            panel.innerHTML = `
                <div class="comic-panel-header">
                    <span class="comic-panel-num">${idx + 1}</span>
                    <span class="comic-action">${p.action}</span>
                </div>
                <div class="comic-scene-wrap">
                    ${svgChar(p.speaker, p.expression)}
                    <div class="comic-dialogue">
                        <div class="comic-speaker-name">${speakerName(p.speaker)}</div>
                        <div class="comic-dialogue-text">${p.text}</div>
                    </div>
                </div>
            `;
            comicEl.appendChild(panel);
        });
        bubble.appendChild(comicEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch(e) {
        console.error("漫画加载失败:", e);
        btn.disabled = false; btn.textContent = "🎨 查看漫画教案（重试）";
    }
}

function speakerName(s) {
    return { teacher: "老师", student: "小明", ai: "AI助手" }[s] || s;
}

// SVG卡通人物头像
function svgChar(type, expression) {
    const w = 80, h = 90;
    let svg = `<svg viewBox="0 0 ${w} ${h}" class="comic-char-svg">`;

    if (type === "teacher") {
        // 老师：长发+眼镜+微笑
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>`;
        // 头发
        svg += `<path d="M20,30 Q20,12 40,12 Q60,12 60,30 L60,55 Q60,60 55,58 L50,50 L30,50 L25,58 Q20,60 20,55 Z" fill="#4A3F8E"/>`;
        // 脸
        svg += `<ellipse cx="40" cy="38" rx="16" ry="18" fill="#FFD9B8"/>`;
        // 眼镜
        svg += `<circle cx="34" cy="36" r="5" fill="none" stroke="#4A3F8E" stroke-width="1.5"/>`;
        svg += `<circle cx="46" cy="36" r="5" fill="none" stroke="#4A3F8E" stroke-width="1.5"/>`;
        svg += `<line x1="39" y1="36" x2="41" y2="36" stroke="#4A3F8E" stroke-width="1.5"/>`;
        // 表情
        if (expression === "proud") {
            svg += `<path d="M33,44 Q40,50 47,44" fill="none" stroke="#C44" stroke-width="1.5"/>`;
            svg += `<text x="54" y="30" font-size="10">✨</text>`;
        } else if (expression === "explain") {
            svg += `<path d="M35,46 L45,46" fill="none" stroke="#C44" stroke-width="1.5"/>`;
            svg += `<circle cx="34" cy="35" r="1.5" fill="#333"/><circle cx="46" cy="35" r="1.5" fill="#333"/>`;
        } else {
            svg += `<path d="M33,44 Q40,48 47,44" fill="none" stroke="#C44" stroke-width="1.5"/>`;
            svg += `<circle cx="34" cy="35" r="1.5" fill="#333"/><circle cx="46" cy="35" r="1.5" fill="#333"/>`;
        }
        // 身体（衣服）
        svg += `<path d="M28,60 L52,60 L56,85 L24,85 Z" fill="#FF6B9D"/>`;
        svg += `<rect x="38" y="60" width="4" height="10" fill="#E55588"/>`;

    } else if (type === "student") {
        // 学生：小男孩平头+圆脸
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>`;
        // 头发（短发）
        svg += `<path d="M22,32 Q22,14 40,14 Q58,14 58,32 L56,28 L52,30 L48,28 L44,30 L40,28 L36,30 L32,28 L28,30 L24,28 Z" fill="#3A2D1A"/>`;
        // 脸
        svg += `<ellipse cx="40" cy="36" rx="16" ry="17" fill="#FFE0C0"/>`;
        // 眼睛
        if (expression === "happy") {
            svg += `<path d="M32,34 Q34,32 36,34" fill="none" stroke="#333" stroke-width="1.5"/>`;
            svg += `<path d="M44,34 Q46,32 48,34" fill="none" stroke="#333" stroke-width="1.5"/>`;
            svg += `<path d="M34,42 Q40,48 46,42" fill="none" stroke="#C44" stroke-width="1.5"/>`;
        } else if (expression === "worry") {
            svg += `<circle cx="34" cy="35" r="1.5" fill="#333"/><circle cx="46" cy="35" r="1.5" fill="#333"/>`;
            svg += `<path d="M35,44 Q40,41 45,44" fill="none" stroke="#C44" stroke-width="1.5"/>`;
            svg += `<text x="56" y="28" font-size="10">💧</text>`;
        } else if (expression === "focus") {
            svg += `<line x1="32" y1="35" x2="36" y2="35" stroke="#333" stroke-width="2"/>`;
            svg += `<line x1="44" y1="35" x2="48" y2="35" stroke="#333" stroke-width="2"/>`;
            svg += `<path d="M36,43 L44,43" fill="none" stroke="#C44" stroke-width="1.5"/>`;
        } else {
            svg += `<circle cx="34" cy="35" r="1.5" fill="#333"/><circle cx="46" cy="35" r="1.5" fill="#333"/>`;
            svg += `<path d="M35,42 Q40,45 45,42" fill="none" stroke="#C44" stroke-width="1.5"/>`;
        }
        // 身体（T恤）
        svg += `<path d="M28,56 L52,56 L54,85 L26,85 Z" fill="#4FC3F7"/>`;

    } else if (type === "ai") {
        // AI助手：机器人+天线+屏幕脸
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>`;
        // 天线
        svg += `<line x1="40" y1="14" x2="40" y2="8" stroke="#4A3F8E" stroke-width="2"/>`;
        svg += `<circle cx="40" cy="7" r="3" fill="#FF6B9D"/>`;
        // 头（圆角矩形）
        svg += `<rect x="22" y="14" width="36" height="38" rx="8" fill="#E8E5F5" stroke="#4A3F8E" stroke-width="2"/>`;
        // 屏幕脸
        svg += `<rect x="26" y="20" width="28" height="20" rx="4" fill="#2D2A4A"/>`;
        // 眼睛（LED风格）
        if (expression === "praise" || expression === "encourage") {
            svg += `<circle cx="34" cy="30" r="3" fill="#5FC9A8"/>`;
            svg += `<circle cx="46" cy="30" r="3" fill="#5FC9A8"/>`;
            svg += `<path d="M34,35 Q40,38 46,35" fill="none" stroke="#5FC9A8" stroke-width="1.5"/>`;
        } else {
            svg += `<circle cx="34" cy="30" r="3" fill="#4FC3F7"/>`;
            svg += `<circle cx="46" cy="30" r="3" fill="#4FC3F7"/>`;
            svg += `<line x1="35" y1="36" x2="45" y2="36" stroke="#4FC3F7" stroke-width="1.5"/>`;
        }
        // 身体
        svg += `<rect x="26" y="52" width="28" height="25" rx="4" fill="#4A3F8E"/>`;
        svg += `<circle cx="34" cy="64" r="2" fill="#FFB84D"/>`;
        svg += `<circle cx="40" cy="64" r="2" fill="#5FC9A8"/>`;
        svg += `<circle cx="46" cy="64" r="2" fill="#FF6B9D"/>`;
    }

    svg += `</svg>`;
    return svg;
}

// ===== 内嵌Canvas动画 =====

// Web Audio 钢琴音色合成
let audioCtx = null;
function getAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
    return audioCtx;
}
// 播放钢琴音：freq频率, dur时长秒, vol音量0-1
function playNote(freq, dur = 0.5, vol = 0.3) {
    const ac = getAudio(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle"; // 三角波模拟钢琴
    osc.frequency.setValueAtTime(freq, t);
    // 钢琴包络：快起慢落
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t); osc.stop(t + dur);
}
// 钢琴频率（中央C=261.63Hz）
const NOTE_FREQ = { "C4":261.63, "C#4":277.18, "D4":293.66, "D#4":311.13, "E4":329.63, "F4":349.23, "F#4":369.99, "G4":392.00, "G#4":415.30, "A4":440.00, "A#4":466.16, "B4":493.88, "C5":523.25, "C#5":554.37, "D5":587.33, "D#5":622.25, "E5":659.25, "F5":698.46 };
// 拍手声（噪声短脉冲）
function playClap(vol = 0.2) {
    const ac = getAudio(); if (!ac) return;
    const t = ac.currentTime;
    const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ac.createBufferSource(); src.buffer = buf;
    const gain = ac.createGain(); gain.gain.value = vol;
    src.connect(gain); gain.connect(ac.destination);
    src.start(t);
}

function appendAnimation(msgEl, type) {
    const container = document.createElement("div");
    container.className = "anim-container";
    const canvas = document.createElement("canvas");
    canvas.className = "anim-canvas";
    canvas.width = 320; canvas.height = 140;
    container.appendChild(canvas);
    msgEl.querySelector(".bubble").appendChild(container);
    const ctx = canvas.getContext("2d");

    if (type === "中央C") return animFindMiddleC(ctx, canvas);
    if (type === "手型") return animHandShape(ctx, canvas);
    if (type === "节奏") return animRhythm(ctx, canvas);
    if (type === "黑键白键") return animBlackWhite(ctx, canvas);
    if (type === "高音谱号") return animTrebleClef(ctx, canvas);
    if (type === "节拍器") return animMetronome(ctx, canvas);
}

// 动画1：寻找中央C — 钢琴键盘高亮2黑键→左白键
function animFindMiddleC(ctx, cv) {
    const W = cv.width, H = cv.height;
    const wkW = 28, bkW = 18, bkH = 55, wkH = 90;
    const startX = (W - wkW * 10) / 2;
    const keys = [];
    for (let i = 0; i < 10; i++) keys.push({ x: startX + i * wkW, isBlack: false, lit: false, isC: false });
    const blackOffsets = [0.7, 1.7, 3.7, 4.7, 5.7];
    const blacks = [];
    for (let oct = 0; oct < 2; oct++) {
        for (const off of blackOffsets) {
            if (oct === 0 && off > 2.5) continue;
            blacks.push({ x: startX + (oct * 7 + off) * wkW, isBlack: true, lit: false });
        }
    }
    const cIndex = 3;
    let phase = 0, frame = 0;
    let lastPhase = -1;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // 阶段切换时播放音效
        if (phase !== lastPhase) {
            lastPhase = phase;
            if (phase === 2) playNote(NOTE_FREQ["C4"], 0.3, 0.15); // 找到黑键时轻声
            if (phase === 3) playNote(NOTE_FREQ["C4"], 0.3, 0.2);  // 指向白键
            if (phase === 4) playNote(NOTE_FREQ["C4"], 1.0, 0.35); // 中央C！响亮
        }
        keys.forEach((k, i) => {
            let color = "#FFFFFF";
            if (phase >= 3 && i === cIndex) {
                color = phase >= 4 ? `rgba(255,107,157,${0.5 + 0.4 * Math.sin(frame * 0.15)})` : "#FF6B9D";
            }
            ctx.fillStyle = color;
            ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
            ctx.fillRect(k.x, 15, wkW - 1, wkH); ctx.strokeRect(k.x, 15, wkW - 1, wkH);
        });
        blacks.forEach((b, i) => {
            let color = "#2D2A4A";
            if (phase >= 2 && phase < 4 && i < 2) color = "#FFB84D";
            ctx.fillStyle = color;
            ctx.fillRect(b.x, 15, bkW, bkH);
        });
        ctx.textAlign = "center";
        if (phase === 0) { ctx.fillStyle = "#6B688A"; ctx.font = "13px 微软雅黑"; ctx.fillText("钢琴键盘", W/2, 125); }
        else if (phase >= 2 && phase < 3) { ctx.fillStyle = "#FFB84D"; ctx.font = "bold 12px 微软雅黑"; ctx.fillText("← 两个黑键", blacks[1].x + 9, 10); }
        else if (phase >= 3 && phase < 4) { ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 12px 微软雅黑"; ctx.fillText("← 左边白键", keys[cIndex].x + 14, 10); }
        else if (phase >= 4) {
            ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 14px 微软雅黑";
            ctx.fillText("中央C (Do)", keys[cIndex].x + 14, 125);
            // 闪烁时重复播放C音
            if (frame % 80 === 0 && frame > 160) playNote(NOTE_FREQ["C4"], 0.5, 0.25);
        }
        frame++;
        if (frame % 40 === 0 && phase < 4) phase++;
        if (frame < 400) requestAnimationFrame(draw);
    }
    draw();
}

// 动画2：手型 — 握鸡蛋手型示意
function animHandShape(ctx, cv) {
    const W = cv.width, H = cv.height;
    let frame = 0;
    let lastFinger = -1;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2 + 10;
        const eggY = cy - 15 + Math.sin(frame * 0.05) * 3;

        ctx.strokeStyle = "#4A3F8E"; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy + 20, 60, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        const fingerColors = ["#FF6B9D", "#FFB84D", "#5FC9A8", "#4FC3F7", "#4A3F8E"];
        const fingerNotes = ["C4", "D4", "E4", "F4", "G4"];
        // 逐个手指高亮+发声（每60帧亮一个）
        const activeFinger = Math.floor(frame / 60) % 5;
        if (activeFinger !== lastFinger && frame < 300) {
            lastFinger = activeFinger;
            playNote(NOTE_FREQ[fingerNotes[activeFinger]], 0.3, 0.2);
        }

        for (let i = 0; i < 5; i++) {
            const angle = Math.PI * 1.15 + (i / 4) * (Math.PI * 0.7);
            const fx = cx + Math.cos(angle) * 60;
            const fy = cy + 20 + Math.sin(angle) * 60;
            const tipX = cx + Math.cos(angle) * 95;
            const tipY = cy + 20 + Math.sin(angle) * 95;
            // 活跃手指更粗更亮
            const isActive = i === activeFinger && frame < 360;
            ctx.strokeStyle = fingerColors[i]; ctx.lineWidth = isActive ? 9 : 6; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tipX, tipY); ctx.stroke();
            ctx.fillStyle = fingerColors[i];
            ctx.beginPath(); ctx.arc(tipX, tipY, isActive ? 7 : 5, 0, Math.PI * 2); ctx.fill();
            // 指法编号
            ctx.fillStyle = isActive ? fingerColors[i] : "#AAAAAA";
            ctx.font = isActive ? "bold 12px 微软雅黑" : "10px 微软雅黑";
            ctx.textAlign = "center";
            ctx.fillText(i + 1, tipX, tipY + 18);
        }

        // 鸡蛋
        ctx.fillStyle = "rgba(255,184,77,0.8)";
        ctx.beginPath(); ctx.ellipse(cx, eggY, 16, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#FFB84D"; ctx.lineWidth = 2; ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#6B688A"; ctx.font = "12px 微软雅黑";
        ctx.fillText("手心握鸡蛋，不能捏碎", cx, 12);

        frame++;
        if (frame < 500) requestAnimationFrame(draw);
    }
    draw();
}

// 动画3：节奏 — 下落音符方块（四分/八分/二分）+ 拍点声
function animRhythm(ctx, cv) {
    const W = cv.width, H = cv.height;
    const lineY = H - 25;
    const notes = [
        { start: 0, dur: 30, color: "#FF6B9D", label: "ta", freq: NOTE_FREQ["C4"] },
        { start: 30, dur: 30, color: "#FF6B9D", label: "ta", freq: NOTE_FREQ["D4"] },
        { start: 60, dur: 15, color: "#FFB84D", label: "ti", freq: NOTE_FREQ["E4"] },
        { start: 75, dur: 15, color: "#FFB84D", label: "ti", freq: NOTE_FREQ["F4"] },
        { start: 90, dur: 30, color: "#FF6B9D", label: "ta", freq: NOTE_FREQ["G4"] },
        { start: 120, dur: 60, color: "#4FC3F7", label: "ta-a", freq: NOTE_FREQ["C5"] },
    ];
    const fallSpeed = 2.5;
    const totalFrames = 200;
    let frame = 0;
    let playedNotes = new Set();

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(255,107,157,0.4)"; ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W, lineY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#FF6B9D"; ctx.font = "10px 微软雅黑"; ctx.textAlign = "left";
        ctx.fillText("弹奏线", 4, lineY - 4);

        const colW = W / 6;
        notes.forEach((n, i) => {
            const noteFrame = frame - n.start * 2;
            if (noteFrame < 0 || noteFrame > n.dur * 2 + 20) return;
            const x = colW * i + 10;
            const h = n.dur * 1.2;
            let y;
            if (noteFrame < 30) { y = lineY - h - (30 - noteFrame) * fallSpeed; }
            else { y = lineY - h; }

            // 音符到达弹奏线时播放声音
            if (noteFrame >= 30 && !playedNotes.has(i)) {
                playedNotes.add(i);
                playNote(n.freq, n.dur > 30 ? 0.8 : 0.3, 0.25);
                playClap(0.15); // 拍手声
            }

            // 到达时方块发光
            const hit = noteFrame >= 30 && noteFrame < 36;
            ctx.fillStyle = hit ? "#FFFFFF" : n.color;
            ctx.fillRect(x, y, colW - 20, h);
            if (hit) { ctx.fillStyle = n.color; ctx.fillRect(x + 2, y + 2, colW - 24, h - 4); }
            ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText(n.label, x + (colW - 20) / 2, y + h / 2 + 3);
        });

        const beat = Math.floor(frame / 30) % 4;
        ctx.fillStyle = "#6B688A"; ctx.font = "11px 微软雅黑"; ctx.textAlign = "center";
        const labels = ["四分", "四分", "八分八分", "四分"];
        ctx.fillText(labels[beat] || "", W/2, 12);

        frame++;
        if (frame < totalFrames) requestAnimationFrame(draw);
    }
    draw();
}

// 动画4：黑键白键区别 — 键盘上交替高亮黑白键+播放对应音
function animBlackWhite(ctx, cv) {
    const W = cv.width, H = cv.height;
    const wkW = 26, bkW = 16, bkH = 50, wkH = 85;
    const startX = (W - wkW * 11) / 2;
    // 白键音阶C D E F G A B C
    const whiteNotes = ["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5"];
    // 黑键位置+音名
    const blackKeys = [
        { off: 0.7, note: "C#4" }, { off: 1.7, note: "D#4" },
        { off: 3.7, note: "F#4" }, { off: 4.7, note: "G#4" }, { off: 5.7, note: "A#4" },
        { off: 7.7, note: "C#5" }, { off: 8.7, note: "D#5" },
        { off: 10.7, note: "F#5" }
    ];
    let frame = 0;
    let phase = 0; // 0=白键演示, 1=黑键演示, 2=合在一起
    let lastPlayed = -1;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // 白键
        for (let i = 0; i < 11; i++) {
            let color = "#FFFFFF";
            if (phase === 0 && Math.floor(frame / 20) % 8 === i && frame < 160) {
                color = "#5FC9A8";
                if (i !== lastPlayed) { lastPlayed = i; playNote(NOTE_FREQ[whiteNotes[i]], 0.3, 0.2); }
            }
            ctx.fillStyle = color; ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
            ctx.fillRect(startX + i * wkW, 18, wkW - 1, wkH); ctx.strokeRect(startX + i * wkW, 18, wkW - 1, wkH);
        }
        // 黑键
        lastPlayed = -1;
        for (let i = 0; i < blackKeys.length; i++) {
            const bk = blackKeys[i];
            let color = "#2D2A4A";
            if (phase === 1 && Math.floor(frame / 20) % 5 === i && frame >= 160 && frame < 280) {
                color = "#FFB84D";
                if (i !== lastPlayed) { lastPlayed = i; playNote(NOTE_FREQ[bk.note] || 277, 0.25, 0.2); }
            }
            ctx.fillStyle = color;
            ctx.fillRect(startX + bk.off * wkW, 18, bkW, bkH);
        }
        // 标注
        ctx.textAlign = "center";
        if (phase === 0) { ctx.fillStyle = "#5FC9A8"; ctx.font = "bold 12px 微软雅黑"; ctx.fillText("白键 = do re mi fa sol la si（基本音）", W/2, 12); }
        else if (phase === 1) { ctx.fillStyle = "#FFB84D"; ctx.font = "bold 12px 微软雅黑"; ctx.fillText("黑键 = 升号降号（半步音）", W/2, 12); }
        else { ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 12px 微软雅黑"; ctx.fillText("黑白合在一起 = 钢琴所有音！", W/2, 12); }

        frame++;
        if (frame === 160) { phase = 1; lastPlayed = -1; }
        if (frame === 280) phase = 2;
        if (frame < 380) requestAnimationFrame(draw);
    }
    draw();
}

// 动画5：高音谱号 — 螺旋绘制+标注G线+中央C位置
function animTrebleClef(ctx, cv) {
    const W = cv.width, H = cv.height;
    let frame = 0;
    // 五线谱5条线
    const lineStartX = 30, lineEndX = W - 30;
    const lineSpacing = 14;
    const lineY0 = H / 2 - lineSpacing * 2;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // 五线谱
        ctx.strokeStyle = "#6B688A"; ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const y = lineY0 + i * lineSpacing;
            ctx.beginPath(); ctx.moveTo(lineStartX, y); ctx.lineTo(lineEndX, y); ctx.stroke();
        }
        // 线标注
        ctx.fillStyle = "#AAAAAA"; ctx.font = "9px 微软雅黑"; ctx.textAlign = "right";
        const lineNames = ["E4", "G4", "B4", "D5", "F5"];
        for (let i = 0; i < 5; i++) {
            ctx.fillText(lineNames[i], lineStartX - 4, lineY0 + i * lineSpacing + 3);
        }

        // 高音谱号（简化为螺旋曲线）
        const clefX = 50, clefCenterY = lineY0 + lineSpacing * 1; // G线位置
        const progress = Math.min(frame / 60, 1); // 0-60帧绘制
        ctx.strokeStyle = "#4A3F8E"; ctx.lineWidth = 3; ctx.lineCap = "round";

        // 绘制螺旋（用贝塞尔曲线近似）
        if (progress > 0) {
            ctx.beginPath();
            const steps = Math.floor(progress * 40);
            for (let s = 0; s <= steps; s++) {
                const t = s / 40;
                const angle = t * Math.PI * 3;
                const r = 12 * (1 - t * 0.5);
                const x = clefX + Math.cos(angle - Math.PI/2) * r;
                const y = clefCenterY + Math.sin(angle - Math.PI/2) * r + t * 20;
                if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 绘制完成后标注
        if (frame >= 60) {
            // G线高亮
            ctx.strokeStyle = "#FF6B9D"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(lineStartX, lineY0 + lineSpacing); ctx.lineTo(lineEndX, lineY0 + lineSpacing); ctx.stroke();
            ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 11px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("G线 (sol)", W/2, lineY0 + lineSpacing - 4);

            // 播放G音
            if (frame === 60) playNote(NOTE_FREQ["G4"], 0.5, 0.25);
        }
        if (frame >= 100) {
            // 中央C标注（下加一线）
            const cY = lineY0 + lineSpacing * 5 + 3;
            ctx.strokeStyle = "#5FC9A8"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(lineStartX, cY); ctx.lineTo(lineEndX, cY); ctx.stroke();
            ctx.fillStyle = "#5FC9A8"; ctx.font = "bold 11px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("下加一线 = 中央C (do)", W/2, cY + 14);
            // 画一个音符
            ctx.fillStyle = "#5FC9A8";
            ctx.beginPath(); ctx.ellipse(W/2 + 40, cY, 5, 4, -0.3, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = "#5FC9A8"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(W/2 + 45, cY); ctx.lineTo(W/2 + 45, cY - 25); ctx.stroke();
            // 播放C音
            if (frame === 100) playNote(NOTE_FREQ["C4"], 0.5, 0.25);
        }
        if (frame >= 150) {
            ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 12px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("高音谱号 = 右手的家", W/2, 12);
            if (frame === 150) playNote(NOTE_FREQ["G4"], 0.3, 0.2);
        }

        frame++;
        if (frame < 300) requestAnimationFrame(draw);
    }
    draw();
}

// 动画6：节拍器 — 摆杆摆动+嗒嗒声+BPM数字
function animMetronome(ctx, cv) {
    const W = cv.width, H = cv.height;
    let frame = 0;
    const bpm = 80; // 每分钟80拍
    const beatInterval = 60 / bpm * 1000 / (1000/60); // 帧/拍 ≈ 45帧
    let lastBeat = -1;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2, baseY = H - 20;

        // 节拍器底座（三角形）
        ctx.fillStyle = "#4A3F8E";
        ctx.beginPath();
        ctx.moveTo(cx - 35, baseY); ctx.lineTo(cx + 35, baseY); ctx.lineTo(cx + 20, baseY - 70); ctx.lineTo(cx - 20, baseY - 70);
        ctx.closePath(); ctx.fill();

        // 摆杆
        const beat = Math.floor(frame / 45);
        const beatProgress = (frame % 45) / 45;
        const angle = Math.sin(beatProgress * Math.PI) * 0.5 - 0.25; // -0.25到0.25弧度
        const pendulumY = baseY - 65;
        const tipX = cx + Math.sin(angle) * 50;
        const tipY = pendulumY - Math.cos(angle) * 50;

        ctx.strokeStyle = "#FFB84D"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx, pendulumY); ctx.lineTo(tipX, tipY); ctx.stroke();
        // 摆锤
        ctx.fillStyle = "#FF6B9D";
        ctx.beginPath(); ctx.arc(tipX, tipY, 6, 0, Math.PI*2); ctx.fill();

        // 节拍指示灯
        const beatNum = beat % 4;
        const isStrong = beatNum === 0;
        const litColor = isStrong ? "#FF6B9D" : "#5FC9A8";
        const justBeat = beatProgress < 0.15;

        // 4个拍点灯
        for (let i = 0; i < 4; i++) {
            const bx = cx - 36 + i * 24;
            const lit = i === beatNum && justBeat;
            ctx.fillStyle = lit ? litColor : "#E8E5F5";
            ctx.beginPath(); ctx.arc(bx, baseY - 80, 5, 0, Math.PI*2); ctx.fill();
        }

        // BPM数字
        ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 20px 微软雅黑"; ctx.textAlign = "center";
        ctx.fillText("♩=" + bpm, cx, baseY - 95);

        // 标注
        ctx.fillStyle = isStrong ? "#FF6B9D" : "#5FC9A8"; ctx.font = "bold 12px 微软雅黑";
        const labels = ["强", "弱", "弱", "弱"];
        ctx.fillText(labels[beatNum], cx, 14);

        // 播放嗒嗒声
        if (beat !== lastBeat) {
            lastBeat = beat;
            playClap(isStrong ? 0.3 : 0.15); // 强拍声音大
            // 同时播放音高
            playNote(isStrong ? NOTE_FREQ["C4"] : NOTE_FREQ["E4"], 0.15, isStrong ? 0.2 : 0.12);
        }

        frame++;
        if (frame < 360) requestAnimationFrame(draw);
    }
    draw();
}
function formatText(text) {
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

// ===== 打字指示器 =====
function showTyping() {
    const msg = document.createElement("div"); msg.className = "msg msg-ai"; msg.id = "typingMsg";
    const avatar = document.createElement("div"); avatar.className = "ai-avatar"; avatar.textContent = "🎹";
    const bubble = document.createElement("div"); bubble.className = "bubble";
    bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    msg.appendChild(avatar); msg.appendChild(bubble); chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
function hideTyping() { const t = document.getElementById("typingMsg"); if (t) t.remove(); }

// ===== 工作流：动态加载曲目 =====
async function loadWorkflowPieces() {
    try {
        const res = await fetch("/api/lesson-plans");
        const data = await res.json();
        const select = document.getElementById("wfContent");
        select.innerHTML = "";
        data.groups.forEach(group => {
            const og = document.createElement("optgroup"); og.label = group.label;
            group.pieces.forEach(p => {
                const opt = document.createElement("option"); opt.value = p.name; opt.textContent = p.name;
                og.appendChild(opt);
            });
            select.appendChild(og);
        });
    } catch(e) { console.error(e); }
}

// ===== 工作流演示 =====
document.getElementById("wfRunBtn").addEventListener("click", async () => {
    const btn = document.getElementById("wfRunBtn");
    const flow = document.getElementById("wfFlow");
    btn.disabled = true; btn.textContent = "生成中..."; flow.innerHTML = "";
    const params = {
        grade: document.getElementById("wfGrade").value,
        content: document.getElementById("wfContent").value,
        duration: document.getElementById("wfDuration").value
    };
    try {
        const res = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
        const data = await res.json();
        const steps = data.steps;
        const colors = ["#FF6B9D","#FFB84D","#5FC9A8","#4FC3F7"];
        for (let i = 0; i < steps.length; i++) {
            await sleep(700);
            const step = steps[i];
            if (step.final) {
                const final = document.createElement("div"); final.className = "wf-final";
                final.innerHTML = `<div class="wf-final-title">${step.title}</div><div class="wf-final-content">${formatText(step.content)}</div>`;
                flow.appendChild(final);
            } else {
                const stepEl = document.createElement("div"); stepEl.className = "wf-step";
                stepEl.innerHTML = `<div class="wf-step-num" style="background:${colors[i]}">${i+1}</div><div class="wf-step-content"><div class="wf-step-title">${step.title}</div><div class="wf-step-text">${formatText(step.content)}</div></div>`;
                flow.appendChild(stepEl);
                if (i < steps.length - 1) { const arrow = document.createElement("div"); arrow.className = "wf-arrow"; arrow.textContent = "▼"; flow.appendChild(arrow); }
            }
            flow.scrollTop = flow.scrollHeight;
        }
        btn.disabled = false; btn.textContent = "▶ 重新生成";
    } catch(e) {
        flow.innerHTML = '<div class="wf-placeholder">生成失败，请重试</div>';
        btn.disabled = false; btn.textContent = "▶ 开始生成";
    }
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== 教案库 =====
async function loadLibrary() {
    const grid = document.getElementById("libGrid");
    try {
        const res = await fetch("/api/lesson-plans");
        const data = await res.json();
        grid.innerHTML = "";
        data.groups.forEach(group => {
            const gEl = document.createElement("div"); gEl.className = "lib-group";
            const title = document.createElement("div"); title.className = "lib-group-title";
            title.textContent = `${group.label}（${group.pieces.length}首）`;
            gEl.appendChild(title);
            const piecesEl = document.createElement("div"); piecesEl.className = "lib-pieces";
            group.pieces.forEach(p => {
                const card = document.createElement("div"); card.className = "lib-card";
                card.innerHTML = `<div class="lib-card-name">${p.name}</div><div class="lib-card-meta">${p.key?`<span>${p.key}</span>`:""}${p.time_sig?`<span>${p.time_sig}</span>`:""}${p.difficulty?`<span>${p.difficulty}</span>`:""}</div>${p.tomplay?`<div class="lib-card-tomplay">Tomplay: ${p.tomplay}</div>`:""}`;
                card.addEventListener("click", () => {
                    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                    document.querySelector('[data-view="chat"]').classList.add("active");
                    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
                    document.getElementById("view-chat").classList.add("active");
                    chatInput.value = `帮我设计一节${p.name}教学课`;
                    sendMessage();
                });
                piecesEl.appendChild(card);
            });
            gEl.appendChild(piecesEl); grid.appendChild(gEl);
        });
    } catch(e) { grid.innerHTML = '<div class="lib-loading">加载失败，请刷新</div>'; }
}

document.getElementById("libSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".lib-card").forEach(card => {
        card.style.display = card.querySelector(".lib-card-name").textContent.toLowerCase().includes(q) ? "" : "none";
    });
});

// ===== 初始化 =====
loadQuickQuestions();
loadWorkflowPieces();
loadLibrary();
