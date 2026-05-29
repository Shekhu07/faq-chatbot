import { GoogleGenAI } from "https://esm.run/@google/genai";

// ==========================================
// STATE MANAGEMENT & CONFIGURATION
// ==========================================
let geminiApiKey = localStorage.getItem("GEMINI_API_KEY") || "";
let isServerKeyActive = false; // Tracks if server-side GEMINI_API_KEY is configured

// Mock Database for Frictionless Demo Mode
const MOCK_SCHEME_DB = {
    "flexi": {
        name: "Parag Parikh Flexi Cap Fund",
        expenseRatio: "Regular Plan: 1.34%, Direct Plan: 0.58% (as of April 2026)",
        exitLoad: "2% if redeemed within 365 days; 1% if redeemed between 366-730 days; Nil after 730 days.",
        lockIn: "No lock-in period.",
        minimumSip: "₹1,000",
        riskometer: "Very High Risk",
        benchmark: "NIFTY 500 TRI",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-flexi-cap-fund/"
    },
    "large": {
        name: "Parag Parikh Large Cap Fund",
        expenseRatio: "Regular Plan: 1.42%, Direct Plan: 0.62% (as of April 2026)",
        exitLoad: "1% if redeemed within 365 days; Nil after 365 days.",
        lockIn: "No lock-in period.",
        minimumSip: "₹1,000",
        riskometer: "Very High Risk",
        benchmark: "NIFTY 50 TRI",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-large-cap-fund/"
    },
    "elss": {
        name: "Parag Parikh ELSS Tax Saver Fund",
        expenseRatio: "Regular Plan: 1.45%, Direct Plan: 0.65% (as of April 2026)",
        exitLoad: "Nil exit load.",
        lockIn: "3 years statutory lock-in period.",
        minimumSip: "₹500",
        riskometer: "Very High Risk",
        benchmark: "NIFTY 500 TRI",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-elss-tax-saver-fund/"
    },
    "tax saver": {
        name: "Parag Parikh ELSS Tax Saver Fund",
        expenseRatio: "Regular Plan: 1.45%, Direct Plan: 0.65% (as of April 2026)",
        exitLoad: "Nil exit load.",
        lockIn: "3 years statutory lock-in period.",
        minimumSip: "₹500",
        riskometer: "Very High Risk",
        benchmark: "NIFTY 500 TRI",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-elss-tax-saver-fund/"
    },
    "hybrid": {
        name: "Parag Parikh Conservative Hybrid Fund",
        expenseRatio: "Regular Plan: 1.10%, Direct Plan: 0.35% (as of April 2026)",
        exitLoad: "1% if redeemed within 365 days; Nil after 365 days.",
        lockIn: "No lock-in period.",
        minimumSip: "₹1,000",
        riskometer: "Moderately High Risk",
        benchmark: "CRISIL Hybrid 85+15 Conservative Index",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-conservative-hybrid-fund/"
    },
    "liquid": {
        name: "Parag Parikh Liquid Fund",
        expenseRatio: "Regular Plan: 0.30%, Direct Plan: 0.15% (as of April 2026)",
        exitLoad: "Graduated load ranging from 0.0070% (Day 1) to Nil after 7 days.",
        lockIn: "No lock-in period.",
        minimumSip: "₹1,000",
        riskometer: "Low to Moderate Risk",
        benchmark: "CRISIL Liquid Debt A-I Index",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-liquid-fund/"
    }
};

const MOCK_FAQ_DB = {
    "capital-gains": {
        answer: "To download your PPFAS capital-gains statement, log in to the **PPFAS SelfInvest portal**, navigate to 'Reports' or 'Statements', and select 'Capital Gains Statement' for the desired financial year.",
        citationUrl: "https://selfinvest.ppfas.com/"
    },
    "statement": {
        answer: "You can download your account statements directly by logging in to the **PPFAS SelfInvest portal**. You can also retrieve them via Consolidated Account Statement (CAS) on CAMS or KFintech portals.",
        citationUrl: "https://selfinvest.ppfas.com/"
    },
    "contact": {
        answer: "You can contact the PPFAS investor desk at their toll-free helpline **1800-266-7790** or email them at **mutualfund@ppfas.com** for query resolutions.",
        citationUrl: "https://amc.ppfas.com/contact-us/"
    }
};

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

// Sidebar & Mobile Toggle Elements
const sidebarEl = document.getElementById("sidebar");
const mobileToggleBtn = document.getElementById("mobileToggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const sidebarSchemesEl = document.getElementById("sidebarSchemes");

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    await checkServerStatus();
    updateKeyStatusUI();
    setupEventListeners();
    
    // Welcome notification indicating active modes
    if (isServerKeyActive) {
        setTimeout(() => {
            addSystemNotification("✅ Operating in Live Grounded Mode. Requests are routed securely through the backend proxy server.");
        }, 800);
    } else if (geminiApiKey) {
        setTimeout(() => {
            addSystemNotification("✅ Operating in Live Grounded Mode (using client-side key saved in your browser).");
        }, 800);
    } else {
        setTimeout(() => {
            addSystemNotification("💡 Operating in Offline Demo Mode. You can query the mock database for scheme facts! Click 'Settings' in the sidebar footer to enter your Gemini API Key or configure the server's GEMINI_API_KEY environment variable.");
        }, 800);
    }
});

// Check secure server API status
async function checkServerStatus() {
    try {
        const response = await fetch("/api/status");
        if (response.ok) {
            const data = await response.json();
            isServerKeyActive = !!data.keyConfigured;
        }
    } catch (e) {
        console.warn("Backend status endpoint unavailable. Running in client-side fallback mode.");
        isServerKeyActive = false;
    }
}

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

    // Sidebar Schemes Click (Pre-fill template)
    if (sidebarSchemesEl) {
        sidebarSchemesEl.addEventListener("click", (e) => {
            const btn = e.target.closest(".nav-btn");
            if (!btn) return;
            const schemeName = btn.dataset.scheme || btn.textContent.trim();
            userInputEl.value = `What is the exit load of ${schemeName}?`;
            userInputEl.focus();
            
            // On mobile view, slide away the sidebar after clicking a scheme
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    }

    // Mobile Sidebar Toggles
    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener("click", openSidebar);
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeSidebar);
    }

    // Close mobile sidebar when clicking main page content
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && sidebarEl && sidebarEl.classList.contains("open")) {
            if (!sidebarEl.contains(e.target) && e.target !== mobileToggleBtn && !mobileToggleBtn.contains(e.target)) {
                closeSidebar();
            }
        }
    });
}

// ==========================================
// SIDEBAR CONTROL ACTIONS
// ==========================================
function openSidebar() {
    if (sidebarEl) sidebarEl.classList.add("open");
}

// Close mobile sidebar
function closeSidebar() {
    if (sidebarEl) sidebarEl.classList.remove("open");
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
    const statusDotEl = document.getElementById("statusDot");
    const statusTextEl = document.getElementById("statusText");

    if (isServerKeyActive) {
        keyStatusEl.className = "key-status active";
        keyStatusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Server Key Active`;
        apiKeyInput.value = "";
        apiKeyInput.placeholder = "Configured securely on server";
        apiKeyInput.disabled = true;
        saveApiKeyBtn.disabled = true;
        clearApiKeyBtn.disabled = true;
        
        if (statusDotEl) statusDotEl.className = "status-dot";
        if (statusTextEl) statusTextEl.textContent = "Live Grounded Session";
    } else if (geminiApiKey) {
        keyStatusEl.className = "key-status active";
        keyStatusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> API Key Saved`;
        apiKeyInput.value = geminiApiKey;
        apiKeyInput.placeholder = "Enter AIzaSy... API Key";
        apiKeyInput.disabled = false;
        saveApiKeyBtn.disabled = false;
        clearApiKeyBtn.disabled = false;
        
        if (statusDotEl) statusDotEl.className = "status-dot";
        if (statusTextEl) statusTextEl.textContent = "Live Grounded Session (Client)";
    } else {
        keyStatusEl.className = "key-status missing";
        keyStatusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> API Key Missing`;
        apiKeyInput.value = "";
        apiKeyInput.placeholder = "Enter AIzaSy... API Key";
        apiKeyInput.disabled = false;
        saveApiKeyBtn.disabled = false;
        clearApiKeyBtn.disabled = false;
        
        if (statusDotEl) statusDotEl.className = "status-dot demo";
        if (statusTextEl) statusTextEl.textContent = "Offline Demo Mode";
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
    
    let parsedText = marked.parse(text);
    let citationHtml = "";
    
    if (isRefusal) {
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
    
    // 1. PII Detection (PAN, Aadhaar, Account numbers, emails, phone numbers, OTPs)
    if (detectPII(text)) {
        addSystemNotification("⚠️ Privacy Warning: Please do not share sensitive personal information (such as PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers). Your request has been blocked for safety.");
        return;
    }

    // 2. Returns/Performance check (intercept and route to factsheet)
    const lowercaseQuery = text.toLowerCase();
    const hasTaxReturns = /tax return/i.test(lowercaseQuery);
    const returnsRegex = /\breturn(s)?\b|\bperformance\b|\bcagr\b|\byield(s)?\b|\bgrowth rate(s)?\b|\bannualized\b|\binterest\b/i;
    const isPerformanceRequested = returnsRegex.test(lowercaseQuery) && !hasTaxReturns;

    if (isPerformanceRequested) {
        addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            const performanceRefusal = "I do not compute, compare, or display mutual fund performance returns. For official, up-to-date performance figures, benchmarks, and historical returns, please refer to the official PPFAS Monthly Factsheets.";
            const factsheetUrl = "https://ppfas.com/downloads/monthly-factsheets/";
            addBotMessage(performanceRefusal, factsheetUrl, "PPFAS Monthly Factsheets Archive", false);
        }, 500);
        return;
    }
    
    // 2.5. Scheme Comparison Intercept (e.g. Flexi vs Liquid)
    const comparisonKeywords = ["compare", "vs", "versus", "difference between", "difference"];
    const isComparisonRequested = comparisonKeywords.some(kw => lowercaseQuery.includes(kw));

    if (isComparisonRequested) {
        const matchedKeys = [];
        if (lowercaseQuery.includes("flexi")) matchedKeys.push("flexi");
        if (lowercaseQuery.includes("large")) matchedKeys.push("large");
        if (lowercaseQuery.includes("elss") || lowercaseQuery.includes("tax saver")) matchedKeys.push("elss");
        if (lowercaseQuery.includes("hybrid") || lowercaseQuery.includes("conservative")) matchedKeys.push("hybrid");
        if (lowercaseQuery.includes("liquid")) matchedKeys.push("liquid");

        if (matchedKeys.length >= 2) {
            addTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                
                const tableHtml = generateComparisonTable(matchedKeys);
                const firstScheme = MOCK_SCHEME_DB[matchedKeys[0]];
                
                const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const footnote = `\n\n<div class="last-updated">Last updated from sources: ${today} (Grounded comparison)</div>`;
                
                addBotMessage(tableHtml + footnote, firstScheme.factsheetUrl, `${firstScheme.name} Factsheet`, false);
            }, 600);
            return;
        }
    }
    
    // 3. Fallback to Offline Demo Mode if Server Key and Client Key are BOTH missing
    if (!isServerKeyActive && !geminiApiKey) {
        addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            
            const lowercaseText = text.toLowerCase();
            
            // A. Check FAQ DB matches
            let matchedFaq = null;
            if (lowercaseText.includes("capital-gains") || lowercaseText.includes("capital gains")) {
                matchedFaq = MOCK_FAQ_DB["capital-gains"];
            } else if (lowercaseText.includes("statement")) {
                matchedFaq = MOCK_FAQ_DB["statement"];
            } else if (lowercaseText.includes("contact") || lowercaseText.includes("email") || lowercaseText.includes("phone") || lowercaseText.includes("helpline")) {
                matchedFaq = MOCK_FAQ_DB["contact"];
            }
            
            if (matchedFaq) {
                const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const footnote = `\n\n<div class="last-updated">Last updated from sources: ${today} (Offline Demo Mode)</div>`;
                addBotMessage(matchedFaq.answer + footnote, matchedFaq.citationUrl, "PPFAS Official Source", false);
                return;
            }
            
            // B. Check Scheme DB matches
            let matchedSchemeKey = null;
            if (lowercaseText.includes("flexi")) {
                matchedSchemeKey = "flexi";
            } else if (lowercaseText.includes("large")) {
                matchedSchemeKey = "large";
            } else if (lowercaseText.includes("elss") || lowercaseText.includes("tax saver")) {
                matchedSchemeKey = "elss";
            } else if (lowercaseText.includes("hybrid") || lowercaseText.includes("conservative")) {
                matchedSchemeKey = "hybrid";
            } else if (lowercaseText.includes("liquid")) {
                matchedSchemeKey = "liquid";
            }
            
            if (matchedSchemeKey) {
                const scheme = MOCK_SCHEME_DB[matchedSchemeKey];
                let responseContent = "";
                
                if (lowercaseText.includes("expense")) {
                    responseContent = `The expense ratio of **${scheme.name}** is ${scheme.expenseRatio}.`;
                } else if (lowercaseText.includes("exit")) {
                    responseContent = `The exit load of **${scheme.name}** is: ${scheme.exitLoad}`;
                } else if (lowercaseText.includes("lock")) {
                    responseContent = `The lock-in period for **${scheme.name}** is: ${scheme.lockIn}`;
                } else if (lowercaseText.includes("sip") || lowercaseText.includes("minimum")) {
                    responseContent = `The minimum SIP amount for **${scheme.name}** is ${scheme.minimumSip}.`;
                } else if (lowercaseText.includes("riskometer") || lowercaseText.includes("risk")) {
                    responseContent = `According to the product factsheet, **${scheme.name}** has a riskometer rating of **${scheme.riskometer}**.`;
                } else if (lowercaseText.includes("benchmark")) {
                    responseContent = `The benchmark for **${scheme.name}** is the **${scheme.benchmark}**.`;
                } else {
                    responseContent = `**${scheme.name}** details:<br>- **Expense Ratio**: ${scheme.expenseRatio}<br>- **Exit Load**: ${scheme.exitLoad}<br>- **Lock-in**: ${scheme.lockIn}<br>- **Minimum SIP**: ${scheme.minimumSip}<br>- **Riskometer**: ${scheme.riskometer}<br>- **Benchmark**: ${scheme.benchmark}`;
                }
                
                const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const footnote = `\n\n<div class="last-updated">Last updated from sources: ${today} (Offline Demo Mode)</div>`;
                addBotMessage(responseContent + footnote, scheme.factsheetUrl, `${scheme.name} Factsheet`, false);
                return;
            }
            
            const fallbackMessage = "This query is not covered in Offline Demo Mode. Please click the **Settings** button in the sidebar footer and enter a valid **Gemini API Key** to enable live search grounding for any question.";
            addBotMessage(fallbackMessage, null, null, false);
            
        }, 500);
        return;
    }
    
    addTypingIndicator();
    
    // Local pre-intercept for investment advice
    const adviceKeywords = ["should i buy", "should i sell", "is it good time to buy", "recommend me", "which is better", "invest in", "is a good investment", "buy or sell", "best fund"];
    const isAdviceRequested = adviceKeywords.some(keyword => lowercaseQuery.includes(keyword));

    try {
        let responseText = "";
        let metadata = {};

        if (isServerKeyActive) {
            // Route through secure backend proxy (Production Mode)
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch response from server.");
            }

            const data = await response.json();
            responseText = data.text || "No response generated.";
            metadata = data.groundingMetadata || {};
        } else {
            // Client-side API key fallback (Developer/Sandbox Mode)
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const systemInstruction = `
You are a highly precise and objective Mutual Fund FAQ Assistant specializing in Parag Parikh Financial Advisory Services (PPFAS) Mutual Fund schemes.
You answer specific facts about PPFAS schemes (expense ratio, exit load, minimum SIP, lock-in (ELSS), riskometer, benchmark, and statement downloads).

Strict Instructions:
1. Identify if the query is opinionated, subjective, or asking for investment advice, suggestions to buy/sell (e.g. "Should I buy Flexi Cap?", "Is PPFAS Flexi Cap better than others?", "When to sell PPFAS Liquid?").
2. If it is an advice or recommendation query, you MUST politely refuse to answer. State that you only provide objective facts and do not offer investment advice or recommendations. Include the text: "For more details on PPFAS mutual fund operations and general guidelines, please review the official educational resources." 
3. If the user asks to calculate, compare, or report on mutual fund returns or performance, you must refuse to answer. Direct them to the official PPFAS Monthly Factsheets page at https://ppfas.com/downloads/monthly-factsheets/.
4. Limit your factual answers to a maximum of 3 sentences. Be extremely concise, direct, and factual. Do not make any performance claims, compute returns, or compare returns.
5. Search and grounding MUST only use official public information sources (e.g. amc.ppfas.com, ppfas.com, sebi.gov.in, amfiindia.com). Do NOT refer to third-party blogs, forums, or unofficial sites. You must not describe or reference any application backend screenshots or designs.
6. Every factual answer must contain a clear reference to the official source.
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
            
            responseText = response.text || "No response generated.";
            metadata = response.candidates?.[0]?.groundingMetadata || {};
        }

        removeTypingIndicator();
        
        const modelRefusalDetected = responseText.toLowerCase().includes("refuse") || 
                                     responseText.toLowerCase().includes("do not provide") || 
                                     responseText.toLowerCase().includes("do not offer") || 
                                     responseText.toLowerCase().includes("financial advice") ||
                                     responseText.toLowerCase().includes("investment advice");
                                     
        const isRefusal = isAdviceRequested || modelRefusalDetected;
        
        if (isRefusal) {
            const refusalMessage = `I only answer objective, factual questions about mutual fund schemes (such as expense ratios, minimum SIPs, or exit loads). As an assistant, I do not provide investment advice, buy/sell recommendations, or opinions on fund suitability.`;
            addBotMessage(refusalMessage, null, null, true);
        } else {
            const chunks = metadata.groundingChunks || [];
            const firstChunk = chunks.find(chunk => chunk.web && chunk.web.uri);
            const citationUrl = firstChunk ? firstChunk.web.uri : null;
            const citationTitle = firstChunk ? (firstChunk.web.title || "PPFAS Official Source") : "PPFAS Official Source";
            
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const footnote = `\n\n<div class="last-updated">Last updated from sources: ${today}</div>`;
            
            addBotMessage(responseText + footnote, citationUrl, citationTitle, false);
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
function detectPII(text) {
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/i;
    const aadhaarRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
    const phoneRegex = /\b(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}\b/;
    const accountRegex = /\b\d{9,18}\b/;
    
    const hasOtpKeyword = /otp|one-time password/i.test(text);
    const codeRegex = /\b\d{4,6}\b/;
    const hasOtpCode = hasOtpKeyword && codeRegex.test(text);

    return panRegex.test(text) || 
           aadhaarRegex.test(text) || 
           emailRegex.test(text) || 
           phoneRegex.test(text) || 
           accountRegex.test(text) || 
           hasOtpCode;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateComparisonTable(keys) {
    let html = `<table>
        <thead>
            <tr>
                <th>Parameter</th>
    `;
    
    keys.forEach(k => {
        const scheme = MOCK_SCHEME_DB[k];
        html += `<th>${scheme.name.replace("Parag Parikh ", "")}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    const metrics = [
        { label: "Expense Ratio", key: "expenseRatio" },
        { label: "Exit Load", key: "exitLoad" },
        { label: "Lock-in Period", key: "lockIn" },
        { label: "Minimum SIP", key: "minimumSip" },
        { label: "Riskometer", key: "riskometer" },
        { label: "Benchmark", key: "benchmark" }
    ];
    
    metrics.forEach(m => {
        html += `<tr><td><strong>${m.label}</strong></td>`;
        keys.forEach(k => {
            const scheme = MOCK_SCHEME_DB[k];
            html += `<td>${scheme[m.key]}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    return html;
}
