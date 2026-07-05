// ==========================================================
// chatbot.js - SmartCollege Floating AI Helper Chatbot
// ==========================================================
const API_BASE = (() => {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;

    if (proto === 'file:') {
        return 'https://smartcollege-complaint.onrender.com';
    }
    if ((host === 'localhost' || host === '127.0.0.1') && port !== '3000') {
        return 'http://localhost:3000';
    }
    return '';
})();
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject components dynamically
    const botHtml = `
        <!-- Launcher -->
        <div class="chatbot-launcher" id="chatbotLauncherBtn">
            <i class="fa-solid fa-robot"></i>
        </div>

        <!-- Drawer -->
        <div class="chatbot-drawer" id="chatbotDrawer">
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <i class="fa-solid fa-robot" style="font-size: 18px;"></i>
                    <div>
                        <h4>College AI Assistant</h4>
                        <span>Online</span>
                    </div>
                </div>
                <button class="chatbot-close-btn" id="chatbotCloseBtn">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="chatbot-body" id="chatbotMessages">
                <div class="chat-msg bot">
                    Hello! I'm the campus assistant. How can I help you today? You can ask me about hostel rules, library hours, or fee deadlines.
                </div>
            </div>

            <div class="chatbot-footer">
                <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Ask a question...">
                <button class="chatbot-send-btn" id="chatbotSendBtn">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = botHtml;
    document.body.appendChild(wrapper);

    // Get elements
    const launcherBtn = document.getElementById("chatbotLauncherBtn");
    const drawer = document.getElementById("chatbotDrawer");
    const closeBtn = document.getElementById("chatbotCloseBtn");
    const sendBtn = document.getElementById("chatbotSendBtn");
    const inputEl = document.getElementById("chatbotInput");
    const msgsContainer = document.getElementById("chatbotMessages");

    if (!launcherBtn || !drawer || !closeBtn || !sendBtn || !inputEl || !msgsContainer) return;

    // Toggle drawer open/close
    launcherBtn.addEventListener("click", () => {
        drawer.classList.add("open");
        launcherBtn.style.display = "none";
    });

    closeBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
        launcherBtn.style.display = "flex";
    });

    // Send Message
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        // User message UI
        appendMessage(text, "user");
        inputEl.value = "";

        // Typist indicator
        const typingId = appendMessage(`<i class="fa-solid fa-ellipsis fa-bounce"></i> Thinking...`, "bot");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(API_BASE + "/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ message: text })
            });

            // Remove typing indicator
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) typingIndicator.remove();

            if (res.ok) {
                const data = await res.json();
                appendTypewriter(data.reply, "bot");
            } else {
                appendMessage("Failed to reach assistant. Please check server.", "bot");
            }
        } catch (e) {
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) typingIndicator.remove();
            appendMessage("Connection error. Is backend server online? ❌", "bot");
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    function appendMessage(content, sender) {
        const id = "msg-" + Date.now() + Math.random().toString(36).substr(2, 4);
        const div = document.createElement("div");
        div.className = `chat-msg ${sender}`;
        div.id = id;
        div.innerHTML = content;
        msgsContainer.appendChild(div);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
        return id;
    }

    function appendTypewriter(text, sender) {
        const id = "msg-" + Date.now() + Math.random().toString(36).substr(2, 4);
        const div = document.createElement("div");
        div.className = `chat-msg ${sender}`;
        div.id = id;
        msgsContainer.appendChild(div);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;

        let i = 0;
        function type() {
            if (i < text.length) {
                div.innerHTML += text.charAt(i);
                i++;
                msgsContainer.scrollTop = msgsContainer.scrollHeight;
                setTimeout(type, 15);
            }
        }
        type();
    }
});
