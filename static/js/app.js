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
    btn.disabled = true; btn.textContent = "生成中...";
    try {
        const res = await fetch("/api/comic", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: userMsg })
        });
        const data = await res.json();
        btn.remove();
        // 在当前气泡后插入漫画
        const comicEl = document.createElement("div");
        comicEl.className = "comic-strip";
        data.panels.forEach((p, idx) => {
            const panel = document.createElement("div");
            panel.className = "comic-panel";
            panel.style.borderColor = p.color;
            panel.style.background = p.bg;
            panel.innerHTML = `
                <div class="comic-panel-num" style="background:${p.color}">${idx + 1}</div>
                <div class="comic-emoji">${p.emoji}</div>
                <div class="comic-char" style="color:${p.color}">${p.char}</div>
                <div class="comic-scene">${p.scene}</div>
                <div class="comic-text">${p.text}</div>
            `;
            comicEl.appendChild(panel);
        });
        btn.parentElement.appendChild(comicEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch(e) {
        btn.disabled = false; btn.textContent = "🎨 查看漫画教案（重试）";
    }
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
const NOTE_FREQ = { "C4":261.63, "D4":293.66, "E4":329.63, "F4":349.23, "G4":392.00, "A4":440.00, "B4":493.88, "C5":523.25 };
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

// ===== 文本格式化 =====
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
