/* ===== 琴乐启蒙AI导师 前端交互 ===== */

let currentRole = "teacher";
let currentAssistant = null;
let isTyping = false;

// ===== DOM 引用 =====
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

// ===== 助手选择 =====
document.querySelectorAll(".assistant-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".assistant-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        currentAssistant = item.dataset.assistant;
    });
});

// ===== 快捷问题加载 =====
async function loadQuickQuestions() {
    try {
        const res = await fetch(`/api/quick-questions?role=${currentRole}`);
        const data = await res.json();
        quickQuestions.innerHTML = "";
        data.questions.forEach(q => {
            const btn = document.createElement("button");
            btn.className = "qq-btn";
            btn.textContent = q;
            btn.addEventListener("click", () => {
                chatInput.value = q;
                sendMessage();
            });
            quickQuestions.appendChild(btn);
        });
    } catch (e) { console.error(e); }
}

// ===== 发送消息 =====
function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg || isTyping) return;

    // 清空欢迎语
    const welcome = chatMessages.querySelector(".welcome-msg");
    if (welcome) welcome.remove();

    // 添加用户消息
    appendMessage(msg, "user");
    chatInput.value = "";
    chatInput.style.height = "auto";

    // 显示AI打字中
    showTyping();
    isTyping = true;
    sendBtn.disabled = true;

    // 请求API
    fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, role: currentRole })
    })
    .then(res => res.json())
    .then(data => {
        hideTyping();
        // 打字机效果输出
        typewriterAppend(data.reply, data.assistant);
        isTyping = false;
        sendBtn.disabled = false;
    })
    .catch(err => {
        hideTyping();
        appendMessage("抱歉，出了点小问题，请重试 😅", "ai");
        isTyping = false;
        sendBtn.disabled = false;
    });
}

sendBtn.addEventListener("click", sendMessage);

// 回车发送（Shift+回车换行）
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
// 自动增高
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
});

// ===== 添加消息气泡 =====
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
    return msg;
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

    // 逐字输出
    const formatted = formatText(text);
    let i = 0;
    const speed = 15; // 每字符毫秒
    function type() {
        if (i < formatted.length) {
            bubble.innerHTML = formatted.substring(0, i + 1);
            i += 2; // 每次2字符，加速
            chatMessages.scrollTop = chatMessages.scrollHeight;
            setTimeout(type, speed);
        } else {
            bubble.innerHTML = formatted;
        }
    }
    type();
}

// ===== 文本格式化（Markdown简易版） =====
function formatText(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // **加粗**
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // 换行
        .replace(/\n/g, "<br>");
}

// ===== 打字指示器 =====
function showTyping() {
    const msg = document.createElement("div");
    msg.className = "msg msg-ai";
    msg.id = "typingMsg";
    const avatar = document.createElement("div");
    avatar.className = "ai-avatar";
    avatar.textContent = "🎹";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const t = document.getElementById("typingMsg");
    if (t) t.remove();
}

// ===== 工作流演示 =====
document.getElementById("wfRunBtn").addEventListener("click", async () => {
    const btn = document.getElementById("wfRunBtn");
    const flow = document.getElementById("wfFlow");
    btn.disabled = true;
    btn.textContent = "生成中...";
    flow.innerHTML = "";

    const params = {
        grade: document.getElementById("wfGrade").value,
        content: document.getElementById("wfContent").value,
        duration: document.getElementById("wfDuration").value
    };

    try {
        const res = await fetch("/api/workflow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        const data = await res.json();
        const steps = data.steps;
        const colors = ["#FF6B9D", "#FFB84D", "#5FC9A8", "#4FC3F7"];

        // 逐步显示
        for (let i = 0; i < steps.length; i++) {
            await sleep(800);
            const step = steps[i];
            if (step.final) {
                // 最终教案
                const final = document.createElement("div");
                final.className = "wf-final";
                final.innerHTML = `<div class="wf-final-title">${step.title}</div><div class="wf-final-content">${formatText(step.content)}</div>`;
                flow.appendChild(final);
            } else {
                const stepEl = document.createElement("div");
                stepEl.className = "wf-step";
                stepEl.innerHTML = `
                    <div class="wf-step-num" style="background:${colors[i]}">${i+1}</div>
                    <div class="wf-step-content">
                        <div class="wf-step-title">${step.title}</div>
                        <div class="wf-step-text">${formatText(step.content)}</div>
                    </div>`;
                flow.appendChild(stepEl);
                // 箭头
                if (i < steps.length - 1) {
                    const arrow = document.createElement("div");
                    arrow.className = "wf-arrow";
                    arrow.textContent = "▼";
                    flow.appendChild(arrow);
                }
            }
            flow.scrollTop = flow.scrollHeight;
        }
        btn.disabled = false;
        btn.textContent = "▶ 重新生成";
    } catch (e) {
        flow.innerHTML = '<div class="wf-placeholder">生成失败，请重试</div>';
        btn.disabled = false;
        btn.textContent = "▶ 开始生成";
    }
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== 初始化 =====
loadQuickQuestions();
