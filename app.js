// ==========================================
// STATE MANAGEMENT & CONFIGURATION
// ==========================================
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
    },
    "arbitrage": {
        name: "Parag Parikh Arbitrage Fund",
        expenseRatio: "Regular Plan: 0.60%, Direct Plan: 0.30% (as of April 2026)",
        exitLoad: "0.25% if redeemed within 30 days; Nil after 30 days.",
        lockIn: "No lock-in period.",
        minimumSip: "₹1,000",
        riskometer: "Low Risk",
        benchmark: "NIFTY 50 Arbitrage Total Return Index",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-arbitrage-fund/"
    },
    "dynamic": {
        name: "Parag Parikh Dynamic Asset Allocation Fund",
        expenseRatio: "Regular Plan: 0.61%, Direct Plan: 0.35% (as of April 2026)",
        exitLoad: "1.00% if redeemed within 365 days (for redemptions exceeding 10% of units); Nil after 365 days.",
        lockIn: "No lock-in period.",
        minimumSip: "₹1,000",
        riskometer: "Moderately High Risk",
        benchmark: "CRISIL Hybrid 50+50 Moderate Index",
        factsheetUrl: "https://amc.ppfas.com/mutual-funds/parag-parikh-dynamic-asset-allocation-fund/"
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
const clearChatBtn = document.getElementById("clearChatBtn");

// No settings elements (API Key strictly handled server-side)

// Sidebar & Mobile Toggle Elements
const sidebarEl = document.getElementById("sidebar");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const sidebarSchemesEl = document.getElementById("sidebarSchemes");

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    await checkServerStatus();
    updateKeyStatusUI();
    setupEventListeners();
    
    // Render the interactive welcome dashboard card
    addWelcomeCard(isServerKeyActive);
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
    // Event listeners for basic chat components

    // Form Submit
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = userInputEl.value.trim();
        if (!text) return;
        handleUserQuery(text);
        userInputEl.value = "";
    });

    // Clear Chat Click
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            chatMessagesEl.innerHTML = "";
            addWelcomeCard(isServerKeyActive);
        });
    }

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

    // Sidebar Collapse / Drawer Toggles
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                if (sidebarEl.classList.contains("open")) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            } else {
                sidebarEl.classList.toggle("collapsed");
            }
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeSidebar);
    }

    // Close mobile sidebar when clicking main page content
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && sidebarEl && sidebarEl.classList.contains("open")) {
            if (!sidebarEl.contains(e.target) && e.target !== sidebarToggleBtn && !sidebarToggleBtn.contains(e.target)) {
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
function updateKeyStatusUI() {
    const statusDotEl = document.getElementById("statusDot");
    const statusTextEl = document.getElementById("statusText");

    if (isServerKeyActive) {
        if (statusDotEl) statusDotEl.className = "status-dot";
        if (statusTextEl) statusTextEl.textContent = "Live Grounded";
    } else {
        if (statusDotEl) statusDotEl.className = "status-dot demo";
        if (statusTextEl) statusTextEl.textContent = "Demo Mode";
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
    
    let riskometerHtml = "";
    if (!text.trim().startsWith("<table") && !isRefusal) {
        const riskLevel = extractRiskometerRating(text);
        if (riskLevel) {
            riskometerHtml = generateRiskometerWidget(riskLevel);
        }
    }
    
    msgEl.innerHTML = `
        <div>${parsedText}</div>
        ${riskometerHtml}
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

    // 1.2. Greetings Intercept
    const greetings = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"];
    const lowercaseClean = text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    if (greetings.includes(lowercaseClean)) {
        addBotMessage("Hello! How can I help you with Parag Parikh Mutual Fund scheme facts today?", null, null, false);
        return;
    }

    // 1.5. Out of Scope Check (general knowledge, math, chat, etc.)
    if (isOutOfScope(text)) {
        const outOfScopeRefusal = "I only answer objective, factual questions about Parag Parikh Mutual Fund schemes (such as expense ratios, exit loads, or statement downloads). This query is outside the scope of this assistant.";
        addBotMessage(outOfScopeRefusal, null, null, false);
        return;
    }

    // 2. Returns/Performance check (intercept and route to factsheet)
    const lowercaseQuery = text.toLowerCase();
    const hasTaxReturns = /tax return/i.test(lowercaseQuery);
    const returnsRegex = /\breturn(s)?\b|\bperformance\b|\bcagr\b|\byield(s)?\b|\bgrowth rate(s)?\b|\bannualized\b/i;
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
        if (lowercaseQuery.includes("arbitrage")) matchedKeys.push("arbitrage");
        if (lowercaseQuery.includes("dynamic") || lowercaseQuery.includes("asset allocation")) matchedKeys.push("dynamic");

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
    
    // 3. Fallback to Offline Demo Mode if Server Key is missing
    if (!isServerKeyActive) {
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
            } else if (lowercaseText.includes("arbitrage")) {
                matchedSchemeKey = "arbitrage";
            } else if (lowercaseText.includes("dynamic") || lowercaseText.includes("asset allocation")) {
                matchedSchemeKey = "dynamic";
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
                    responseContent = `
<div class="scheme-card">
    <div class="scheme-card-header">
        <span class="scheme-card-title">${scheme.name}</span>
        <span class="scheme-card-badge">Scheme Profile</span>
    </div>
    <div class="scheme-grid">
        <div class="scheme-grid-item">
            <span class="scheme-grid-label">Expense Ratio</span>
            <span class="scheme-grid-value">${scheme.expenseRatio}</span>
        </div>
        <div class="scheme-grid-item">
            <span class="scheme-grid-label">Minimum SIP</span>
            <span class="scheme-grid-value">${scheme.minimumSip}</span>
        </div>
        <div class="scheme-grid-item">
            <span class="scheme-grid-label">Exit Load</span>
            <span class="scheme-grid-value">${scheme.exitLoad}</span>
        </div>
        <div class="scheme-grid-item">
            <span class="scheme-grid-label">Lock-in Period</span>
            <span class="scheme-grid-value">${scheme.lockIn}</span>
        </div>
        <div class="scheme-grid-item" style="grid-column: span 2;">
            <span class="scheme-grid-label">Benchmark</span>
            <span class="scheme-grid-value">${scheme.benchmark}</span>
        </div>
        <div class="scheme-grid-item" style="grid-column: span 2;">
            <span class="scheme-grid-label">Riskometer</span>
            <span class="scheme-grid-value">${scheme.riskometer}</span>
        </div>
    </div>
</div>
`;
                }
                
                const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const footnote = `\n\n<div class="last-updated">Last updated from sources: ${today} (Offline Demo Mode)</div>`;
                addBotMessage(responseContent + footnote, scheme.factsheetUrl, `${scheme.name} Factsheet`, false);
                return;
            }
            
            // If no specific scheme matched but they queried a valid scheme metric
            const metricKeywords = ["sip", "expense", "exit", "lock", "benchmark", "riskometer", "minimum"];
            const hasMetricKeyword = metricKeywords.some(kw => lowercaseText.includes(kw));
            if (hasMetricKeyword) {
                const guidanceMessage = "Please specify which Parag Parikh scheme you are asking about (e.g., *'Minimum SIP of Flexi Cap'* or *'Exit load of Liquid Fund'*). In Offline Demo Mode, I require the scheme name to retrieve details.";
                addBotMessage(guidanceMessage, null, null, false);
                return;
            }
            
            const fallbackMessage = "This query is not covered in Offline Demo Mode. Live grounded search is currently disabled because the server GEMINI_API_KEY environment variable is not configured.";
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
            
            const trimmedText = trimToSentences(responseText, 3);
            addBotMessage(trimmedText + footnote, citationUrl, citationTitle, false);
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

function trimToSentences(text, maxSentences = 3) {
    const sentences = text.match(/[^.!?]+[.!?]+(?=\s+[A-Z]|\s*$)/g) || [text];
    if (sentences.length > maxSentences) {
        return sentences.slice(0, maxSentences).join("").trim();
    }
    return text;
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

function extractRiskometerRating(text) {
    const lowercase = text.toLowerCase();
    if (lowercase.includes("low to moderate")) {
        return "Low to Moderate";
    } else if (lowercase.includes("moderately high")) {
        return "Moderately High";
    } else if (lowercase.includes("very high")) {
        return "Very High";
    } else if (lowercase.includes("low")) {
        return "Low";
    } else if (lowercase.includes("moderately") || lowercase.includes("moderate")) {
        return "Moderate";
    } else if (lowercase.includes("high")) {
        return "High";
    }
    return null;
}

function generateRiskometerWidget(riskLevel) {
    let riskClass = "";
    let activeIndex = -1;
    
    switch (riskLevel) {
        case "Low":
            riskClass = "low";
            activeIndex = 0;
            break;
        case "Low to Moderate":
            riskClass = "low-moderate";
            activeIndex = 1;
            break;
        case "Moderate":
            riskClass = "moderate";
            activeIndex = 2;
            break;
        case "Moderately High":
            riskClass = "moderately-high";
            activeIndex = 3;
            break;
        case "High":
            riskClass = "high";
            activeIndex = 4;
            break;
        case "Very High":
            riskClass = "very-high";
            activeIndex = 5;
            break;
        default:
            return "";
    }
    
    return `
        <div class="riskometer-widget">
            <div class="riskometer-header">
                <span class="riskometer-title"><i class="fa-solid fa-gauge-high"></i> Scheme Riskometer</span>
                <span class="risk-level-name ${riskClass}">${riskLevel}</span>
            </div>
            <div class="riskometer-bar">
                <div class="risk-segment segment-low ${activeIndex === 0 ? 'active' : ''}" style="color: #10b981;"></div>
                <div class="risk-segment segment-low-mod ${activeIndex === 1 ? 'active' : ''}" style="color: #84cc16;"></div>
                <div class="risk-segment segment-moderate ${activeIndex === 2 ? 'active' : ''}" style="color: #eab308;"></div>
                <div class="risk-segment segment-mod-high ${activeIndex === 3 ? 'active' : ''}" style="color: #f97316;"></div>
                <div class="risk-segment segment-high ${activeIndex === 4 ? 'active' : ''}" style="color: #f43f5e;"></div>
                <div class="risk-segment segment-very-high ${activeIndex === 5 ? 'active' : ''}" style="color: #ef4444;"></div>
            </div>
            <div class="riskometer-labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>Very High</span>
            </div>
        </div>
    `;
}

function addWelcomeCard(isLive) {
    const cardEl = document.createElement("div");
    cardEl.className = "welcome-card";
    
    const infoHtml = isLive 
        ? `<div class="welcome-action-info live">
             <p>🚀 <strong>Live Grounded Search is active.</strong> Real-time search grounding via Google Search is enabled to retrieve accurate scheme updates.</p>
           </div>`
        : `<div class="welcome-action-info">
             <p>💡 <strong>Demo Sandbox Mode is active.</strong> You can type any query or click a scheme in the left sidebar to pre-fill questions. Offline database mock responses are enabled.</p>
           </div>`;

    cardEl.innerHTML = `
        <div class="welcome-card-header">
            <div class="welcome-logo-badge"><i class="fa-solid fa-circle-nodes"></i></div>
            <div>
                <h3>PPFAS FAQ Assistant</h3>
                <p>Interactive factual guide for Parag Parikh Mutual Fund schemes.</p>
            </div>
        </div>
        <div class="welcome-features">
            <div class="feature-item">
                <span class="feature-icon"><i class="fa-solid fa-circle-check"></i></span>
                <span>Factual queries only (Expense ratio, Minimum SIP, Exit loads, Lock-in)</span>
            </div>
            <div class="feature-item">
                <span class="feature-icon"><i class="fa-solid fa-shield-halved"></i></span>
                <span>Privacy Safe (All PAN, Aadhaar, accounts, and OTP inputs are blocked)</span>
            </div>
            <div class="feature-item">
                <span class="feature-icon"><i class="fa-solid fa-scale-unbalanced-flip"></i></span>
                <span>Compliance Intercepts (Investment advice & performance returns are refused)</span>
            </div>
        </div>
        ${infoHtml}
    `;
    
    chatMessagesEl.appendChild(cardEl);
    scrollToBottom();
}

function isOutOfScope(text) {
    const lowercase = text.toLowerCase();
    const mutualFundKeywords = [
        "fund", "scheme", "parag", "ppfas", "load", "sip", "expense", "exit", "lock", "cams", "cas", "capital-gains", "statement", "flexi", "large", "elss", "tax saver", "hybrid", "liquid", "arbitrage", "dynamic", "benchmark", "riskometer", "nav", "portfolio", "asset", "amc", "operational", "report", "factsheet", "contact"
    ];
    return !mutualFundKeywords.some(keyword => lowercase.includes(keyword));
}
