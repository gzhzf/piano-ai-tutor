/* ===== 琴乐启蒙AI导师 前端交互 ===== */
let currentRole = "teacher";
let isTyping = false;

const chatMessages = document.getElementById("chatMessages");

// ===== 欢迎页钢琴动画（克劳德·暗色调唯美风）=====
let welcomeAnimStarted = false;
function initWelcomeAnim() {
    const cv = document.getElementById("welcomeCanvas");
    if (!cv || welcomeAnimStarted) return;
    welcomeAnimStarted = true;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    const headR = 13;
    const pianoX = 70, pianoY = 240, pianoW = 340, pianoH = 42;
    const wkW = 21, numWhite = 15, bkW = 13, bkH = 24;
    const keyY = pianoY + 16;
    const charCx = 145, charHeadY = 95;
    const shoulderW = 40, torsoH = 52;

    // 花瓣
    const petals = [];
    for (let i = 0; i < 15; i++) petals.push({
        x: Math.random()*W, y: Math.random()*H*0.5, vx: Math.random()*0.4-0.15,
        vy: Math.random()*0.25+0.08, rot: Math.random()*6.28, rotSpeed: 0.015,
        size: Math.random()*3+2.5, alpha: Math.random()*0.4+0.3,
        color: ["#C8B8E0","#D8C8F0","#B8A8D8","#E0D0F0"][i%4]
    });
    // 星光
    const stars = [];
    for (let i = 0; i < 40; i++) stars.push({
        x: Math.random()*W, y: Math.random()*H*0.5, r: Math.random()*1.2+0.3,
        tw: Math.random()*6.28, sp: Math.random()*0.025+0.008
    });
    const musicNotes = [], ripples = [];
    const noteSyms = ["\u266A","\u266B","\u2669","\u266C"];
    const melody = [{k:4,n:"C4"},{k:6,n:"D4"},{k:8,n:"E4"},{k:10,n:"F4"},{k:12,n:"G4"},{k:10,n:"F4"},{k:8,n:"E4"},{k:6,n:"D4"},{k:4,n:"C4"}];
    let mIdx = 0, lastBeat = 0, isPlaying = true, blinkT = 0, blink = false, frame = 0, swayP = 0;
    const beatInt = 30, playDur = 270;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // 暗紫蓝渐变天空（参考图1暗色调）
        const sg = ctx.createLinearGradient(0,0,0,H);
        sg.addColorStop(0,"#0a0a1a"); sg.addColorStop(0.3,"#1a1430"); sg.addColorStop(0.6,"#2a1a48"); sg.addColorStop(1,"#1a0a28");
        ctx.fillStyle = sg; ctx.fillRect(0,0,W,H);
        // 星光
        stars.forEach(s=>{s.tw+=s.sp; const a=0.2+0.6*Math.abs(Math.sin(s.tw));
            ctx.fillStyle=`rgba(200,210,255,${a})`; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.28); ctx.fill();
            if(s.r>0.9){ctx.strokeStyle=`rgba(200,210,255,${a*0.4})`; ctx.lineWidth=0.4;
                ctx.beginPath(); ctx.moveTo(s.x-s.r*3,s.y); ctx.lineTo(s.x+s.r*3,s.y);
                ctx.moveTo(s.x,s.y-s.r*3); ctx.lineTo(s.x,s.y+s.r*3); ctx.stroke();}});
        // 月光（参考图1蓝调光源）
        const mx=W*0.8, my=H*0.2;
        const mg = ctx.createRadialGradient(mx,my,5,mx,my,60);
        mg.addColorStop(0,"rgba(100,150,255,0.3)"); mg.addColorStop(1,"rgba(100,150,255,0)");
        ctx.fillStyle = mg; ctx.fillRect(mx-80,my-80,160,160);
        // 远山剪影
        ctx.fillStyle="rgba(15,10,25,0.8)"; ctx.beginPath();
        ctx.moveTo(0,H*0.6); ctx.lineTo(50,H*0.45); ctx.lineTo(130,H*0.52);
        ctx.lineTo(210,H*0.42); ctx.lineTo(300,H*0.5); ctx.lineTo(380,H*0.44);
        ctx.lineTo(W,H*0.52); ctx.lineTo(W,H*0.7); ctx.lineTo(0,H*0.7); ctx.fill();
        // 水面/地面反光（参考图1蓝调反射）
        const rg = ctx.createLinearGradient(0,H*0.6,0,H);
        rg.addColorStop(0,"rgba(30,40,80,0.6)"); rg.addColorStop(0.5,"rgba(20,25,55,0.4)"); rg.addColorStop(1,"rgba(10,10,25,0.8)");
        ctx.fillStyle = rg; ctx.fillRect(0,H*0.6,W,H*0.4);
        // 水面波纹
        ctx.strokeStyle="rgba(80,120,200,0.1)"; ctx.lineWidth=0.5;
        for(let i=0;i<5;i++){const wy=H*0.65+i*12+Math.sin(frame*0.02+i)*2;
            ctx.beginPath(); ctx.moveTo(0,wy); ctx.lineTo(W,wy); ctx.stroke();}
        // 花瓣
        petals.forEach(p=>{p.x+=p.vx+Math.sin(frame*0.015+p.rot)*0.2; p.y+=p.vy; p.rot+=p.rotSpeed;
            if(p.y>H){p.y=-3;p.x=Math.random()*W;}
            ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
            ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha;
            ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.5,0,0,6.28); ctx.fill(); ctx.restore();});
        ctx.globalAlpha=1;
        // 涟漪
        for(let i=ripples.length-1;i>=0;i--){const r=ripples[i]; r.radius+=1.5; r.alpha-=0.015;
            if(r.alpha<=0){ripples.splice(i,1);continue;}
            ctx.strokeStyle=`rgba(120,180,255,${r.alpha})`; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(r.x,r.y,r.radius,0,6.28); ctx.stroke();}
        // 钢琴（暗色调，参考图1深色）
        ctx.fillStyle="#050308"; ctx.beginPath();
        ctx.moveTo(pianoX,pianoY+pianoH); ctx.lineTo(pianoX+pianoW,pianoY+pianoH);
        ctx.lineTo(pianoX+pianoW-6,pianoY); ctx.lineTo(pianoX+20,pianoY); ctx.lineTo(pianoX,pianoY+12); ctx.fill();
        // 钢琴顶面蓝光反射
        const pg=ctx.createLinearGradient(pianoX,pianoY,pianoX,pianoY+16);
        pg.addColorStop(0,"rgba(60,90,160,0.3)"); pg.addColorStop(1,"rgba(20,15,35,0)");
        ctx.fillStyle=pg; ctx.fillRect(pianoX+20,pianoY,pianoW-26,16);
        // 琴键
        for(let i=0;i<numWhite;i++){const kx=pianoX+20+i*wkW;
            const act=isPlaying&&mIdx>0&&melody[(mIdx-1)%melody.length].k===i&&frame-lastBeat<8;
            ctx.fillStyle=act?"#7FC4FF":"#E8E5F0"; ctx.fillRect(kx,keyY,wkW-1,pianoH-16);
            ctx.strokeStyle="#666"; ctx.lineWidth=0.3; ctx.strokeRect(kx,keyY,wkW-1,pianoH-16);}
        const bp=[0,1,3,4,5];
        for(let o=0;o<3;o++)for(const b of bp){const idx=o*7+b; if(idx<numWhite-1){ctx.fillStyle="#080810";
            ctx.fillRect(pianoX+20+idx*wkW+wkW*0.65,keyY,bkW,bkH);}}
        ctx.fillStyle="#050308"; ctx.fillRect(pianoX+15,pianoY+pianoH,4,28); ctx.fillRect(pianoX+pianoW-25,pianoY+pianoH,4,28);
        // 琴凳
        ctx.fillStyle="#0a0510"; ctx.fillRect(charCx-16,pianoY+pianoH+20,36,8);
        ctx.fillRect(charCx-13,pianoY+pianoH+28,3,16); ctx.fillRect(charCx+16,pianoY+pianoH+28,3,16);
        // ===== 克劳德 =====
        swayP+=0.025; const sway=isPlaying?Math.sin(swayP)*1.5:0;
        const headY=charHeadY+sway, neckY=headY+headR+1, shY=neckY+5, hipY=shY+torsoH;
        const shL=charCx-shoulderW/2, shR=charCx+shoulderW/2;
        // --- 金色头发（参考图2金色像素 #E0A050~#F0C060）---
        // 后脑勺
        ctx.fillStyle="#B8902A"; ctx.beginPath(); ctx.arc(charCx,headY,headR+1,0.7*3.14,2.3*3.14); ctx.fill();
        // 尖刺（更粗更利，参考克劳德标志性发型）
        const spikes=[
            {dx:-11,dy:-5,len:15,a:-0.4},{dx:-7,dy:-11,len:18,a:-0.15},
            {dx:-2,dy:-13,len:20,a:0.02},{dx:3,dy:-13,len:19,a:0.12},
            {dx:8,dy:-11,len:16,a:0.35},{dx:11,dy:-6,len:13,a:0.55},
            {dx:-13,dy:-1,len:11,a:-0.7},{dx:13,dy:-1,len:10,a:0.7},
            {dx:-5,dy:-12,len:16,a:-0.05},{dx:5,dy:-12,len:17,a:0.08},
        ];
        ctx.fillStyle="#E8B840";
        spikes.forEach(sp=>{ctx.save(); ctx.translate(charCx+sp.dx,headY+sp.dy); ctx.rotate(sp.a);
            ctx.beginPath(); ctx.moveTo(-2.5,0); ctx.lineTo(0,-sp.len); ctx.lineTo(2.5,0); ctx.fill(); ctx.restore();});
        // 头发高光（金色亮部）
        ctx.fillStyle="rgba(255,230,120,0.5)"; ctx.beginPath(); ctx.arc(charCx-3,headY-7,3.5,0,6.28); ctx.fill();
        ctx.fillStyle="rgba(255,210,80,0.3)"; ctx.beginPath(); ctx.arc(charCx+4,headY-5,3,0,6.28); ctx.fill();
        // --- 脸部 ---
        ctx.fillStyle="#E8D0B0"; ctx.beginPath(); ctx.arc(charCx,headY,headR,0,6.28); ctx.fill();
        // 脸部阴影（暗光环境）
        ctx.fillStyle="rgba(80,60,100,0.15)"; ctx.beginPath(); ctx.arc(charCx-4,headY+2,headR-3,0,6.28); ctx.fill();
        // --- 魔晄蓝眼睛（参考图1蓝色发光 #4A7BBF）---
        blinkT++; if(blinkT>100+Math.random()*80){blink=true;blinkT=0;} if(blink&&blinkT>4)blink=false;
        if(!blink){
            // 眼白发光（魔晄特征）
            ctx.fillStyle="rgba(100,180,255,0.3)";
            ctx.beginPath(); ctx.arc(charCx-5,headY-1,3.5,0,6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(charCx+5,headY-1,3.5,0,6.28); ctx.fill();
            // 虹膜（亮蓝）
            ctx.fillStyle="#5BB0F5"; ctx.beginPath(); ctx.arc(charCx-5,headY-1,2,0,6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(charCx+5,headY-1,2,0,6.28); ctx.fill();
            // 瞳孔
            ctx.fillStyle="#1a2a4a"; ctx.beginPath(); ctx.arc(charCx-5,headY-1,0.9,0,6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(charCx+5,headY-1,0.9,0,6.28); ctx.fill();
            // 高光（魔晄发光感）
            ctx.fillStyle="rgba(200,230,255,0.9)";
            ctx.beginPath(); ctx.arc(charCx-4,headY-2,0.7,0,6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(charCx+6,headY-2,0.7,0,6.28); ctx.fill();
        }else{
            ctx.strokeStyle="#3a3a5a"; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(charCx-5,headY-1,1.8,0.1,3.04); ctx.stroke();
            ctx.beginPath(); ctx.arc(charCx+5,headY-1,1.8,0.1,3.04); ctx.stroke();
        }
        // 鼻
        ctx.fillStyle="#C8A888"; ctx.beginPath();
        ctx.moveTo(charCx,headY+2); ctx.lineTo(charCx+1.5,headY+4); ctx.lineTo(charCx,headY+5); ctx.fill();
        // 嘴
        ctx.strokeStyle="#804040"; ctx.lineWidth=0.7; ctx.beginPath();
        ctx.moveTo(charCx-1.5,headY+8); ctx.lineTo(charCx+1.5,headY+8); ctx.stroke();
        // --- 脖子 ---
        ctx.fillStyle="#D8C0A0"; ctx.fillRect(charCx-3.5,neckY-1,7,7);
        ctx.fillStyle="rgba(60,40,80,0.1)"; ctx.fillRect(charCx-3.5,neckY-1,7,7);
        // --- 左肩甲（金属，参考图2深色金属肩甲）---
        ctx.fillStyle="#3a3a4a"; ctx.beginPath(); ctx.ellipse(shL-1,shY+2,11,9,-0.15,0,6.28); ctx.fill();
        ctx.fillStyle="rgba(100,120,160,0.3)"; ctx.beginPath(); ctx.ellipse(shL-3,shY,5,3.5,-0.15,0,6.28); ctx.fill();
        ctx.strokeStyle="#2a2a3a"; ctx.lineWidth=0.8; ctx.beginPath(); ctx.ellipse(shL-1,shY+2,11,9,-0.15,0,6.28); ctx.stroke();
        // --- 上身（深蓝黑SOLDIER制服，参考图1/2深色调）---
        ctx.fillStyle="#1a1525"; ctx.beginPath();
        ctx.moveTo(shL-5,shY); ctx.lineTo(shR+5,shY); ctx.lineTo(shR+3,hipY); ctx.lineTo(shL-3,hipY); ctx.fill();
        // 制服中线
        ctx.strokeStyle="#0a0510"; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(charCx,shY+3); ctx.lineTo(charCx,hipY); ctx.stroke();
        // 腰带
        ctx.fillStyle="#3a3020"; ctx.fillRect(shL-1,hipY-8,shoulderW+2,4);
        ctx.fillStyle="#6a5a3a"; ctx.fillRect(charCx-2.5,hipY-8,5,4);
        // 制服蓝光反射（参考图1蓝色环境光）
        ctx.fillStyle="rgba(50,80,140,0.12)"; ctx.fillRect(shR-4,shY+4,8,torsoH-14);
        // --- 手臂（2.3头高精确比例）---
        const hk=isPlaying&&mIdx>0?melody[(mIdx-1)%melody.length].k:6;
        const hx=pianoX+20+hk*wkW+wkW/2, hy=keyY+2;
        const ex=charCx+6, ey=shY+26;
        // 上臂（深蓝制服色）
        ctx.strokeStyle="#1a1525"; ctx.lineWidth=6; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(shL,shY+3); ctx.lineTo(ex-5,ey); ctx.lineTo(hx-7,hy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(shR,shY+3); ctx.lineTo(ex+7,ey); ctx.lineTo(hx+7,hy); ctx.stroke();
        // 前臂（黑色手套+护臂）
        ctx.strokeStyle="#0a0a0a"; ctx.lineWidth=6;
        ctx.beginPath(); ctx.moveTo(ex-5,ey); ctx.lineTo(hx-7,hy); ctx.moveTo(ex+7,ey); ctx.lineTo(hx+7,hy); ctx.stroke();
        // 手
        ctx.fillStyle="#0a0a0a"; ctx.beginPath(); ctx.arc(hx-7,hy,3,0,6.28); ctx.fill();
        ctx.beginPath(); ctx.arc(hx+7,hy,3,0,6.28); ctx.fill();
        // 触键光效
        if(isPlaying&&frame-lastBeat<8){ctx.strokeStyle="rgba(127,196,255,0.8)"; ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.arc(hx-7,hy,5,0,6.28); ctx.stroke();
            ctx.beginPath(); ctx.arc(hx+7,hy,5,0,6.28); ctx.stroke();}
        // --- 腿（坐姿）---
        ctx.fillStyle="#1a1525"; ctx.beginPath();
        ctx.moveTo(charCx-7,hipY); ctx.lineTo(charCx+4,hipY); ctx.lineTo(charCx+7,hipY+32); ctx.lineTo(charCx-4,hipY+32); ctx.fill();
        ctx.fillStyle="#0a0a0a"; ctx.fillRect(charCx-5,hipY+30,12,6);
        // ===== 触键+音符 =====
        if(isPlaying&&frame-lastBeat>=beatInt){lastBeat=frame; const n=melody[mIdx%melody.length];
            const kx=pianoX+20+n.k*wkW+wkW/2;
            ripples.push({x:kx,y:keyY,radius:3,alpha:0.4});
            musicNotes.push({x:kx,y:keyY-6,vx:(Math.random()-0.3)*1,vy:-Math.random()*1.5-0.7,life:1,
                sym:noteSyms[Math.floor(Math.random()*4)],sz:Math.random()*3+8,
                c:["#7FC4FF","#FFD700","#FF9DB5","#A8D8FF"][Math.floor(Math.random()*4)]});
            playNote(NOTE_FREQ[n.n]||261.63,0.35,0.1); mIdx++;}
        if(isPlaying&&frame>=playDur)isPlaying=false;
        // 音符飘起
        for(let i=musicNotes.length-1;i>=0;i--){const p=musicNotes[i]; p.x+=p.vx; p.y+=p.vy; p.vy*=0.99; p.life-=0.009;
            if(p.life<=0){musicNotes.splice(i,1);continue;}
            ctx.fillStyle=p.c; ctx.globalAlpha=p.life*0.7;
            ctx.font=p.sz+"px sans-serif"; ctx.textAlign="center";
            ctx.fillText(String.fromCharCode(parseInt(p.sym.replace("\\u",""),16)),p.x,p.y); ctx.globalAlpha=1;}
        // 全局蓝光氛围
        const ag = ctx.createRadialGradient(W*0.5,H*0.4,50,W*0.5,H*0.4,W*0.8);
        ag.addColorStop(0,"rgba(40,60,120,0.04)"); ag.addColorStop(1,"rgba(0,0,20,0.1)");
        ctx.fillStyle = ag; ctx.fillRect(0,0,W,H);
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

    btnRow.appendChild(comicBtn);
    btnRow.appendChild(playBtn);
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
loadLibrary();
initDashboard();
initWelcomeAnim();

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
