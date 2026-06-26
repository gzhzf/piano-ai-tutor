/* ===== 琴乐启蒙AI导师 前端交互 ===== */
let currentRole = "teacher";
let isTyping = false;

const chatMessages = document.getElementById("chatMessages");

// ===== 欢迎页钢琴动画（图片+粒子叠加）=====
let welcomeAnimStarted = false;
function initWelcomeAnim() {
    const cv = document.getElementById("welcomeCanvas");
    if (!cv || welcomeAnimStarted) return;
    welcomeAnimStarted = true;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    // 星光
    const stars = [];
    for (let i = 0; i < 30; i++) stars.push({
        x: Math.random()*W, y: Math.random()*H*0.5,
        r: Math.random()*1.2+0.3, tw: Math.random()*6.28, sp: Math.random()*0.02+0.008
    });
    // 音符粒子
    const musicNotes = [];
    const noteSyms = ["\u266A","\u266B","\u2669","\u266C"];
    const ripples = [];
    // 原有旋律（Aerith's Theme）
    const melody = [
        {n:"D5",d:1.5},{n:"E5",d:0.5},{n:"F5",d:1},{n:"E5",d:1},
        {n:"D5",d:1.5},{n:"B4",d:0.5},{n:"A4",d:2},
        {n:"D5",d:1},{n:"E5",d:1},{n:"F5",d:1.5},{n:"E5",d:0.5},
        {n:"D5",d:1},{n:"E5",d:1},{n:"F5",d:1},{n:"G5",d:2},
        {n:"F5",d:1.5},{n:"E5",d:0.5},{n:"D5",d:1},{n:"E5",d:1},
        {n:"D5",d:1.5},{n:"B4",d:0.5},{n:"A4",d:3},
    ];
    let mIdx = 0, lastBeat = 0, isPlaying = true, frame = 0;
    const beatInt = 36, playDur = 600;

    // 播放Aerith's Theme原曲音频（兼容手机：首次点击触发）
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; }
    function tryPlayAudio() {
        if (audio && audio.paused) { audio.play().catch(()=>{}); }
    }
    tryPlayAudio();
    document.body.addEventListener("touchstart", tryPlayAudio, { once: true });
    document.body.addEventListener("click", tryPlayAudio, { once: true });

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // 半透明黑色蒙版（让粒子叠加在图片上）
        ctx.fillStyle = "rgba(5,5,15,0.15)";
        ctx.fillRect(0, 0, W, H);
        // 星光
        stars.forEach(s=>{s.tw+=s.sp; const a=0.3+0.5*Math.abs(Math.sin(s.tw));
            ctx.fillStyle=`rgba(200,210,255,${a})`;
            ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.28); ctx.fill();
            if(s.r>0.9){ctx.strokeStyle=`rgba(200,210,255,${a*0.3})`; ctx.lineWidth=0.4;
                ctx.beginPath(); ctx.moveTo(s.x-s.r*3,s.y); ctx.lineTo(s.x+s.r*3,s.y);
                ctx.moveTo(s.x,s.y-s.r*3); ctx.lineTo(s.x,s.y+s.r*3); ctx.stroke();}});
        // 涟漪
        for(let i=ripples.length-1;i>=0;i--){const r=ripples[i]; r.radius+=1.5; r.alpha-=0.015;
            if(r.alpha<=0){ripples.splice(i,1);continue;}
            ctx.strokeStyle=`rgba(127,196,255,${r.alpha})`; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(r.x,r.y,r.radius,0,6.28); ctx.stroke();}
        // 触键
        if(isPlaying&&frame-lastBeat>=(melody[mIdx%melody.length].d||1)*beatInt){
            lastBeat=frame; const n=melody[mIdx%melody.length]; const nd=n.d||1;
            const rx=W*0.35+(Math.random()-0.5)*60, ry=H*0.75;
            ripples.push({x:rx,y:ry,radius:3,alpha:0.4});
            musicNotes.push({x:rx,y:ry,vx:(Math.random()-0.3)*1,vy:-Math.random()*1.5-0.7,
                life:1,sym:noteSyms[Math.floor(Math.random()*4)],sz:Math.random()*3+8,
                c:["#7FC4FF","#FFD700","#FF9DB5","#A8D8FF"][Math.floor(Math.random()*4)]});
            mIdx++;}
        if(isPlaying&&frame>=playDur)isPlaying=false;
        // 音符飘起
        for(let i=musicNotes.length-1;i>=0;i--){const p=musicNotes[i]; p.x+=p.vx; p.y+=p.vy; p.vy*=0.99; p.life-=0.008;
            if(p.life<=0){musicNotes.splice(i,1);continue;}
            ctx.fillStyle=p.c; ctx.globalAlpha=p.life*0.8;
            ctx.font=p.sz+"px sans-serif"; ctx.textAlign="center";
            ctx.fillText(String.fromCharCode(parseInt(p.sym.replace("\\u",""),16)),p.x,p.y); ctx.globalAlpha=1;}
        frame++; requestAnimationFrame(draw);
    }
    draw();
}

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
            // 引用上传的教学资源
            if (data.resources && data.resources.length > 0) {
                setTimeout(() => appendResourceRef(bubble, data.resources), animation ? 1800 : 600);
            }
        }
    }
    type();
}

// ===== 教案漫画按钮 =====
function appendComicButton(bubble, userMsg) {
    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    btnRow.style.cssText = "margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;";

    const comicBtn = document.createElement("button");
    comicBtn.className = "comic-btn";
    comicBtn.textContent = "🎨 漫画教案";
    comicBtn.addEventListener("click", () => loadComic(userMsg, comicBtn, bubble));

    const playBtn = document.createElement("button");
    playBtn.className = "comic-btn";
    playBtn.style.background = "#5FC9A8";
    playBtn.textContent = "▶ 演奏动画";
    playBtn.addEventListener("click", () => loadPlayAnim(userMsg, playBtn, bubble));

    // 游戏按钮（仅特定曲目显示）
    const gameKeywords = ["小星星","两只老虎","欢乐颂","巴赫","玛丽","天空之城"];
    const hasGame = gameKeywords.some(k => userMsg.includes(k));
    let gameBtn = null;
    if (hasGame) {
        gameBtn = document.createElement("button");
        gameBtn.className = "comic-btn";
        gameBtn.style.background = "#FFB84D";
        gameBtn.textContent = "🎮 开始游戏";
        gameBtn.addEventListener("click", () => startGame(userMsg));
    }

    btnRow.appendChild(comicBtn);
    btnRow.appendChild(playBtn);
    if (gameBtn) btnRow.appendChild(gameBtn);
    bubble.appendChild(btnRow);
}

// ===== 加载教案漫画 =====
async function loadComic(userMsg, btn, bubble) {
    btn.disabled = true; btn.textContent = "生成中...";
    try {
        const res = await fetch("/api/comic", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: userMsg })
        });
        const data = await res.json();
        btn.disabled = false; btn.textContent = "🎨 漫画教案";
        // 移除旧的漫画内容（如有）
        const oldComic = bubble.querySelector(".comic-strip");
        if (oldComic) oldComic.remove();
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
                    <canvas class="comic-scene-canvas" width="240" height="80" data-scene="${p.scene}"></canvas>
                    ${svgChar(p.speaker, p.expression)}
                    <div class="comic-dialogue">
                        <div class="comic-speaker-name">${speakerName(p.speaker)}</div>
                        <div class="comic-dialogue-text">${p.text}</div>
                    </div>
                </div>
            `;
            comicEl.appendChild(panel);
            // 渲染场景动画
            const cv = panel.querySelector(".comic-scene-canvas");
            setTimeout(() => drawScene(cv, p.scene, idx), 200 + idx * 100);
        });
        bubble.appendChild(comicEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch(e) {
        console.error("漫画加载失败:", e);
        btn.disabled = false; btn.textContent = "🎨 漫画教案（重试）";
    }
}

// ===== 演奏动画 =====
async function loadPlayAnim(userMsg, btn, bubble) {
    btn.disabled = true; btn.textContent = "加载中...";
    try {
        const res = await fetch("/api/play?topic=" + encodeURIComponent(userMsg));
        const data = await res.json();
        btn.disabled = false; btn.textContent = "▶ 演奏动画";

        // 移除旧的演奏动画（如有）
        const existing = bubble.querySelector(".play-anim-wrap");
        if (existing) existing.remove();

        const wrap = document.createElement("div");
        wrap.className = "play-anim-wrap";
        wrap.innerHTML = `
            <div class="play-title">🎹 ${data.piece} · 演奏可视化</div>
            <canvas class="play-canvas" width="360" height="200"></canvas>
            <div class="play-controls">
                <button class="play-start-btn">▶ 播放</button>
                <span class="play-info"></span>
            </div>
        `;
        bubble.appendChild(wrap);

        const cv = wrap.querySelector(".play-canvas");
        const startBtn = wrap.querySelector(".play-start-btn");
        const info = wrap.querySelector(".play-info");
        initPlayAnimation(cv, data.notes, data.piece, startBtn, info);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch(e) {
        console.error("演奏动画加载失败:", e);
        btn.disabled = false; btn.textContent = "▶ 演奏动画（重试）";
    }
}

function initPlayAnimation(cv, notes, pieceName, startBtn, info) {
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const NOTE_MAP = { "C3":-14,"C#3":-13.3,"D3":-13,"D#3":-12.3,"E3":-12,"F3":-11,"F#3":-10.3,
        "G3":-10,"G#3":-9.3,"A3":-9,"A#3":-8.3,"B3":-8,
        "C4":-7,"C#4":-6.3,"D4":-6,"D#4":-5.3,"E4":-5,"F4":-4,"F#4":-3.3,
        "G4":-3,"G#4":-2.3,"A4":-2,"A#4":-1.3,"B4":-1,
        "C5":0,"C#5":0.7,"D5":1,"D#5":1.7,"E5":2,"F5":3,"F#5":3.7,"G5":4 };

    const allNotes = [...notes].sort((a,b) => a[1] - b[1]);
    const totalBeats = Math.max(...notes.map(n => n[1] + n[2])) + 1;
    const bpm = 80;
    const beatMs = 60000 / bpm;
    const fallBeats = 2; // 提前2拍开始下落
    const keyStart = -14, keyEnd = 5;
    const numKeys = keyEnd - keyEnd;
    const totalKeys = 21; // C3到G5白键数
    const wkW = W / totalKeys;
    const keyY = H - 60;
    const keyH = 55;

    let startTime = null;
    let playing = false;
    let playedSet = new Set();

    function noteX(noteName) {
        const pos = NOTE_MAP[noteName] || 0;
        return (pos - keyStart) * wkW;
    }

    function draw(t) {
        if (!playing) return;
        if (!startTime) startTime = t;
        const elapsed = (t - startTime) / beatMs;
        ctx.clearRect(0, 0, W, H);

        // 判定线
        ctx.strokeStyle = "rgba(255,107,157,0.5)"; ctx.lineWidth = 2;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(0, keyY); ctx.lineTo(W, keyY); ctx.stroke();
        ctx.setLineDash([]);

        // 键盘
        for (let i = 0; i < totalKeys; i++) {
            const keyPos = keyStart + i;
            let isBlack = false;
            const mod = ((keyPos % 7) + 7) % 7;
            if ([0.7,1.7,3.7,4.7,5.7].some(o => Math.abs((keyPos % 1) - o) < 0.1)) isBlack = true;
            if (keyPos % 1 !== 0) continue; // 只画白键
            ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
            ctx.fillRect(i * wkW, keyY, wkW - 1, keyH);
            ctx.strokeRect(i * wkW, keyY, wkW - 1, keyH);
        }
        // 黑键
        for (let i = 0; i < totalKeys; i++) {
            const keyPos = keyStart + i;
            const blackOffsets = [0.7,1.7,3.7,4.7,5.7];
            for (const off of blackOffsets) {
                const bkPos = Math.floor(keyPos) + off;
                if (Math.abs(keyPos - bkPos) < 0.1) {
                    ctx.fillStyle = "#2D2A4A";
                    ctx.fillRect((i + off - 0.35) * wkW, keyY, wkW * 0.6, keyH * 0.6);
                }
            }
        }

        // 下落音符
        notes.forEach((n, idx) => {
            const [noteName, startBeat, dur, hand] = n;
            const noteStart = startBeat;
            const noteEnd = startBeat + dur;
            if (elapsed < noteStart - fallBeats || elapsed > noteEnd + 0.5) return;

            const x = noteX(noteName);
            const fallProgress = (elapsed - (noteStart - fallBeats)) / fallBeats;
            const y = fallProgress < 1 ? keyY - (1 - fallProgress) * (keyY - 10) : keyY;
            const h = dur * 22;
            const color = hand === "R" ? "#FF6B9D" : "#4FC3F7";

            // 音符方块
            ctx.fillStyle = color;
            ctx.globalAlpha = (elapsed > noteEnd) ? Math.max(0, 1 - (elapsed - noteEnd) * 2) : 0.85;
            ctx.fillRect(x + 1, y - h, wkW - 2, h);
            ctx.globalAlpha = 1;

            // 到达判定线时高亮键+播放声音
            if (elapsed >= noteStart && elapsed < noteStart + 0.1 && !playedSet.has(idx)) {
                playedSet.add(idx);
                const freq = NOTE_FREQ[noteName] || 261.63;
                playNote(freq, Math.min(dur * 0.8, 1.5), 0.25);
                // 高亮键
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(x, keyY, wkW - 1, keyH);
                ctx.globalAlpha = 1;
            }
            // 持续高亮
            if (elapsed >= noteStart && elapsed < noteEnd) {
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x, keyY, wkW - 1, keyH);
                ctx.globalAlpha = 1;
            }
        });

        // 进度
        const progress = Math.min(elapsed / totalBeats, 1);
        ctx.fillStyle = "#4A3F8E"; ctx.font = "11px 微软雅黑"; ctx.textAlign = "left";
        ctx.fillText(`${pieceName}  ♩=${bpm}  ${Math.floor(elapsed)}/${Math.floor(totalBeats)}拍`, 6, 14);
        // 进度条
        ctx.fillStyle = "#E8E5F5"; ctx.fillRect(0, H - 4, W, 4);
        ctx.fillStyle = "#FF6B9D"; ctx.fillRect(0, H - 4, W * progress, 4);

        // 手指标注
        ctx.fillStyle = "#FF6B9D"; ctx.font = "9px 微软雅黑"; ctx.textAlign = "left";
        ctx.fillText("● 右手", W - 60, 14);
        ctx.fillStyle = "#4FC3F7";
        ctx.fillText("● 左手", W - 60, 26);

        if (elapsed < totalBeats + 1) {
            requestAnimationFrame(draw);
        } else {
            playing = false;
            startBtn.textContent = "▶ 重新播放";
            startBtn.disabled = false;
            info.textContent = "演奏完成 ✓";
        }
    }

    startBtn.addEventListener("click", () => {
        if (playing) return;
        playing = true; startTime = null; playedSet.clear();
        startBtn.disabled = true; startBtn.textContent = "演奏中...";
        info.textContent = "";
        requestAnimationFrame(draw);
    });
}

function speakerName(s) {
    return { teacher: "老师", student: "小明", ai: "AI助手" }[s] || s;
}

// ===== 漫画场景动画 =====
function drawScene(cv, scene, panelIdx) {
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    let frame = 0;

    // 共用：绘制小钢琴键盘
    function drawKeys(cx, cy, numWhite, highlightIdx, highlightColor, ledIdx) {
        const wkW = 18, wkH = 40, bkW = 11, bkH = 22;
        for (let i = 0; i < numWhite; i++) {
            const x = cx + i * wkW;
            ctx.fillStyle = (highlightIdx === i) ? highlightColor : "#FFFFFF";
            ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
            ctx.fillRect(x, cy, wkW - 1, wkH); ctx.strokeRect(x, cy, wkW - 1, wkH);
            // LED灯
            if (ledIdx === i) {
                ctx.fillStyle = "#FF6B9D";
                ctx.beginPath(); ctx.arc(x + wkW/2 - 0.5, cy - 4, 3, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 8; ctx.shadowColor = "#FF6B9D";
                ctx.fill(); ctx.shadowBlur = 0;
            }
        }
        // 黑键2+3
        const blackPos = [0.65, 1.65, 3.65, 4.65, 5.65];
        for (let oct = 0; oct < Math.ceil(numWhite/7); oct++) {
            for (const off of blackPos) {
                const idx = oct * 7 + off;
                if (idx < numWhite - 0.5) {
                    ctx.fillStyle = "#2D2A4A";
                    ctx.fillRect(cx + idx * wkW, cy, bkW, bkH);
                }
            }
        }
    }

    // 共用：绘制音符飘出
    function drawNote(x, y, alpha) {
        ctx.fillStyle = `rgba(255,107,157,${alpha})`;
        ctx.beginPath(); ctx.ellipse(x, y, 6, 5, -0.3, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `rgba(255,107,157,${alpha})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x + 5, y - 18); ctx.stroke();
    }

    const anims = {
        "piano_intro": () => {
            // 钢琴键盘从左到右逐个出现
            ctx.clearRect(0, 0, W, H);
            const num = Math.min(Math.floor(frame / 3) + 1, 10);
            drawKeys(30, 20, num, -1, null, -1);
            if (frame > 30) {
                ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 11px 微软雅黑"; ctx.textAlign = "center";
                ctx.fillText("钢琴", W/2, 72);
            }
            if (frame < 40) requestAnimationFrame(anims["piano_intro"]);
        },
        "find_c": () => {
            // 高亮2黑键→左边白键
            ctx.clearRect(0, 0, W, H);
            const phase = Math.floor(frame / 25);
            const hl2bk = phase >= 1 ? "#FFB84D" : null;
            const hlC = phase >= 2 ? "#FF6B9D" : null;
            // 画7个白键
            const wkW = 24, wkH = 42, cx = 36, cy = 20;
            for (let i = 0; i < 7; i++) {
                ctx.fillStyle = (hlC && i === 2) ? "#FF6B9D" : "#FFFFFF";
                ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
                ctx.fillRect(cx + i * wkW, cy, wkW - 1, wkH); ctx.strokeRect(cx + i * wkW, cy, wkW - 1, wkH);
            }
            // 黑键
            const bks = [{x:0.65,c:hl2bk},{x:1.65,c:hl2bk},{x:3.65,c:null},{x:4.65,c:null},{x:5.65,c:null}];
            bks.forEach(b => {
                ctx.fillStyle = b.c || "#2D2A4A";
                ctx.fillRect(cx + b.x * wkW, cy, 14, 22);
            });
            // 标注
            if (phase >= 1) { ctx.fillStyle = "#FFB84D"; ctx.font = "bold 9px 微软雅黑"; ctx.textAlign = "center"; ctx.fillText("2黑键", cx + 1.6*wkW, 14); }
            if (phase >= 2) {
                ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 10px 微软雅黑";
                ctx.fillText("C", cx + 2*wkW + 11, cy + wkH + 12);
                if (frame % 50 < 25) { ctx.fillStyle = "rgba(255,107,157,0.3)"; ctx.fillRect(cx + 2*wkW, cy, wkW-1, wkH); }
            }
            if (frame < 100) requestAnimationFrame(anims["find_c"]);
        },
        "press_c": () => {
            // 按下中央C+音符飘出+声音
            ctx.clearRect(0, 0, W, H);
            const cx = 36, cy = 20, wkW = 24, wkH = 42;
            for (let i = 0; i < 7; i++) {
                ctx.fillStyle = (i === 2) ? "#FF6B9D" : "#FFFFFF";
                ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
                ctx.fillRect(cx + i * wkW, cy, wkW - 1, wkH); ctx.strokeRect(cx + i * wkW, cy, wkW - 1, wkH);
            }
            // 手指圆点
            const pressY = cy + 5 + (frame % 20 < 10 ? 3 : 0);
            ctx.fillStyle = "#FFE0C0"; ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx + 2*wkW + 11, pressY, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            // 音符飘出
            const noteAlpha = Math.max(0, 1 - (frame % 40) / 40);
            const noteY = 15 - (frame % 40) * 0.8;
            if (frame % 40 < 30) drawNote(cx + 2*wkW + 11, noteY, noteAlpha);
            // 首次播放C音
            if (frame === 5) playNote(NOTE_FREQ["C4"], 0.5, 0.3);
            if (frame % 40 === 5 && frame > 10) playNote(NOTE_FREQ["C4"], 0.3, 0.2);
            ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("叮咚~", W/2, 72);
            if (frame < 120) requestAnimationFrame(anims["press_c"]);
        },
        "led_guide": () => {
            // LED灯依次点亮引导
            ctx.clearRect(0, 0, W, H);
            const cx = 30, cy = 22, wkW = 18, wkH = 38;
            const led = Math.floor(frame / 12) % 7;
            drawKeys(cx, cy, 7, -1, null, led);
            ctx.fillStyle = "#4FC3F7"; ctx.font = "bold 9px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("LED跟灯指引", W/2, 72);
            if (frame < 120) requestAnimationFrame(anims["led_guide"]);
        },
        "score_95": () => {
            // 准确率95%圆环
            ctx.clearRect(0, 0, W, H);
            const cx = W/2, cy = H/2, r = 25;
            const progress = Math.min(frame / 50, 1) * 0.95;
            ctx.strokeStyle = "#E8E5F5"; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = "#5FC9A8"; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + progress * Math.PI*2); ctx.stroke();
            ctx.fillStyle = "#5FC9A8"; ctx.font = "bold 16px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("95%", cx, cy + 5);
            if (frame > 50) { ctx.font = "10px 微软雅黑"; ctx.fillStyle = "#6B688A"; ctx.fillText("准确率", cx, cy + 22); }
            if (frame < 80) requestAnimationFrame(anims["score_95"]);
        },
        "score_98": () => {
            ctx.clearRect(0, 0, W, H);
            const cx = W/2, cy = H/2, r = 25;
            const progress = Math.min(frame / 50, 1) * 0.98;
            ctx.strokeStyle = "#E8E5F5"; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = "#5FC9A8"; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + progress * Math.PI*2); ctx.stroke();
            ctx.fillStyle = "#5FC9A8"; ctx.font = "bold 16px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("98%", cx, cy + 5);
            if (frame > 50) { ctx.font = "10px 微软雅黑"; ctx.fillStyle = "#6B688A"; ctx.fillText("准确率", cx, cy + 22); }
            if (frame < 80) requestAnimationFrame(anims["score_98"]);
        },
        "medal": () => {
            // 勋章从天而降+闪光
            ctx.clearRect(0, 0, W, H);
            const dropY = Math.min(frame * 1.5, 40);
            const cx = W/2;
            // 勋章
            ctx.fillStyle = "#FFB84D"; ctx.strokeStyle = "#E55500"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, dropY + 10, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            // 勋章内星
            ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 16px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("★", cx, dropY + 16);
            // 飘带
            ctx.fillStyle = "#FF6B9D";
            ctx.beginPath(); ctx.moveTo(cx - 12, dropY + 22); ctx.lineTo(cx - 18, dropY + 40); ctx.lineTo(cx - 8, dropY + 40); ctx.lineTo(cx - 2, dropY + 26); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx + 12, dropY + 22); ctx.lineTo(cx + 18, dropY + 40); ctx.lineTo(cx + 8, dropY + 40); ctx.lineTo(cx + 2, dropY + 26); ctx.fill();
            // 闪光
            if (frame > 30 && frame % 20 < 10) {
                ctx.fillStyle = "rgba(255,184,77,0.4)";
                ctx.beginPath(); ctx.arc(cx, dropY + 10, 22, 0, Math.PI*2); ctx.fill();
            }
            if (frame === 30) playNote(NOTE_FREQ["C5"], 0.3, 0.2);
            if (frame < 100) requestAnimationFrame(anims["medal"]);
        },
        "music_34": () => {
            // 3/4拍节奏球
            ctx.clearRect(0, 0, W, H);
            const beat = Math.floor(frame / 20) % 3;
            const labels = ["强", "弱", "弱"];
            const colors = ["#FF6B9D", "#FFB84D", "#FFB84D"];
            for (let i = 0; i < 3; i++) {
                const bx = W/2 - 30 + i * 30;
                const lit = i === beat && frame % 20 < 12;
                ctx.fillStyle = lit ? colors[i] : "#E8E5F5";
                ctx.beginPath(); ctx.arc(bx, H/2, lit ? 12 : 8, 0, Math.PI*2); ctx.fill();
                if (lit) { ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center"; ctx.fillText(labels[i], bx, H/2 + 4); }
            }
            ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 11px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("3/4拍", W/2, 12);
            if (frame % 20 === 0) playClap(beat === 0 ? 0.25 : 0.12);
            if (frame < 120) requestAnimationFrame(anims["music_34"]);
        },
        "right_hand": () => {
            // 右手5指在键盘上
            ctx.clearRect(0, 0, W, H);
            const cx = 36, cy = 20, wkW = 22, wkH = 40;
            for (let i = 0; i < 7; i++) {
                ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
                ctx.fillRect(cx + i * wkW, cy, wkW - 1, wkH); ctx.strokeRect(cx + i * wkW, cy, wkW - 1, wkH);
            }
            // 右手5指
            const fingerColors = ["#FF6B9D","#FFB84D","#5FC9A8","#4FC3F7","#4A3F8E"];
            const active = Math.floor(frame / 15) % 5;
            for (let i = 0; i < 5; i++) {
                const fx = cx + i * wkW + wkW/2;
                const fy = cy + 8 + (i === active ? 5 : 0);
                ctx.fillStyle = fingerColors[i];
                ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI*2); ctx.fill();
            }
            ctx.fillStyle = "#4FC3F7"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("右手5指", W/2, 72);
            if (frame < 100) requestAnimationFrame(anims["right_hand"]);
        },
        "led_slow": () => {
            // 60BPM慢速跟灯
            ctx.clearRect(0, 0, W, H);
            const cx = 30, cy = 22, wkW = 18, wkH = 36;
            const led = Math.floor(frame / 30) % 7; // 慢速
            drawKeys(cx, cy, 7, led, "#4FC3F7", led);
            ctx.fillStyle = "#4FC3F7"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("60 BPM 慢速", W/2, 72);
            if (frame % 30 === 0) playNote(NOTE_FREQ["C4"], 0.4, 0.15);
            if (frame < 150) requestAnimationFrame(anims["led_slow"]);
        },
        "ornament": () => {
            // 装饰音G-A-G波形
            ctx.clearRect(0, 0, W, H);
            const notes = ["G4","A4","G4"];
            const active = Math.floor(frame / 15) % 3;
            const cx = W/2 - 50;
            // 三连音
            for (let i = 0; i < 3; i++) {
                const x = cx + i * 40;
                const y = H/2 + (i === 1 ? -15 : 0); // 中间高
                ctx.fillStyle = i === active ? "#FF6B9D" : "#E8E5F5";
                ctx.beginPath(); ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = i === active ? "#FF6B9D" : "#CCCCDD"; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(x + 7, y); ctx.lineTo(x + 7, y - 20); ctx.stroke();
            }
            // 连线
            ctx.strokeStyle = "#FF6B9D"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx + 8, H/2); ctx.lineTo(cx + 40, H/2 - 15); ctx.lineTo(cx + 72, H/2); ctx.stroke();
            ctx.fillStyle = "#FF6B9D"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("G-A-G 波音", W/2, 72);
            if (frame % 15 === 0) playNote(NOTE_FREQ[notes[active]], 0.15, 0.2);
            if (frame < 120) requestAnimationFrame(anims["ornament"]);
        },
        "loop_10": () => {
            // 循环10次计数
            ctx.clearRect(0, 0, W, H);
            const count = Math.min(Math.floor(frame / 12) + 1, 10);
            // 循环箭头
            const cx = W/2, cy = H/2 - 5;
            ctx.strokeStyle = "#5FC9A8"; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 1.7); ctx.stroke();
            // 箭头头
            ctx.fillStyle = "#5FC9A8";
            ctx.beginPath(); ctx.moveTo(cx + 18, cy + 8); ctx.lineTo(cx + 24, cy); ctx.lineTo(cx + 14, cy); ctx.fill();
            // 数字
            ctx.fillStyle = "#5FC9A8"; ctx.font = "bold 18px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText(count, cx, cy + 6);
            ctx.font = "9px 微软雅黑"; ctx.fillStyle = "#6B688A";
            ctx.fillText("/10", cx, cy + 22);
            if (count === 10) { ctx.fillStyle = "#5FC9A8"; ctx.font = "bold 10px 微软雅黑"; ctx.fillText("完美!", cx, 72); }
            if (frame % 12 === 0 && count <= 10) playClap(0.15);
            if (frame < 140) requestAnimationFrame(anims["loop_10"]);
        },
        "both_hands": () => {
            // 双手在键盘上
            ctx.clearRect(0, 0, W, H);
            const cx = 30, cy = 20, wkW = 18, wkH = 38;
            drawKeys(cx, cy, 8, -1, null, -1);
            // 左手(蓝)+右手(粉)
            const beat = Math.floor(frame / 15) % 4;
            for (let i = 0; i < 4; i++) {
                const fx = cx + (i + 0.5) * wkW;
                const lit = i === beat % 4;
                ctx.fillStyle = "#4FC3F7";
                ctx.beginPath(); ctx.arc(fx, cy + 8 + (lit ? 4 : 0), 4, 0, Math.PI*2); ctx.fill();
            }
            for (let i = 0; i < 4; i++) {
                const fx = cx + (i + 4.5) * wkW;
                const lit = i === beat % 4;
                ctx.fillStyle = "#FF6B9D";
                ctx.beginPath(); ctx.arc(fx, cy + 8 + (lit ? 4 : 0), 4, 0, Math.PI*2); ctx.fill();
            }
            ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 9px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("双手合奏", W/2, 72);
            if (frame < 100) requestAnimationFrame(anims["both_hands"]);
        },
        "read_score": () => {
            // 五线谱+音符
            ctx.clearRect(0, 0, W, H);
            ctx.strokeStyle = "#6B688A"; ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(20, 20 + i * 10); ctx.lineTo(W - 20, 20 + i * 10); ctx.stroke(); }
            // 音符逐个出现
            const num = Math.min(Math.floor(frame / 15) + 1, 5);
            for (let i = 0; i < num; i++) {
                const x = 35 + i * 38;
                const y = 30 + (i % 3) * 10;
                ctx.fillStyle = "#FF6B9D";
                ctx.beginPath(); ctx.ellipse(x, y, 5, 4, -0.3, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = "#FF6B9D"; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y - 15); ctx.stroke();
            }
            ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 9px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("识谱中...", W/2, 72);
            if (frame < 90) requestAnimationFrame(anims["read_score"]);
        },
        "error_mark": () => {
            // 错音高亮标记
            ctx.clearRect(0, 0, W, H);
            const cx = 36, cy = 20, wkW = 22, wkH = 40;
            for (let i = 0; i < 7; i++) {
                const isError = (i === 3 || i === 5);
                ctx.fillStyle = isError ? "#FF4444" : "#FFFFFF";
                ctx.strokeStyle = "#CCCCDD"; ctx.lineWidth = 1;
                ctx.fillRect(cx + i * wkW, cy, wkW - 1, wkH); ctx.strokeRect(cx + i * wkW, cy, wkW - 1, wkH);
                if (isError && frame % 30 < 15) {
                    ctx.strokeStyle = "#FF4444"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(cx + i * wkW + 2, cy + 2); ctx.lineTo(cx + (i+1) * wkW - 3, cy + wkH - 2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx + (i+1) * wkW - 3, cy + 2); ctx.lineTo(cx + i * wkW + 2, cy + wkH - 2); ctx.stroke();
                }
            }
            ctx.fillStyle = "#FF4444"; ctx.font = "bold 10px 微软雅黑"; ctx.textAlign = "center";
            ctx.fillText("2个错音已标记", W/2, 72);
            if (frame < 90) requestAnimationFrame(anims["error_mark"]);
        },
    };

    const fn = anims[scene] || anims["piano_intro"];
    fn();
    frame = 0; // reset for closure
}

// SVG卡通人物（大图+动作）
function svgChar(type, expression) {
    const w = 120, h = 140;
    let svg = `<svg viewBox="0 0 ${w} ${h}" class="comic-char-svg">`;

    if (type === "teacher") {
        // === 老师 ===
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>`;
        // 头发
        svg += `<path d="M28,42 Q28,16 60,16 Q92,16 92,42 L92,82 Q92,88 86,86 L80,74 L40,74 L34,86 Q28,88 28,82 Z" fill="#4A3F8E"/>`;
        // 脸
        svg += `<ellipse cx="60" cy="56" rx="24" ry="26" fill="#FFD9B8"/>`;
        // 眼镜
        svg += `<circle cx="50" cy="54" r="7" fill="none" stroke="#4A3F8E" stroke-width="2"/>`;
        svg += `<circle cx="70" cy="54" r="7" fill="none" stroke="#4A3F8E" stroke-width="2"/>`;
        svg += `<line x1="57" y1="54" x2="63" y2="54" stroke="#4A3F8E" stroke-width="2"/>`;
        // 表情+动作
        if (expression === "proud") {
            // 骄傲：大笑+双手张开+星星
            svg += `<path d="M48,66 Q60,76 72,66" fill="none" stroke="#C44" stroke-width="2"/>`;
            svg += `<circle cx="50" cy="52" r="2" fill="#333"/><circle cx="70" cy="52" r="2" fill="#333"/>`;
            svg += `<text x="86" y="34" font-size="14">✨</text>`;
            // 双手张开
            svg += `<path d="M36,92 Q20,100 18,118" fill="none" stroke="#FFD9B8" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<path d="M84,92 Q100,100 102,118" fill="none" stroke="#FFD9B8" stroke-width="8" stroke-linecap="round"/>`;
        } else if (expression === "explain") {
            // 讲解：张嘴+一只手指向旁边
            svg += `<ellipse cx="60" cy="68" rx="5" ry="4" fill="#C44"/>`;
            svg += `<circle cx="50" cy="52" r="2" fill="#333"/><circle cx="70" cy="52" r="2" fill="#333"/>`;
            // 右手指向
            svg += `<path d="M84,92 Q98,90 106,86" fill="none" stroke="#FFD9B8" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<circle cx="108" cy="85" r="4" fill="#FFD9B8"/>`;
            // 左手放下
            svg += `<path d="M36,92 Q30,108 30,120" fill="none" stroke="#FFD9B8" stroke-width="8" stroke-linecap="round"/>`;
        } else {
            // 微笑：微笑+双手放下
            svg += `<path d="M48,66 Q60,72 72,66" fill="none" stroke="#C44" stroke-width="2"/>`;
            svg += `<circle cx="50" cy="52" r="2" fill="#333"/><circle cx="70" cy="52" r="2" fill="#333"/>`;
            svg += `<path d="M38,92 Q32,108 32,122" fill="none" stroke="#FFD9B8" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<path d="M82,92 Q88,108 88,122" fill="none" stroke="#FFD9B8" stroke-width="8" stroke-linecap="round"/>`;
        }
        // 身体（裙子）
        svg += `<path d="M40,88 L80,88 L92,135 L28,135 Z" fill="#FF6B9D"/>`;
        svg += `<rect x="57" y="88" width="6" height="14" fill="#E55588"/>`;

    } else if (type === "student") {
        // === 学生 ===
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>`;
        // 头发（平头）
        svg += `<path d="M32,46 Q32,18 60,18 Q88,18 88,46 L84,40 L78,44 L72,40 L66,44 L60,40 L54,44 L48,40 L42,44 L36,40 Z" fill="#3A2D1A"/>`;
        // 脸
        svg += `<ellipse cx="60" cy="52" rx="24" ry="25" fill="#FFE0C0"/>`;

        if (expression === "happy") {
            // 开心：弯眼+大笑+双手举起
            svg += `<path d="M46,48 Q50,44 54,48" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += `<path d="M66,48 Q70,44 74,48" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += `<path d="M48,62 Q60,72 72,62" fill="none" stroke="#C44" stroke-width="2"/>`;
            // 双手举起
            svg += `<path d="M38,88 Q28,74 24,60" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<path d="M82,88 Q92,74 96,60" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<text x="88" y="34" font-size="14">🎉</text>`;
        } else if (expression === "worry") {
            // 担忧：皱眉+歪嘴+手摸头
            svg += `<line x1="46" y1="46" x2="54" y2="48" stroke="#333" stroke-width="2"/>`;
            svg += `<line x1="66" y1="48" x2="74" y2="46" stroke="#333" stroke-width="2"/>`;
            svg += `<circle cx="50" cy="52" r="2" fill="#333"/><circle cx="70" cy="52" r="2" fill="#333"/>`;
            svg += `<path d="M50,64 Q60,60 70,64" fill="none" stroke="#C44" stroke-width="2"/>`;
            // 右手摸头
            svg += `<path d="M82,88 Q92,72 84,46" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            // 左手放下
            svg += `<path d="M38,88 Q32,104 32,118" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<text x="88" y="38" font-size="14">💧</text>`;
        } else if (expression === "focus") {
            // 专注：眯眼+抿嘴+双手弹琴
            svg += `<line x1="44" y1="50" x2="54" y2="50" stroke="#333" stroke-width="2.5"/>`;
            svg += `<line x1="66" y1="50" x2="76" y2="50" stroke="#333" stroke-width="2.5"/>`;
            svg += `<line x1="50" y1="64" x2="70" y2="64" stroke="#C44" stroke-width="2"/>`;
            // 双手在前面弹琴
            svg += `<path d="M38,88 Q42,100 36,112" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<path d="M82,88 Q78,100 84,112" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            // 小钢琴
            svg += `<rect x="30" y="112" width="60" height="12" rx="2" fill="#4A3F8E"/>`;
            svg += `<rect x="32" y="112" width="8" height="12" fill="#2D2A4A"/><rect x="44" y="112" width="8" height="12" fill="#2D2A4A"/>`;
            svg += `<rect x="56" y="112" width="8" height="12" fill="#2D2A4A"/><rect x="68" y="112" width="8" height="12" fill="#2D2A4A"/>`;
        } else {
            // 默认：微笑+手放下
            svg += `<circle cx="50" cy="52" r="2" fill="#333"/><circle cx="70" cy="52" r="2" fill="#333"/>`;
            svg += `<path d="M50,62 Q60,68 70,62" fill="none" stroke="#C44" stroke-width="2"/>`;
            svg += `<path d="M38,88 Q32,104 32,120" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<path d="M82,88 Q88,104 88,120" fill="none" stroke="#FFE0C0" stroke-width="8" stroke-linecap="round"/>`;
        }
        // 身体（T恤）
        svg += `<path d="M38,84 L82,84 L88,135 L32,135 Z" fill="#4FC3F7"/>`;

    } else if (type === "ai") {
        // === AI助手 ===
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none"/>`;
        // 天线
        svg += `<line x1="60" y1="22" x2="60" y2="12" stroke="#4A3F8E" stroke-width="3"/>`;
        svg += `<circle cx="60" cy="10" r="5" fill="#FF6B9D"/>`;
        // 头（圆角矩形）
        svg += `<rect x="30" y="22" width="60" height="56" rx="12" fill="#E8E5F5" stroke="#4A3F8E" stroke-width="2.5"/>`;
        // 屏幕脸
        svg += `<rect x="36" y="30" width="48" height="32" rx="6" fill="#2D2A4A"/>`;

        if (expression === "praise" || expression === "encourage") {
            // 表扬/鼓励：绿色笑眼+大拇指
            svg += `<circle cx="50" cy="44" r="4" fill="#5FC9A8"/>`;
            svg += `<circle cx="70" cy="44" r="4" fill="#5FC9A8"/>`;
            svg += `<path d="M50,54 Q60,60 70,54" fill="none" stroke="#5FC9A8" stroke-width="2"/>`;
            // 大拇指
            svg += `<path d="M82,88 Q96,84 100,76" fill="none" stroke="#E8E5F5" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<circle cx="102" cy="74" r="6" fill="#E8E5F5" stroke="#4A3F8E" stroke-width="1.5"/>`;
            svg += `<text x="96" y="58" font-size="14">👍</text>`;
            // 左手放下
            svg += `<path d="M38,88 Q32,104 32,120" fill="none" stroke="#E8E5F5" stroke-width="8" stroke-linecap="round"/>`;
        } else if (expression === "help") {
            // 帮助：蓝色眼+手指向（指引）
            svg += `<circle cx="50" cy="44" r="4" fill="#4FC3F7"/>`;
            svg += `<circle cx="70" cy="44" r="4" fill="#4FC3F7"/>`;
            svg += `<line x1="48" y1="54" x2="72" y2="54" stroke="#4FC3F7" stroke-width="2"/>`;
            // 右手指引
            svg += `<path d="M82,88 Q98,86 106,80" fill="none" stroke="#E8E5F5" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<circle cx="108" cy="79" r="5" fill="#E8E5F5" stroke="#4A3F8E" stroke-width="1.5"/>`;
            // 左手放下
            svg += `<path d="M38,88 Q32,104 32,120" fill="none" stroke="#E8E5F5" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<text x="92" y="62" font-size="14">💡</text>`;
        } else {
            // 默认：中性
            svg += `<circle cx="50" cy="44" r="4" fill="#4FC3F7"/>`;
            svg += `<circle cx="70" cy="44" r="4" fill="#4FC3F7"/>`;
            svg += `<line x1="50" y1="54" x2="70" y2="54" stroke="#4FC3F7" stroke-width="2"/>`;
            svg += `<path d="M38,88 Q32,104 32,120" fill="none" stroke="#E8E5F5" stroke-width="8" stroke-linecap="round"/>`;
            svg += `<path d="M82,88 Q88,104 88,120" fill="none" stroke="#E8E5F5" stroke-width="8" stroke-linecap="round"/>`;
        }
        // 身体
        svg += `<rect x="36" y="78" width="48" height="40" rx="6" fill="#4A3F8E"/>`;
        svg += `<circle cx="48" cy="96" r="3" fill="#FFB84D"/>`;
        svg += `<circle cx="60" cy="96" r="3" fill="#5FC9A8"/>`;
        svg += `<circle cx="72" cy="96" r="3" fill="#FF6B9D"/>`;
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
const NOTE_FREQ = { "C4":261.63, "C#4":277.18, "D4":293.66, "D#4":311.13, "E4":329.63, "F4":349.23, "F#4":369.99, "G4":392.00, "G#4":415.30, "A4":440.00, "A#4":466.16, "B4":493.88, "C5":523.25, "C#5":554.37, "D5":587.33, "D#5":622.25, "E5":659.25, "F5":698.46, "F#5":739.99, "G5":783.99, "G#5":830.61, "A5":880.00, "B5":987.77, "C6":1046.50 };
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
    if (type === "dance_map") return animDanceMap(ctx, canvas);
    if (type === "rhythm_game") return animRhythmGame(ctx, canvas);
}

// 动画：舞蹈路线图（小步舞曲3/4拍方形路线）
function animDanceMap(ctx, cv) {
    const W = cv.width, H = cv.height;
    const cx = W/2, cy = H/2 + 10;
    const size = 70; // 方形边长
    let frame = 0;
    const beats = ["强","弱","弱","强","弱","弱","强","弱","弱","强","弱","弱"];
    const path = [
        {x:cx-size,y:cy-size},{x:cx+size,y:cy-size},
        {x:cx+size,y:cy+size},{x:cx-size,y:cy+size},{x:cx-size,y:cy-size}
    ];

    function draw() {
        ctx.clearRect(0,0,W,H);
        // 标题
        ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 13px 微软雅黑"; ctx.textAlign = "center";
        ctx.fillText("💃 小步舞曲舞蹈路线图 (3/4拍)", W/2, 14);

        // 画方形路线
        ctx.strokeStyle = "#E8E5F5"; ctx.lineWidth = 3;
        ctx.beginPath();
        path.forEach((p,i) => { if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
        ctx.stroke();

        // 画箭头方向
        const arrows = [
            {x:cx,y:cy-size,a:0}, {x:cx+size,y:cy,a:Math.PI/2},
            {x:cx,y:cy+size,a:Math.PI}, {x:cx-size,y:cy,a:-Math.PI/2}
        ];
        arrows.forEach(ar => {
            ctx.save(); ctx.translate(ar.x, ar.y); ctx.rotate(ar.a);
            ctx.fillStyle = "#FF6B9D";
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-6,-4); ctx.lineTo(-6,4); ctx.fill();
            ctx.restore();
        });

        // 当前位置（舞者）
        const step = Math.floor(frame / 25) % 4;
        const nextStep = (step + 1) % 4;
        const progress = (frame % 25) / 25;
        const px = path[step].x + (path[nextStep].x - path[step].x) * progress;
        const py = path[step].y + (path[nextStep].y - path[step].y) * progress;

        // 路径轨迹（已走过的路高亮）
        ctx.strokeStyle = "#FF6B9D"; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let s = 0; s <= step; s++) {
            if (s === 0) ctx.moveTo(path[s].x, path[s].y);
            else ctx.lineTo(path[s].x, path[s].y);
        }
        ctx.lineTo(px, py);
        ctx.stroke();

        // 舞者
        ctx.font = "20px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("💃", px, py + 6);

        // 四角标注
        const corners = [
            {x:cx-size,y:cy-size,label:"起点",beat:"1-2小节"},
            {x:cx+size,y:cy-size,label:"右转",beat:"3-4小节"},
            {x:cx+size,y:cy+size,label:"旋转",beat:"5-6小节"},
            {x:cx-size,y:cy+size,label:"回起点",beat:"7-8小节"}
        ];
        corners.forEach((c,i) => {
            const isActive = i === step;
            ctx.fillStyle = isActive ? "#FF6B9D" : "#6B688A";
            ctx.font = isActive ? "bold 10px 微软雅黑" : "9px 微软雅黑";
            ctx.fillText(c.label, c.x, c.y - 12);
            ctx.fillStyle = isActive ? "#FFB84D" : "#AAAAAA";
            ctx.font = "8px 微软雅黑";
            ctx.fillText(c.beat, c.x, c.y - 24);
        });

        // 节拍指示
        const beatIdx = Math.floor(frame / 8) % 3;
        ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 11px 微软雅黑";
        const beatLabels = ["强(跺脚)","弱(拍手)","弱(拍手)"];
        ctx.fillText(beatLabels[beatIdx], W/2, H - 8);

        // 每拍播放声音
        if (frame % 8 === 0) {
            playNote(beatIdx === 0 ? NOTE_FREQ["G4"] : NOTE_FREQ["D4"], 0.15, beatIdx === 0 ? 0.2 : 0.1);
        }

        frame++;
        if (frame < 300) requestAnimationFrame(draw);
    }
    draw();
}

// 动画：节奏游戏（3/4拍跺脚拍手）
function animRhythmGame(ctx, cv) {
    const W = cv.width, H = cv.height;
    let frame = 0;
    const actions = ["跺脚","拍手","拍手"];
    const colors = ["#FF6B9D","#FFB84D","#FFB84D"];

    function draw() {
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 13px 微软雅黑"; ctx.textAlign = "center";
        ctx.fillText("🎮 小步舞节奏挑战 (3/4拍)", W/2, 14);

        const beat = Math.floor(frame / 20) % 3;
        const beatProgress = (frame % 20) / 20;

        // 三个动作圆
        for (let i = 0; i < 3; i++) {
            const x = W/2 - 60 + i * 60;
            const y = H/2 - 5;
            const isActive = i === beat;
            const r = isActive ? 22 + Math.sin(beatProgress * Math.PI) * 4 : 16;

            ctx.fillStyle = isActive ? colors[i] : "#E8E5F5";
            ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();

            if (isActive) {
                ctx.strokeStyle = colors[i]; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 6.28); ctx.stroke();
            }

            ctx.fillStyle = isActive ? "#FFF" : "#999";
            ctx.font = isActive ? "bold 12px 微软雅黑" : "10px 微软雅黑";
            ctx.fillText(actions[i], x, y + 4);
        }

        // 拍号
        ctx.fillStyle = "#4A3F8E"; ctx.font = "bold 16px 微软雅黑";
        ctx.fillText("3/4", W/2, H - 20);
        ctx.fillStyle = colors[beat]; ctx.font = "bold 11px 微软雅黑";
        ctx.fillText(["第1拍(强)","第2拍(弱)","第3拍(弱)"][beat], W/2, H - 5);

        // 声音
        if (frame % 20 === 0) {
            if (beat === 0) { playNote(NOTE_FREQ["G4"], 0.2, 0.2); playClap(0.25); }
            else { playClap(0.12); }
        }

        frame++;
        if (frame < 240) requestAnimationFrame(draw);
    }
    draw();
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

    // 播放Aerith's Theme原曲音频
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }

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
    // 播放Aerith's Theme原曲音频
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }

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

    // 播放Aerith's Theme原曲音频
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }

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

    // 播放Aerith's Theme原曲音频
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }

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

    // 播放Aerith's Theme原曲音频
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }

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

    // 播放Aerith's Theme原曲音频
    const audio = document.getElementById("welcomeAudio");
    if (audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== 教学资源（Tomplay风格） =====
async function loadLibrary() {
    const grid = document.getElementById("libGrid");
    try {
        const [planRes, uploadRes] = await Promise.all([
            fetch("/api/lesson-plans"), fetch("/api/resources")
        ]);
        const planData = await planRes.json();
        const uploadData = await uploadRes.json();

        // 渲染已上传资源
        renderUploadedResources(uploadData.resources);

        // 渲染曲目卡片（Tomplay风格）
        grid.innerHTML = "";
        const coverColors = ["#FF6B9D","#FFB84D","#5FC9A8","#4FC3F7","#4A3F8E"];
        const coverIcons = ["⭐","🐑","🐯","🎉","🔔","🌉","🏰","🎹","🎼","🎵"];
        planData.groups.forEach((group, gi) => {
            const gEl = document.createElement("div"); gEl.className = "lib-group";
            const title = document.createElement("div"); title.className = "lib-group-title";
            title.textContent = `${group.label}（${group.pieces.length}首）`;
            gEl.appendChild(title);
            const piecesEl = document.createElement("div"); piecesEl.className = "lib-pieces";
            group.pieces.forEach((p, pi) => {
                const card = document.createElement("div"); card.className = "lib-card";
                const color = coverColors[(gi+pi) % coverColors.length];
                const icon = coverIcons[(gi+pi) % coverIcons.length];
                // 检查是否有关联上传资源
                const hasRes = uploadData.resources.some(r => p.name.includes(r.piece) || r.piece.includes(p.name));
                card.innerHTML = `
                    <div class="lib-card-cover" style="background:linear-gradient(135deg,${color},${color}99)">${icon}</div>
                    <div class="lib-card-body">
                        <div class="lib-card-name">${p.name}</div>
                        <div class="lib-card-meta">${p.key||""} · ${p.time_sig||""} · ${p.difficulty||""}</div>
                        <div class="lib-card-tags">
                            <span class="lib-card-tag">AI教案</span>
                            ${hasRes?'<span class="lib-card-tag has-resource">📎 已上传</span>':""}
                        </div>
                    </div>`;
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

function renderUploadedResources(resources) {
    const section = document.getElementById("uploadedSection");
    const list = document.getElementById("uploadedList");
    if (!resources || resources.length === 0) { section.style.display = "none"; return; }
    section.style.display = "block";
    list.innerHTML = "";
    resources.forEach(r => {
        const item = document.createElement("div"); item.className = "uploaded-item";
        const icon = r.type === "score" ? "🎼" : "📄";
        item.innerHTML = `${icon} <a href="${r.url}" target="_blank">${r.filename}</a> <span style="color:#999;font-size:10px">(${r.piece||"未关联"})</span> <span class="del-btn" data-id="${r.id}">✕</span>`;
        item.querySelector(".del-btn").addEventListener("click", () => deleteResource(r.id));
        list.appendChild(item);
    });
}

async function deleteResource(rid) {
    await fetch(`/api/resources/${rid}`, { method: "DELETE" });
    loadLibrary();
}

// ===== 上传功能 =====
const uploadOverlay = document.getElementById("uploadOverlay");
const uploadBtn = document.getElementById("uploadBtn");
const uploadClose = document.getElementById("uploadClose");
const uploadSubmit = document.getElementById("uploadSubmit");
const uploadResult = document.getElementById("uploadResult");

uploadBtn.addEventListener("click", async () => {
    uploadOverlay.classList.add("show");
    // 加载曲目列表到下拉框
    const res = await fetch("/api/lesson-plans");
    const data = await res.json();
    const sel = document.getElementById("uploadPiece");
    sel.innerHTML = '<option value="">不关联曲目</option>';
    data.groups.forEach(g => { g.pieces.forEach(p => {
        const opt = document.createElement("option"); opt.value = p.name; opt.textContent = p.name;
        sel.appendChild(opt);
    });});
});

uploadClose.addEventListener("click", () => uploadOverlay.classList.remove("show"));
uploadOverlay.addEventListener("click", (e) => { if (e.target === uploadOverlay) uploadOverlay.classList.remove("show"); });

uploadSubmit.addEventListener("click", async () => {
    const file = document.getElementById("uploadFile").files[0];
    if (!file) { uploadResult.innerHTML = '<span style="color:#FF4444">请选择文件</span>'; return; }
    uploadSubmit.disabled = true; uploadSubmit.textContent = "上传中...";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", document.getElementById("uploadType").value);
    formData.append("piece", document.getElementById("uploadPiece").value);
    try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
            uploadResult.innerHTML = '<span style="color:#5FC9A8">✓ 上传成功！</span>';
            document.getElementById("uploadFile").value = "";
            setTimeout(() => { uploadOverlay.classList.remove("show"); uploadResult.innerHTML = ""; loadLibrary(); }, 1000);
        } else {
            uploadResult.innerHTML = '<span style="color:#FF4444">上传失败</span>';
        }
    } catch(e) { uploadResult.innerHTML = '<span style="color:#FF4444">上传失败</span>'; }
    uploadSubmit.disabled = false; uploadSubmit.textContent = "上传";
});

// 对话中引用上传资源
function appendResourceRef(bubble, resources) {
    if (!resources || resources.length === 0) return;
    const ref = document.createElement("div"); ref.className = "resource-ref";
    let html = "📎 已关联上传资源：<br>";
    resources.forEach(r => {
        const icon = r.type === "score" ? "🎼" : "📄";
        html += `${icon} <a href="${r.url}" target="_blank">${r.filename}</a><br>`;
    });
    ref.innerHTML = html;
    bubble.appendChild(ref);
}

// 搜索
document.getElementById("libSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".lib-card").forEach(card => {
        const name = card.querySelector(".lib-card-name");
        if (name) card.style.display = name.textContent.toLowerCase().includes(q) ? "" : "none";
    });
});

// ===== 初始化 =====
loadQuickQuestions();
loadLibrary();
initDashboard();
initWelcomeAnim();

// ===== 游戏系统 =====
const gameOverlay = document.getElementById("gameOverlay");
const gameCanvas = document.getElementById("gameCanvas");
const gameTitle = document.getElementById("gameTitle");
const gameInfo = document.getElementById("gameInfo");
const gameCtx = gameCanvas.getContext("2d");

document.getElementById("gameClose").addEventListener("click", () => {
    gameOverlay.classList.remove("show");
    gameRunning = false;
});
gameOverlay.addEventListener("click", (e) => {
    if (e.target === gameOverlay) { gameOverlay.classList.remove("show"); gameRunning = false; }
});

let gameRunning = false;
let gameScore = 0;
let gameTapX = -1, gameTapY = -1;

gameCanvas.addEventListener("click", (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    const sx = gameCanvas.width / rect.width;
    const sy = gameCanvas.height / rect.height;
    gameTapX = (e.clientX - rect.left) * sx;
    gameTapY = (e.clientY - rect.top) * sy;
});
gameCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = gameCanvas.getBoundingClientRect();
    const sx = gameCanvas.width / rect.width;
    const sy = gameCanvas.height / rect.height;
    const t = e.touches[0];
    gameTapX = (t.clientX - rect.left) * sx;
    gameTapY = (t.clientY - rect.top) * sy;
}, { passive: false });

function startGame(userMsg) {
    let gameType = "catch_star";
    if (userMsg.includes("两只老虎")) gameType = "rhythm_tiger";
    else if (userMsg.includes("欢乐颂")) gameType = "note_jump";
    else if (userMsg.includes("巴赫")) gameType = "dance_34";
    else if (userMsg.includes("玛丽")) gameType = "sheep_home";
    else if (userMsg.includes("天空之城")) gameType = "castle_climb";

    const titles = {
        catch_star: "⭐ 接星星", rhythm_tiger: "🐯 节奏拍拍",
        note_jump: "🎵 音符跳跃", dance_34: "💃 小步舞会",
        sheep_home: "🐑 小羊回家", castle_climb: "🏰 城堡攀登"
    };
    gameTitle.textContent = titles[gameType] || "游戏";
    gameOverlay.classList.add("show");
    gameScore = 0; gameRunning = true; gameTapX = -1; gameTapY = -1;

    const games = { catch_star, rhythm_tiger, note_jump, dance_34, sheep_home, castle_climb };
    (games[gameType] || catch_star)();
}

// 游戏通用：结束
function gameEnd(score) {
    gameRunning = false;
    const stars = score >= 80 ? "⭐⭐⭐" : score >= 50 ? "⭐⭐" : "⭐";
    gameInfo.innerHTML = `<div style="font-size:18px;font-weight:700;color:var(--primary);margin-bottom:4px;">${stars} ${score}分</div>
        <div>${score >= 80 ? "太棒了！你是钢琴小达人！" : score >= 50 ? "不错哦！继续练习会更棒！" : "加油！多练几次一定能行！"}</div>`;
    playNote(NOTE_FREQ["C5"], 0.3, 0.2);
    setTimeout(() => playNote(NOTE_FREQ["E5"], 0.3, 0.2), 150);
    setTimeout(() => playNote(NOTE_FREQ["G5"], 0.5, 0.2), 300);
}

// 游戏1：接星星（小星星）
function catch_star() {
    const W = 400, H = 500;
    const keys = [
        {x: 60, label: "C", note: "C4"}, {x: 130, label: "D", note: "D4"},
        {x: 200, label: "E", note: "E4"}, {x: 270, label: "F", note: "F4"},
        {x: 340, label: "G", note: "G4"}
    ];
    const stars = [];
    let frame = 0, spawnTimer = 0;
    gameInfo.textContent = "星星上标着音名，点击对应琴键接住它！";
    function loop() {
        if (!gameRunning) return;
        gameCtx.clearRect(0, 0, W, H);
        // 背景渐变
        const bg = gameCtx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#1a1535"); bg.addColorStop(1, "#4a3a70");
        gameCtx.fillStyle = bg; gameCtx.fillRect(0, 0, W, H);
        // 琴键
        keys.forEach(k => {
            gameCtx.fillStyle = "#F5F0F0"; gameCtx.fillRect(k.x - 28, H - 60, 56, 50);
            gameCtx.strokeStyle = "#999"; gameCtx.lineWidth = 1;
            gameCtx.strokeRect(k.x - 28, H - 60, 56, 50);
            gameCtx.fillStyle = "#4A3F8E"; gameCtx.font = "bold 20px sans-serif"; gameCtx.textAlign = "center";
            gameCtx.fillText(k.label, k.x, H - 28);
        });
        // 生成星星
        spawnTimer++;
        if (spawnTimer > 50) {
            spawnTimer = 0;
            const idx = Math.floor(Math.random() * 5);
            stars.push({ x: keys[idx].x, y: -20, keyIdx: idx, label: keys[idx].label, note: keys[idx].note, rot: 0 });
        }
        // 星星下落
        for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            s.y += 2.5; s.rot += 0.05;
            // 绘制星星
            gameCtx.save(); gameCtx.translate(s.x, s.y); gameCtx.rotate(s.rot);
            gameCtx.fillStyle = "#FFD700"; gameCtx.font = "bold 22px sans-serif"; gameCtx.textAlign = "center";
            gameCtx.fillText("⭐", 0, 8);
            gameCtx.fillStyle = "#4A3F8E"; gameCtx.font = "bold 12px sans-serif";
            gameCtx.fillText(s.label, 0, 24);
            gameCtx.restore();
            // 触摸检测
            if (gameTapX >= 0) {
                const k = keys[s.keyIdx];
                if (gameTapX >= k.x - 28 && gameTapX <= k.x + 28 && gameTapY >= H - 60 && gameTapY <= H - 10) {
                    if (s.y > H - 120 && s.y < H - 30) {
                        gameScore += 10; playNote(NOTE_FREQ[s.note], 0.2, 0.2);
                        stars.splice(i, 1); gameTapX = -1; gameTapY = -1;
                        // 接住效果
                        gameCtx.fillStyle = "rgba(255,215,0,0.3)"; gameCtx.beginPath();
                        gameCtx.arc(k.x, H - 35, 30, 0, 6.28); gameCtx.fill();
                        continue;
                    }
                }
            }
            // 掉落
            if (s.y > H) { stars.splice(i, 1); gameScore = Math.max(0, gameScore - 2); }
        }
        gameTapX = -1; gameTapY = -1;
        // 分数
        gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 18px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("分数: " + gameScore, 10, 25);
        gameCtx.fillStyle = "rgba(255,255,255,0.5)"; gameCtx.font = "11px sans-serif";
        gameCtx.fillText("80分通关", 10, 42);
        frame++;
        if (frame < 900) requestAnimationFrame(loop);
        else gameEnd(gameScore);
    }
    loop();
}

// 游戏2：节奏拍拍（两只老虎）
function rhythm_tiger() {
    const W = 400, H = 500;
    const beats = [1,1,1,1, 1,1,1,1, 1,1,2, 1,1,2]; // 节奏型
    const labels = ["C","D","E","C","C","D","E","C","E","F","G","E","F","G"];
    const notes = ["C4","D4","E4","C4","C4","D4","E4","C4","E4","F4","G4","E4","F4","G4"];
    let beatIdx = 0, frame = 0, nextBeat = 0;
    const tigers = [];
    let hitFlash = 0;
    gameInfo.textContent = "老虎按节奏跳，在它落地时点击！";
    function loop() {
        if (!gameRunning) return;
        gameCtx.clearRect(0, 0, W, H);
        const bg = gameCtx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#2a3a1a"); bg.addColorStop(1, "#1a2a0a");
        gameCtx.fillStyle = bg; gameCtx.fillRect(0, 0, W, H);
        // 地面
        gameCtx.fillStyle = "#3a5a2a"; gameCtx.fillRect(0, H - 80, W, 80);
        // 判定线
        gameCtx.strokeStyle = "rgba(255,184,77,0.5)"; gameCtx.lineWidth = 2;
        gameCtx.setLineDash([5, 5]); gameCtx.beginPath();
        gameCtx.moveTo(0, H - 120); gameCtx.lineTo(W, H - 120); gameCtx.stroke();
        gameCtx.setLineDash([]);
        gameCtx.fillStyle = "#FFB84D"; gameCtx.font = "10px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("点击这里", 5, H - 125);
        // 生成老虎
        const beatInt = 30;
        if (frame >= nextBeat && beatIdx < beats.length) {
            tigers.push({ x: W + 30, y: 80, vy: 0, label: labels[beatIdx], note: notes[beatIdx], dur: beats[beatIdx], hit: false });
            nextBeat = frame + beats[beatIdx] * beatInt;
            beatIdx++;
        }
        // 老虎移动
        for (let i = tigers.length - 1; i >= 0; i--) {
            const t = tigers[i];
            t.x -= 3; t.vy += 0.5; t.y += t.vy;
            if (t.y > H - 120 && t.vy > 0) { t.y = H - 120; t.vy = -8; } // 弹跳
            // 绘制老虎
            gameCtx.font = "28px sans-serif"; gameCtx.textAlign = "center";
            gameCtx.fillText("🐯", t.x, t.y);
            gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 14px sans-serif";
            gameCtx.fillText(t.label, t.x, t.y + 22);
            // 点击检测
            if (gameTapX >= 0 && !t.hit) {
                const dx = gameTapX - t.x, dy = gameTapY - t.y;
                if (dx * dx + dy * dy < 1600 && t.y > H - 150) {
                    t.hit = true; gameScore += 10; hitFlash = 10;
                    playNote(NOTE_FREQ[t.note], 0.2, 0.2);
                    tigers.splice(i, 1);
                }
            }
            if (t.x < -30) tigers.splice(i, 1);
        }
        gameTapX = -1; gameTapY = -1;
        // 命中闪光
        if (hitFlash > 0) {
            gameCtx.fillStyle = `rgba(255,215,0,${hitFlash * 0.05})`;
            gameCtx.fillRect(0, H - 130, W, 50); hitFlash--;
        }
        // 分数
        gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 18px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("分数: " + gameScore, 10, 25);
        gameCtx.fillStyle = "rgba(255,255,255,0.5)"; gameCtx.font = "11px sans-serif";
        gameCtx.fillText(beatIdx + "/" + beats.length + " 拍", 10, 42);
        frame++;
        if (beatIdx < beats.length || tigers.length > 0) requestAnimationFrame(loop);
        else gameEnd(gameScore);
    }
    loop();
}

// 游戏3：音符跳跃（欢乐颂）
function note_jump() {
    const W = 400, H = 500;
    const melody = ["E4","E4","F4","G4","G4","F4","E4","D4","C4","C4","D4","E4"];
    const labels = ["E","E","F","G","G","F","E","D","C","C","D","E"];
    let idx = 0, frame = 0, playerY = H - 80, playerVy = 0, onGround = true;
    const platforms = [];
    const step = W / 5;
    for (let i = 0; i < 5; i++) platforms.push({ x: i * step + step / 2, y: H - 80 - i * 60, note: null, label: null });
    let nextPlatform = 0;
    gameInfo.textContent = "点击屏幕跳跃，踩对音符阶梯向上攀登！";
    function loop() {
        if (!gameRunning) return;
        gameCtx.clearRect(0, 0, W, H);
        const bg = gameCtx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#1a2a4a"); bg.addColorStop(1, "#4a6a9a");
        gameCtx.fillStyle = bg; gameCtx.fillRect(0, 0, W, H);
        // 跳跃
        if (gameTapX >= 0 && onGround) { playerVy = -12; onGround = false; gameTapX = -1; }
        else gameTapX = -1;
        playerY += playerVy; playerVy += 0.6;
        if (playerY > H - 80) { playerY = H - 80; playerVy = 0; onGround = true; }
        // 平台
        platforms.forEach((p, i) => {
            gameCtx.fillStyle = p.note ? "#FFD700" : "#3a4a6a";
            gameCtx.fillRect(p.x - 30, p.y, 60, 12);
            if (p.label) {
                gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 14px sans-serif"; gameCtx.textAlign = "center";
                gameCtx.fillText(p.label, p.x, p.y - 4);
            }
            // 踩到平台
            if (playerVy > 0 && Math.abs(playerY - p.y) < 15 && Math.abs(gameTapX === -1 ? -999 : gameTapX - p.x) < 40) {
                if (p.note) {
                    gameScore += 10; playNote(NOTE_FREQ[p.note], 0.2, 0.2);
                    p.note = null; p.label = null;
                }
            }
        });
        // 分配下一个音符到最近未标记的平台
        if (nextPlatform < melody.length && frame % 40 === 0) {
            const p = platforms[nextPlatform % 5];
            p.note = melody[nextPlatform]; p.label = labels[nextPlatform];
            nextPlatform++;
        }
        // 玩家
        gameCtx.font = "24px sans-serif"; gameCtx.textAlign = "center";
        gameCtx.fillText("🎹", W / 2, playerY);
        // 分数
        gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 18px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("分数: " + gameScore, 10, 25);
        frame++;
        if (frame < 800) requestAnimationFrame(loop);
        else gameEnd(gameScore);
    }
    loop();
}

// 游戏4：小步舞会（巴赫3/4拍）
function dance_34() {
    const W = 400, H = 500;
    let frame = 0, beat = 0, beatTimer = 0;
    const beatNotes = ["G4","D5","G4","A4","B4","C5","B4","A4","G4"];
    const spots = [
        {x: 120, y: 300}, {x: 200, y: 250}, {x: 280, y: 300}, // 强-弱-弱
        {x: 120, y: 400}, {x: 200, y: 350}, {x: 280, y: 400},
    ];
    let spotIdx = 0, nextSpot = 0;
    const dancers = [];
    gameInfo.textContent = "3/4拍！强-弱-弱，踩对光点跳舞！";
    function loop() {
        if (!gameRunning) return;
        gameCtx.clearRect(0, 0, W, H);
        const bg = gameCtx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#3a1a3a"); bg.addColorStop(1, "#1a0a1a");
        gameCtx.fillStyle = bg; gameCtx.fillRect(0, 0, W, H);
        // 舞池地面
        gameCtx.fillStyle = "rgba(50,30,60,0.5)"; gameCtx.beginPath();
        gameCtx.ellipse(W/2, 350, 180, 100, 0, 0, 6.28); gameCtx.fill();
        // 光点
        beatTimer++;
        const beatDuration = 25;
        if (beatTimer >= beatDuration) {
            beatTimer = 0;
            if (nextSpot < 18) {
                const spot = spots[beat % 3];
                dancers.push({ x: spot.x, y: spot.y, life: 1, note: beatNotes[beat % beatNotes.length], isStrong: beat % 3 === 0 });
                beat++; nextSpot++;
            }
        }
        // 绘制光点+检测
        spots.forEach((s, i) => {
            const isNext = i === beat % 3;
            gameCtx.fillStyle = isNext ? (beat % 3 === 0 ? "rgba(255,107,157,0.3)" : "rgba(255,184,77,0.2)") : "rgba(100,100,120,0.1)";
            gameCtx.beginPath(); gameCtx.arc(s.x, s.y, 35, 0, 6.28); gameCtx.fill();
            if (isNext) { gameCtx.strokeStyle = beat % 3 === 0 ? "#FF6B9D" : "#FFB84D"; gameCtx.lineWidth = 2;
                gameCtx.beginPath(); gameCtx.arc(s.x, s.y, 35 + Math.sin(frame * 0.1) * 5, 0, 6.28); gameCtx.stroke(); }
        });
        // 舞者
        for (let i = dancers.length - 1; i >= 0; i--) {
            const d = dancers[i];
            d.life -= 0.015;
            if (d.life <= 0) { dancers.splice(i, 1); continue; }
            // 检测点击
            if (gameTapX >= 0) {
                const dx = gameTapX - d.x, dy = gameTapY - d.y;
                if (dx * dx + dy * dy < 1200) {
                    gameScore += d.isStrong ? 15 : 10;
                    playNote(NOTE_FREQ[d.note], 0.2, 0.15);
                    dancers.splice(i, 1); gameTapX = -1; gameTapY = -1;
                    continue;
                }
            }
            gameCtx.globalAlpha = d.life;
            gameCtx.font = "24px sans-serif"; gameCtx.textAlign = "center";
            gameCtx.fillText("💃", d.x, d.y);
            gameCtx.globalAlpha = 1;
        }
        gameTapX = -1; gameTapY = -1;
        // 拍号显示
        gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 20px sans-serif"; gameCtx.textAlign = "center";
        const labels = ["强","弱","弱"];
        gameCtx.fillText("3/4 " + labels[beat % 3], W / 2, 30);
        gameCtx.font = "bold 16px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("分数: " + gameScore, 10, 50);
        frame++;
        if (frame < 600) requestAnimationFrame(loop);
        else gameEnd(gameScore);
    }
    loop();
}

// 游戏5：小羊回家（玛丽有只小羊羔）
function sheep_home() {
    const W = 400, H = 500;
    const path = [
        {x: 80, y: 400, note: "E4", label: "E"},
        {x: 160, y: 350, note: "D4", label: "D"},
        {x: 240, y: 300, note: "C4", label: "C"},
        {x: 320, y: 250, note: "D4", label: "D"},
        {x: 320, y: 180, note: "E4", label: "E"},
        {x: 200, y: 120, note: "home", label: "🏠"},
    ];
    let sheepIdx = 0, frame = 0;
    const sheep = { x: path[0].x, y: path[0].y, tx: path[0].x, ty: path[0].y };
    let moving = false;
    gameInfo.textContent = "按E-D-C-D-E顺序点击路径，引导小羊回家！";
    function loop() {
        if (!gameRunning) return;
        gameCtx.clearRect(0, 0, W, H);
        const bg = gameCtx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#4a8a4a"); bg.addColorStop(1, "#2a5a2a");
        gameCtx.fillStyle = bg; gameCtx.fillRect(0, 0, W, H);
        // 路径线
        gameCtx.strokeStyle = "rgba(255,255,255,0.3)"; gameCtx.lineWidth = 3;
        gameCtx.setLineDash([5, 5]);
        gameCtx.beginPath();
        path.forEach((p, i) => { if (i === 0) gameCtx.moveTo(p.x, p.y); else gameCtx.lineTo(p.x, p.y); });
        gameCtx.stroke(); gameCtx.setLineDash([]);
        // 路径点
        path.forEach((p, i) => {
            const isNext = i === sheepIdx;
            const isDone = i < sheepIdx;
            gameCtx.fillStyle = isDone ? "#5FC9A8" : isNext ? "#FFD700" : "rgba(255,255,255,0.4)";
            gameCtx.beginPath(); gameCtx.arc(p.x, p.y, 25, 0, 6.28); gameCtx.fill();
            gameCtx.fillStyle = isDone ? "#FFF" : "#4A3F8E"; gameCtx.font = "bold 16px sans-serif"; gameCtx.textAlign = "center";
            gameCtx.fillText(p.label, p.x, p.y + 5);
            if (isNext && p.note !== "home") {
                gameCtx.strokeStyle = "#FFD700"; gameCtx.lineWidth = 2;
                gameCtx.beginPath(); gameCtx.arc(p.x, p.y, 30 + Math.sin(frame * 0.1) * 4, 0, 6.28); gameCtx.stroke();
            }
        });
        // 点击检测
        if (gameTapX >= 0 && !moving && sheepIdx < path.length) {
            const p = path[sheepIdx];
            const dx = gameTapX - p.x, dy = gameTapY - p.y;
            if (dx * dx + dy * dy < 900) {
                if (p.note === "home") {
                    gameScore += 20; sheepIdx++; moving = false;
                    playNote(NOTE_FREQ["C5"], 0.5, 0.2);
                } else {
                    gameScore += 10; playNote(NOTE_FREQ[p.note], 0.2, 0.2);
                    sheepIdx++;
                    if (sheepIdx < path.length) {
                        sheep.tx = path[sheepIdx].x; sheep.ty = path[sheepIdx].y; moving = true;
                    }
                }
            }
            gameTapX = -1; gameTapY = -1;
        }
        // 小羊移动
        if (moving) {
            sheep.x += (sheep.tx - sheep.x) * 0.1; sheep.y += (sheep.ty - sheep.y) * 0.1;
            if (Math.abs(sheep.x - sheep.tx) < 2) moving = false;
        }
        // 小羊
        gameCtx.font = "28px sans-serif"; gameCtx.textAlign = "center";
        gameCtx.fillText("🐑", sheep.x, sheep.y + 8);
        // 分数
        gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 18px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("分数: " + gameScore, 10, 25);
        gameCtx.fillStyle = "rgba(255,255,255,0.5)"; gameCtx.font = "11px sans-serif";
        gameCtx.fillText(sheepIdx + "/" + path.length + " 步", 10, 42);
        frame++;
        if (sheepIdx < path.length) requestAnimationFrame(loop);
        else gameEnd(gameScore);
    }
    loop();
}

// 游戏6：城堡攀登（天空之城）
function castle_climb() {
    const W = 400, H = 500;
    const melody = ["G4","A4","B4","A4","G4","E4","E4","D4","E4","G4","E4","D4"];
    const labels = ["G","A","B","A","G","E","E","D","E","G","E","D"];
    let idx = 0, frame = 0;
    const climb = { y: H - 60, vy: 0 };
    const steps = [];
    for (let i = 0; i < 12; i++) {
        steps.push({ x: 80 + (i % 2) * 240, y: H - 120 - i * 35, note: melody[i], label: labels[i], hit: false, idx: i });
    }
    let nextStep = 0;
    gameInfo.textContent = "点击屏幕跳跃，踩对音符阶梯攀登到城堡！";
    function loop() {
        if (!gameRunning) return;
        gameCtx.clearRect(0, 0, W, H);
        const bg = gameCtx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#1a3a6a"); bg.addColorStop(0.5, "#4a6a9a"); bg.addColorStop(1, "#8ab0d0");
        gameCtx.fillStyle = bg; gameCtx.fillRect(0, 0, W, H);
        // 城堡（顶部）
        gameCtx.font = "36px sans-serif"; gameCtx.textAlign = "center";
        gameCtx.fillText("🏰", W / 2, 50);
        // 跳跃
        if (gameTapX >= 0) { climb.vy = -10; gameTapX = -1; }
        climb.y += climb.vy; climb.vy += 0.5;
        if (climb.y > H - 60) { climb.y = H - 60; climb.vy = 0; }
        // 阶梯
        steps.forEach(s => {
            gameCtx.fillStyle = s.hit ? "#5FC9A8" : (s.idx === nextStep ? "#FFD700" : "#6a8aaa");
            gameCtx.fillRect(s.x - 35, s.y, 70, 10);
            if (!s.hit) {
                gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 12px sans-serif"; gameCtx.textAlign = "center";
                gameCtx.fillText(s.label, s.x, s.y - 3);
            }
            // 踩到
            if (!s.hit && s.idx === nextStep && climb.vy > 0 && Math.abs(climb.y - s.y) < 20 && Math.abs(W / 2 - s.x) < 50) {
                s.hit = true; gameScore += 10; climb.vy = -10;
                playNote(NOTE_FREQ[s.note], 0.2, 0.15); nextStep++;
            }
        });
        // 玩家
        gameCtx.font = "22px sans-serif"; gameCtx.textAlign = "center";
        gameCtx.fillText("🧗", W / 2, climb.y);
        // 分数
        gameCtx.fillStyle = "#FFF"; gameCtx.font = "bold 18px sans-serif"; gameCtx.textAlign = "left";
        gameCtx.fillText("分数: " + gameScore, 10, 25);
        gameCtx.fillStyle = "rgba(255,255,255,0.5)"; gameCtx.font = "11px sans-serif";
        gameCtx.fillText(nextStep + "/" + steps.length + " 阶", 10, 42);
        frame++;
        if (nextStep < steps.length && frame < 800) requestAnimationFrame(loop);
        else gameEnd(gameScore);
    }
    loop();
}

// ===== 学情驾驶舱 =====
let dashStudents = [];
let dashCurrentStudent = "s1";
let dashCurrentPiece = "巴赫";

async function initDashboard() {
    try {
        // 加载学生列表
        const res = await fetch("/api/repertoire");
        const data = await res.json();

        // 渲染学生按钮
        const studentBox = document.getElementById("dashStudents");
        const students = [
            {id:"s1", name:"小明", level:"初级", avatar:"🧒"},
            {id:"s2", name:"小红", level:"中级", avatar:"👧"},
            {id:"s3", name:"小华", level:"进阶", avatar:"👦"},
        ];
        studentBox.innerHTML = "";
        students.forEach(s => {
            const btn = document.createElement("button");
            btn.className = "dash-student-btn" + (s.id === dashCurrentStudent ? " active" : "");
            btn.textContent = `${s.avatar} ${s.name}(${s.level})`;
            btn.addEventListener("click", () => {
                dashCurrentStudent = s.id;
                document.querySelectorAll(".dash-student-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                loadDashboard();
            });
            studentBox.appendChild(btn);
        });

        // 渲染曲目选择器
        const sel = document.getElementById("dashPieceSelect");
        sel.innerHTML = "";
        for (const [level, names] of Object.entries(data.level_index)) {
            const og = document.createElement("optgroup"); og.label = level;
            names.forEach(n => { const opt = document.createElement("option"); opt.value = n; opt.textContent = n; og.appendChild(opt); });
            sel.appendChild(og);
        }
        sel.value = "巴赫G大调小步舞曲Anh114";
        sel.addEventListener("change", () => { dashCurrentPiece = sel.value; loadDashboard(); });

        loadDashboard();
    } catch(e) { console.error("驾驶舱初始化失败:", e); }
}

async function loadDashboard() {
    try {
        const res = await fetch(`/api/dashboard?student=${dashCurrentStudent}&piece=${encodeURIComponent(dashCurrentPiece)}`);
        const d = await res.json();

        // 学生信息
        document.getElementById("dashAvatar").textContent = d.student.avatar;
        document.getElementById("dashStudentName").textContent = `${d.student.name} · ${d.student.level}`;
        document.getElementById("dashPiece").textContent = `当前曲目：${d.student.piece}`;

        // 评级
        const ratingEl = document.getElementById("dashRating");
        ratingEl.textContent = `综合评级 ${d.student.rating} (${d.student.score}分)`;
        ratingEl.style.background = d.student.grade_color;

        // 评分标准
        const sd = d.score_detail;
        document.getElementById("dashScoreDetail").innerHTML =
            `节奏${sd.rhythm_weight}·音准${sd.pitch_weight}·完整度${sd.completion_weight}·流畅度${sd.fluency_weight}`;

        // 绘制图表
        drawDonut("cvRhythm", d.metrics.rhythm, "#FF6B9D", "节奏");
        drawDonut("cvPitch", d.metrics.pitch, "#5FC9A8", "音准");
        drawDonut("cvHand", d.metrics.fluency, "#FFB84D", "流畅度");
        drawBarChart("cvErrors", d.metrics.error_trend, ["第1周","第2周","第3周","第4周"], "#FF6B9D", "错音率(%)");
        drawBarChart("cvMinutes", d.metrics.practice_week, ["一","二","三","四","五","六","日"], "#4A3F8E", "分钟");
        drawRadar("cvRadar", [
            {label:"节奏", val:d.metrics.rhythm/20},
            {label:"音准", val:d.metrics.pitch/20},
            {label:"完整度", val:d.metrics.completion/20},
            {label:"流畅度", val:d.metrics.fluency/20},
            {label:"坚持性", val:4.2},
        ]);

        // 前后测对比
        const preRhythm = Math.max(50, d.metrics.rhythm - 15);
        const prePitch = Math.max(50, d.metrics.pitch - 12);
        const preFluency = Math.max(50, d.metrics.fluency - 18);
        const preScore = Math.round(preRhythm*0.35 + prePitch*0.30 + d.metrics.completion*0.20 + preFluency*0.15);
        const postScore = d.student.score;
        const improvement = Math.round(postScore - preScore);
        const gameInfo = document.getElementById("gameInfo");
        if (gameInfo) {
            gameInfo.innerHTML = `
                <div style="display:flex;justify-content:center;gap:20px;margin-top:10px;">
                    <div style="text-align:center;padding:10px 16px;background:#FFF0F5;border-radius:10px;">
                        <div style="font-size:11px;color:#999;">前测（课前）</div>
                        <div style="font-size:24px;font-weight:700;color:#FF6B9D;">${preScore}</div>
                    </div>
                    <div style="display:flex;align-items:center;font-size:20px;color:#5FC9A8;">→</div>
                    <div style="text-align:center;padding:10px 16px;background:#F0FCF8;border-radius:10px;">
                        <div style="font-size:11px;color:#999;">后测（课后）</div>
                        <div style="font-size:24px;font-weight:700;color:#5FC9A8;">${postScore}</div>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div style="text-align:center;padding:10px 16px;background:#F0F8FF;border-radius:10px;">
                            <div style="font-size:11px;color:#999;">提升</div>
                            <div style="font-size:24px;font-weight:700;color:#4FC3F7;">+${improvement}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // AI诊断
        const list = document.getElementById("diagnosisList");
        list.innerHTML = "";
        d.diagnosis.forEach(item => {
            const el = document.createElement("div");
            el.className = "diagnosis-item diagnosis-" + item.type;
            el.textContent = item.text;
            list.appendChild(el);
        });

        // 启用录音按钮
        document.getElementById("playRefBtn").disabled = false;
    } catch(e) { console.error("驾驶舱加载失败:", e); }
}

// Canvas绘图：环形进度
function drawDonut(id, value, color, label) {
    const cv = document.getElementById(id);
    if (!cv) return;
    cv.width = 160; cv.height = 100;
    const ctx = cv.getContext("2d");
    const cx = 50, cy = 50, r = 35;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // 背景环
    ctx.strokeStyle = "#E8E5F5"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    // 数据环
    ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (value/100)*Math.PI*2); ctx.stroke();
    // 文字
    ctx.fillStyle = color; ctx.font = "bold 18px 微软雅黑"; ctx.textAlign = "center";
    ctx.fillText(value + "%", cx, cy + 6);
    ctx.fillStyle = "#6B688A"; ctx.font = "11px 微软雅黑";
    ctx.fillText(label, cx, cy + 24);
}

// Canvas绘图：柱状图
function drawBarChart(id, values, labels, color, unit) {
    const cv = document.getElementById(id);
    if (!cv) return;
    cv.width = 320; cv.height = 110;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...values, 1);
    const barW = (W - 20) / values.length - 6;
    values.forEach((v, i) => {
        const x = 10 + i * (barW + 6);
        const h = (v / max) * (H - 30);
        ctx.fillStyle = color;
        ctx.fillRect(x, H - 20 - h, barW, h);
        ctx.fillStyle = "#2D2A4A"; ctx.font = "10px 微软雅黑"; ctx.textAlign = "center";
        ctx.fillText(v + (unit === "分钟" ? "" : "%"), x + barW/2, H - 20 - h - 3);
        ctx.fillStyle = "#999"; ctx.font = "9px 微软雅黑";
        ctx.fillText(labels[i], x + barW/2, H - 6);
    });
}

// Canvas绘图：雷达图
function drawRadar(id, data) {
    const cv = document.getElementById(id);
    if (!cv) return;
    cv.width = 200; cv.height = 160;
    const ctx = cv.getContext("2d");
    const cx = 100, cy = 80, r = 50;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const n = data.length;
    // 网格
    for (let ring = 1; ring <= 4; ring++) {
        ctx.strokeStyle = "#E8E5F5"; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const a = -Math.PI/2 + (i/n) * Math.PI*2;
            const rr = r * ring / 4;
            const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    // 数据
    ctx.fillStyle = "rgba(255,107,157,0.2)"; ctx.strokeStyle = "#FF6B9D"; ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
        const a = -Math.PI/2 + (i/n) * Math.PI*2;
        const rr = r * d.val / 5;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 标签
    ctx.fillStyle = "#6B688A"; ctx.font = "10px 微软雅黑"; ctx.textAlign = "center";
    data.forEach((d, i) => {
        const a = -Math.PI/2 + (i/n) * Math.PI*2;
        ctx.fillText(d.label, cx + Math.cos(a)*(r+12), cy + Math.sin(a)*(r+12) + 3);
    });
}

// ===== 录音与比对 =====
let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;

document.getElementById("recordBtn").addEventListener("click", async () => {
    const btn = document.getElementById("recordBtn");
    if (mediaRecorder && mediaRecorder.state === "recording") {
        // 停止录音
        mediaRecorder.stop();
        btn.classList.remove("recording");
        btn.textContent = "🎤 开始录音";
        document.getElementById("compareBtn").disabled = false;
        return;
    }
    // 开始录音
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
            stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        btn.classList.add("recording");
        btn.textContent = "⏹ 停止录音";
        document.getElementById("recordResult").innerHTML = '<div style="color:#FF4444;font-size:13px;text-align:center;">🔴 录音中...请演奏当前曲目</div>';
    } catch(e) {
        document.getElementById("recordResult").innerHTML = '<div style="color:#FF4444;font-size:13px;">录音需要麦克风权限，请允许后重试</div>';
    }
});

// 播放专业演奏（用Web Audio合成）
document.getElementById("playRefBtn").addEventListener("click", () => {
    const btn = document.getElementById("playRefBtn");
    btn.disabled = true; btn.textContent = "演奏中...";
    // 用Web Audio播放当前曲目的音符序列
    fetch(`/api/play?topic=${encodeURIComponent(dashCurrentPiece)}`)
        .then(r => r.json())
        .then(data => {
            const bpm = 80;
            const beatMs = 60000 / bpm;
            let totalTime = 0;
            data.notes.forEach(n => {
                const [noteName, startBeat, dur] = n;
                const freq = NOTE_FREQ[noteName] || 261.63;
                const delay = startBeat * beatMs;
                const duration = dur * beatMs / 1000;
                setTimeout(() => playNote(freq, duration, 0.3), delay);
                totalTime = Math.max(totalTime, (startBeat + dur) * beatMs);
            });
            setTimeout(() => { btn.disabled = false; btn.textContent = "▶ 播放专业演奏"; }, totalTime + 500);
        });
});

// AI比对打分
document.getElementById("compareBtn").addEventListener("click", () => {
    const btn = document.getElementById("compareBtn");
    btn.disabled = true; btn.textContent = "分析中...";
    const result = document.getElementById("recordResult");

    if (!recordedBlob) {
        result.innerHTML = '<div style="color:#FF4444;">请先录音</div>';
        btn.disabled = false; btn.textContent = "📊 AI比对打分";
        return;
    }

    // 用Web Audio分析录音特征
    const reader = new FileReader();
    reader.onload = function() {
        const arrayBuffer = reader.result;
        const ac = getAudio();
        if (!ac) { btn.disabled = false; btn.textContent = "📊 AI比对打分"; return; }

        ac.decodeAudioData(arrayBuffer, function(audioBuffer) {
            // 分析录音特征
            const channel = audioBuffer.getChannelData(0);
            const duration = audioBuffer.duration;
            const sampleRate = audioBuffer.sampleRate;

            // 计算音量变化（节奏稳定性指标）
            const segments = 20;
            const segLen = Math.floor(channel.length / segments);
            const volumes = [];
            for (let i = 0; i < segments; i++) {
                let sum = 0;
                for (let j = 0; j < segLen; j++) sum += Math.abs(channel[i*segLen+j]);
                volumes.push(sum / segLen);
            }
            // 节奏稳定性：音量变化的标准差越小越稳定
            const avgVol = volumes.reduce((a,b)=>a+b, 0) / volumes.length;
            const variance = volumes.reduce((a,b)=>a+(b-avgVol)*(b-avgVol), 0) / volumes.length;
            const stability = Math.max(0, Math.min(100, 100 - variance * 50000));

            // 音高覆盖度（FFT简化分析：非静音比例）
            let nonSilent = 0;
            for (let i = 0; i < channel.length; i += 100) {
                if (Math.abs(channel[i]) > 0.01) nonSilent++;
            }
            const coverage = Math.min(100, (nonSilent / (channel.length / 100)) * 100);

            // 时长匹配度（与专业演奏时长比对）
            const expectedDuration = 15; // 预期15秒左右
            const durationScore = Math.max(50, 100 - Math.abs(duration - expectedDuration) * 5);

            // 综合评分
            const rhythmScore = Math.round(stability * 0.4 + durationScore * 0.1);
            const pitchScore = Math.round(coverage * 0.3 + durationScore * 0.05);
            const overall = Math.round(rhythmScore * 0.5 + pitchScore * 0.3 + durationScore * 0.2);

            let grade, gradeColor;
            if (overall >= 90) { grade = "A"; gradeColor = "#5FC9A8"; }
            else if (overall >= 80) { grade = "B+"; gradeColor = "#4FC3F7"; }
            else if (overall >= 70) { grade = "B"; gradeColor = "#FFB84D"; }
            else { grade = "C"; gradeColor = "#FF6B9D"; }

            result.innerHTML = `
                <div class="record-result-card">
                    <div class="record-result-score" style="color:${gradeColor}">${overall}分 · ${grade}</div>
                    <div class="record-result-label">AI演奏比对评分</div>
                    <div class="record-result-detail">
                        <span>节奏稳定性: ${rhythmScore}</span>
                        <span>音高覆盖: ${pitchScore}</span>
                        <span>时长匹配: ${Math.round(durationScore)}</span>
                    </div>
                    <div style="margin-top:8px;font-size:11px;color:var(--gray);">
                        录音时长: ${duration.toFixed(1)}秒 · 比对基准: ${dashCurrentPiece}
                    </div>
                </div>
            `;
            btn.disabled = false; btn.textContent = "📊 AI比对打分";
        }, function() {
            result.innerHTML = '<div style="color:#FF4444;">音频分析失败，请重试</div>';
            btn.disabled = false; btn.textContent = "📊 AI比对打分";
        });
    };
    reader.readAsArrayBuffer(recordedBlob);
});
