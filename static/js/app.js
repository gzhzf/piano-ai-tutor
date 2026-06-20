/* ===== 琴乐启蒙AI导师 前端交互 ===== */
let currentRole = "teacher";
let currentAssistant = null;
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
        // 关闭移动端侧边栏
        closeSidebar();
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

// ===== 助手选择 =====
document.querySelectorAll(".assistant-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".assistant-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        currentAssistant = item.dataset.assistant;
        // 手机端选择后关闭侧边栏
        if (window.innerWidth <= 768) closeSidebar();
    });
});

// ===== 移动端侧边栏抽屉 =====
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

function openSidebar() { sidebar.classList.add("open"); sidebarOverlay.classList.add("show"); }
function closeSidebar() { sidebar.classList.remove("open"); sidebarOverlay.classList.remove("show"); }

menuToggle.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
});
sidebarOverlay.addEventListener("click", closeSidebar);

// ===== 快捷问题加载（分类） =====
async function loadQuickQuestions() {
    try {
        const res = await fetch(`/api/quick-questions?role=${currentRole}`);
        const data = await res.json();
        quickQuestions.innerHTML = "";

        if (Array.isArray(data.questions)) {
            // 旧格式兼容
            const cat = document.createElement("div");
            cat.className = "qq-category";
            const btns = document.createElement("div");
            btns.className = "qq-btns";
            data.questions.forEach(q => btns.appendChild(makeQQBtn(q)));
            cat.appendChild(btns);
            quickQuestions.appendChild(cat);
        } else {
            // 新分类格式
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
        }
    } catch (e) { console.error(e); }
}

function makeQQBtn(question) {
    const btn = document.createElement("button");
    btn.className = "qq-btn";
    btn.textContent = question;
    btn.addEventListener("click", () => {
        chatInput.value = question;
        sendMessage();
    });
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
    isTyping = true;
    sendBtn.disabled = true;
    fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, role: currentRole })
    })
    .then(res => res.json())
    .then(data => {
        hideTyping();
        typewriterAppend(data.reply, data.assistant);
        isTyping = false;
        sendBtn.disabled = false;
    })
    .catch(err => {
        hideTyping();
        appendMessage("抱歉，出了点小问题，请重试", "ai");
        isTyping = false;
        sendBtn.disabled = false;
    });
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
});

// ===== 消息气泡 =====
function appendMessage(text, sender, assistant) {
    const msg = document.createElement("div");
    msg.className = "msg msg-" + sender;
    if (sender === "ai") {
        const avatar = document.createElement("div");
        avatar.className = "ai-avatar";
        avatar.textContent = assistant ? assistant.icon : "🎹";
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.innerHTML = formatText(text);
        msg.appendChild(avatar);
        msg.appendChild(bubble);
    } else {
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = text;
        msg.appendChild(bubble);
    }
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== 打字机效果 =====
function typewriterAppend(text, assistant) {
    const msg = document.createElement("div");
    msg.className = "msg msg-ai";
    const avatar = document.createElement("div");
    avatar.className = "ai-avatar";
    avatar.textContent = assistant ? assistant.icon : "🎹";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    const formatted = formatText(text);
    let i = 0;
    function type() {
        if (i < formatted.length) {
            bubble.innerHTML = formatted.substring(0, i + 1);
            i += 2;
            chatMessages.scrollTop = chatMessages.scrollHeight;
            setTimeout(type, 12);
        } else { bubble.innerHTML = formatted; }
    }
    type();
}

// ===== 文本格式化 =====
function formatText(text) {
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

// ===== 打字指示器 =====
function showTyping() {
    const msg = document.createElement("div");
    msg.className = "msg msg-ai"; msg.id = "typingMsg";
    const avatar = document.createElement("div");
    avatar.className = "ai-avatar"; avatar.textContent = "🎹";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    msg.appendChild(avatar); msg.appendChild(bubble);
    chatMessages.appendChild(msg);
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
            const og = document.createElement("optgroup");
            og.label = group.label;
            group.pieces.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.name;
                opt.textContent = p.name;
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
    btn.disabled = true; btn.textContent = "生成中...";
    flow.innerHTML = "";
    const params = {
        grade: document.getElementById("wfGrade").value,
        content: document.getElementById("wfContent").value,
        duration: document.getElementById("wfDuration").value
    };
    try {
        const res = await fetch("/api/workflow", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        const data = await res.json();
        const steps = data.steps;
        const colors = ["#FF6B9D","#FFB84D","#5FC9A8","#4FC3F7"];
        for (let i = 0; i < steps.length; i++) {
            await sleep(700);
            const step = steps[i];
            if (step.final) {
                const final = document.createElement("div");
                final.className = "wf-final";
                final.innerHTML = `<div class="wf-final-title">${step.title}</div><div class="wf-final-content">${formatText(step.content)}</div>`;
                flow.appendChild(final);
            } else {
                const stepEl = document.createElement("div");
                stepEl.className = "wf-step";
                stepEl.innerHTML = `<div class="wf-step-num" style="background:${colors[i]}">${i+1}</div><div class="wf-step-content"><div class="wf-step-title">${step.title}</div><div class="wf-step-text">${formatText(step.content)}</div></div>`;
                flow.appendChild(stepEl);
                if (i < steps.length - 1) {
                    const arrow = document.createElement("div");
                    arrow.className = "wf-arrow"; arrow.textContent = "▼";
                    flow.appendChild(arrow);
                }
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
            const gEl = document.createElement("div");
            gEl.className = "lib-group";
            const title = document.createElement("div");
            title.className = "lib-group-title";
            title.textContent = `${group.label}（${group.pieces.length}首）`;
            gEl.appendChild(title);
            const piecesEl = document.createElement("div");
            piecesEl.className = "lib-pieces";
            group.pieces.forEach(p => {
                const card = document.createElement("div");
                card.className = "lib-card";
                card.innerHTML = `
                    <div class="lib-card-name">${p.name}</div>
                    <div class="lib-card-meta">
                        ${p.key ? `<span>${p.key}</span>` : ""}
                        ${p.time_sig ? `<span>${p.time_sig}</span>` : ""}
                        ${p.difficulty ? `<span>${p.difficulty}</span>` : ""}
                    </div>
                    ${p.tomplay ? `<div class="lib-card-tomplay">Tomplay: ${p.tomplay}</div>` : ""}
                `;
                card.addEventListener("click", () => {
                    // 切换到对话视图并发送教案请求
                    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                    document.querySelector('[data-view="chat"]').classList.add("active");
                    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
                    document.getElementById("view-chat").classList.add("active");
                    chatInput.value = `帮我设计一节${p.name}教学课`;
                    sendMessage();
                });
                piecesEl.appendChild(card);
            });
            gEl.appendChild(piecesEl);
            grid.appendChild(gEl);
        });
    } catch(e) {
        grid.innerHTML = '<div class="lib-loading">加载失败，请刷新</div>';
    }
}

// 教案库搜索
document.getElementById("libSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".lib-card").forEach(card => {
        const name = card.querySelector(".lib-card-name").textContent.toLowerCase();
        card.style.display = name.includes(q) ? "" : "none";
    });
});

// ===== 初始化 =====
loadQuickQuestions();
loadWorkflowPieces();
loadLibrary();
