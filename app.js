import { GoogleGenAI } from "https://esm.run/@google/genai";

// ==========================================
// STATE MANAGEMENT & CONFIGURATION
// ==========================================
let geminiApiKey = localStorage.getItem("GEMINI_API_KEY") || "";

// ==========================================
// DOM ELEMENT SELECTIONS
// ==========================================
const chatMessagesEl = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const userInputEl = document.getElementById("userInput");
const examplesSectionEl = document.getElementById("examplesSection");

// Settings Modal Elements
const settingsModal = document.getElementById("settingsModal");
const openSettingsBtn = document.getElementById("openSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
const clearApiKeyBtn = document.getElementById("clearApiKeyBtn");
const keyStatusEl = document.getElementById("keyStatus");

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    updateKeyStatusUI();
    setupEventListeners();
    
    // Auto-open settings if API key is missing
    if (!geminiApiKey) {
        setTimeout(() => {
            openSettings();
            addSystemNotification("🔑 Welcome! Please enter your Google Gemini API Key in the settings panel to enable the FAQ Chatbot.");
        }, 800);
    }
});

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Modal toggle
    openSettingsBtn.addEventListener("click", openSettings);
    closeSettingsBtn.addEventListener("click", closeSettings);
    settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) closeSettings();
    });

    // API Key Save / Clear
    saveApiKeyBtn.addEventListener("click", () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            geminiApiKey = key;
            localStorage.setItem("GEMINI_API_KEY", key);
            updateKeyStatusUI();
            addSystemNotification("✅ API Key saved. The chatbot is ready to search!");
            closeSettings();
        } else {
            alert("Please enter a valid API key.");
        }
    });

    clearApiKeyBtn.addEventListener("click", () => {
        geminiApiKey = "";
        localStorage.removeItem("GEMINI_API_KEY");
        updateKeyStatusUI();
        addSystemNotification("🗑️ API Key cleared. Real-time search is disabled.");
        closeSettings();
    });

    // Form Submit
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = userInputEl.value.trim();
        if (!text) return;
        handleUserQuery(text);
        userInputEl.value = "";
    });

    // Example Questions Click
    examplesSectionEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".example-btn");
        if (!btn) return;
        const queryText = btn.dataset.query;
        handleUserQuery(queryText);
    });
}

// ==========================================
// UI STATUS UPDATE
// ==========================================
function openSettings() {
    settingsModal.classList.add("open");
}

function closeSettings() {
    settingsModal.classList.remove("open");
}

function updateKeyStatusUI() {
    if (geminiApiKey) {
        keyStatusEl.className = "key-status active";
        keyStatusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> API Key Saved`;
        apiKeyInput.value = geminiApiKey;
    } else {
        keyStatusEl.className = "key-status missing";
        keyStatusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> API Key Missing`;
        apiKeyInput.value = "";
    }
}

// ==========================================
// CHAT RENDERING FUNCTIONS
// ==========================================
function addSystemNotification(text) {
    const msgEl = document.createElement("div");
    msgEl.className = "message system-message";
    msgEl.textContent = text;
    chatMessagesEl.appendChild(msgEl);
    scrollToBottom();
}

function addUserMessage(text) {
    const msgEl = document.createElement("div");
    msgEl.className = "message user";
    msgEl.innerHTML = `<div>${escapeHtml(text)}</div>`;
    chatMessagesEl.appendChild(msgEl);
    scrollToBottom();
}

function addBotMessage(text, citationUrl = null, citationTitle = null, isRefusal = false) {
    const msgEl = document.createElement("div");
    msgEl.className = "message bot";
    
    // Parse Markdown safely
    let parsedText = marked.parse(text);
    
    // Append citation link if present
    let citationHtml = "";
    if (isRefusal) {
        // Refusal requires a relevant educational link
        const eduUrl = "https://amc.ppfas.com/investor-desk/faqs/";
        citationHtml = `
            <div class="citation-container">
                <span class="citation-title" style="color: var(--text-muted);">Educational Reference:</span>
                <a href="${eduUrl}" target="_blank" class="citation-link">
                    <i class="fa-solid fa-graduation-cap"></i> PPFAS Investor FAQs
                </a>
            </div>
        `;
    } else if (citationUrl) {
        // Factual answers show one clear citation link
        citationHtml = `
            <div class="citation-container">
                <span class="citation-title">Official Source:</span>
                <a href="${citationUrl}" target="_blank" class="citation-link">
                    <i class="fa-solid fa-up-right-from-square"></i> ${escapeHtml(citationTitle || "PPFAS Official Link")}
                </a>
            </div>
        `;
    }
    
    msgEl.innerHTML = `
        <div>${parsedText}</div>
        ${citationHtml}
    `;
    
    chatMessagesEl.appendChild(msgEl);
    scrollToBottom();
}

function addTypingIndicator() {
    const msgEl = document.createElement("div");
    msgEl.className = "message bot typing-indicator-msg";
    msgEl.id = "typingIndicator";
    msgEl.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessagesEl.appendChild(msgEl);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
}

function scrollToBottom() {
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// ==========================================
// CORE API INTERACTION
// ==========================================
async function handleUserQuery(text) {
    addUserMessage(text);
    
    if (!geminiApiKey) {
        openSettings();
        addSystemNotification("⚠️ API Key is required to send queries.");
        return;
    }
    
    addTypingIndicator();
    
    // Local pre-intercept for common investment advice/portfolio questions
    const lowercaseQuery = text.toLowerCase();
    const adviceKeywords = ["should i buy", "should i sell", "is it good time to buy", "recommend me", "which is better", "invest in", "is a good investment", "buy or sell", "best fund"];
    const isAdviceRequested = adviceKeywords.some(keyword => lowercaseQuery.includes(keyword));

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        
        // System instructions enforcing strict facts-only scope, citation requirement, and refusal of advice
        const systemInstruction = `
You are a highly precise and objective Mutual Fund FAQ Assistant specializing in Parag Parikh Financial Advisory Services (PPFAS) Mutual Fund schemes.
You answer specific facts about PPFAS schemes (expense ratio, exit load, minimum SIP, lock-in (ELSS), riskometer, benchmark, and statement downloads).

Strict Instructions:
1. Identify if the query is opinionated, subjective, or asking for investment advice, suggestions to buy/sell (e.g. "Should I buy Flexi Cap?", "Is PPFAS Flexi Cap better than others?", "When to sell PPFAS Liquid?").
2. If it is an advice or recommendation query, you MUST politely refuse to answer. State that you only provide objective facts and do not offer investment advice or recommendations. Include the text: "For more details on PPFAS mutual fund operations and general guidelines, please review the official educational resources." 
3. If it is a factual query, answer using official public pages via the search tool. Your response must be completely objective, concise, and state facts only (no opinions).
4. Every factual answer must contain a clear reference to the official source.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.1
            }
        });
        
        removeTypingIndicator();
        
        const responseText = response.text || "No response generated.";
        const metadata = response.candidates?.[0]?.groundingMetadata || {};
        
        // Check if the model or our local checks classify this as a advice/refusal query
        const modelRefusalDetected = responseText.toLowerCase().includes("refuse") || 
                                     responseText.toLowerCase().includes("do not provide") || 
                                     responseText.toLowerCase().includes("do not offer") || 
                                     responseText.toLowerCase().includes("financial advice") ||
                                     responseText.toLowerCase().includes("investment advice");
                                     
        const isRefusal = isAdviceRequested || modelRefusalDetected;
        
        if (isRefusal) {
            // Standardized polite refusal response
            const refusalMessage = `I only answer objective, factual questions about mutual fund schemes (such as expense ratios, minimum SIPs, or exit loads). As an assistant, I do not provide investment advice, buy/sell recommendations, or opinions on fund suitability.`;
            addBotMessage(refusalMessage, null, null, true);
        } else {
            // Factual answer: Extract the first citation link
            const chunks = metadata.groundingChunks || [];
            const firstChunk = chunks.find(chunk => chunk.web && chunk.web.uri);
            const citationUrl = firstChunk ? firstChunk.web.uri : null;
            const citationTitle = firstChunk ? (firstChunk.web.title || "PPFAS Official Source") : "PPFAS Official Source";
            
            addBotMessage(responseText, citationUrl, citationTitle, false);
        }
        
    } catch (error) {
        removeTypingIndicator();
        console.error("Gemini API Error:", error);
        
        const errMessage = error.message || "";
        if (errMessage.includes("429") || errMessage.includes("quota") || errMessage.includes("Quota")) {
            addSystemNotification("⚠️ Quota Exceeded (429 Rate Limit). Please wait a moment or update your API key.");
        } else {
            addSystemNotification(`⚠️ Error: ${error.message || "An unknown error occurred."}`);
        }
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
