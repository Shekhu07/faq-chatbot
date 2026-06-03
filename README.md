# ⚡ Mutual Fund FAQ Chatbot (Working Prototype)

A clean, Groww-styled dark-themed dashboard prototype that answers factual questions about Parag Parikh Mutual Fund (PPFAS) schemes. 

Built with **HTML, Vanilla CSS, and JavaScript**, it utilizes a **Zero-Client-Key** architecture. Live grounding requests are proxied securely to the server side using the official **Google Gen AI Client SDK** (`@google/genai`) to enable **Google Search Grounding** via Gemini 2.5 Flash, preventing any client-side API key exposure.

---

## 🚀 Key Features

* **Zero-Client-Key Architecture** — Strictly keeps `GEMINI_API_KEY` hidden server-side. No cog buttons, modals, or localStorage writes on the frontend.
* **Offline Demo Sandbox Mode** — Automatically falls back to an offline mock database if no server API key is configured.
* **Clear Chat History** — Quick clear button in the header resets the conversation thread and re-renders the interactive dashboard greeting card.
* **Collapsible Sidebar Layout** — A unified toggle button in the header slides the sidebar in/out on mobile (drawer view) and collapses the panel smoothly on desktop (expanding the chat workspace).
* **Factual Metric Lookups** — Instant extraction of Expense Ratios, Exit Loads, Lock-in Periods, Minimum SIP, Benchmarks, and Riskometers.
* **SEBI 6-Stage Riskometer Widget** — Color-coded visual risk gauge widget dynamically rendered inside chat responses.
* **Side-by-Side Scheme Comparisons** Renders a structured comparison table when queries contain words like `versus`, `vs`, or `compare` matching at least two schemes.
* **Compliance & Safety Intercepts**:
  * **PII Detection**: Instantly warns and blocks PAN, Aadhaar, phone numbers, emails, or OTPs client-side.
  * **Returns/Performance Block**: Refuses CAGR/performance calculations and routes users directly to the official factsheet download page.
  * **Out-of-Scope Refusal**: Intercepts general knowledge, math (e.g. `2+2`), or chitchat to keep focus purely on PPFAS mutual funds.

---

## 🛠️ Project Structure

```
faq-chatbot/
├── api/
│   ├── chat.js            # Vercel serverless Node endpoint for live grounding
│   └── status.js          # Vercel serverless Node endpoint for API config checks
├── index.html             # groww-styled dashboard markup with collapsible sidebar
├── styles.css             # Dark slate styles, layouts, widgets, and responsive breakpoints
├── app.js                 # Frontend state manager, PII checker, and offline mock database
├── official_sources.md    # Curated AMC factsheet and policy pages used as RAG source
├── package.json           # Node configuration and engine definitions
├── vercel.json            # Deployment routing rules for static frontend & API paths
├── server.py              # Local Python Flask proxy server
└── README.md              # Current project documentation
```

---

## ⚙️ Setup & Local Execution

### 1. Run Locally (Python Flask Proxy)
Navigate to the project directory, export your API key, and launch the local server:

```bash
export GEMINI_API_KEY="AIzaSyYourActualKey"
python3 server.py
```
*(On Windows command prompt, use `set GEMINI_API_KEY=AIzaSy...` and run `python server.py`)*

### 2. Access the Chatbot
Open your browser and navigate to:
👉 **`http://localhost:8000`**

* If `GEMINI_API_KEY` is active, the header shows **Live Grounded** status.
* If no key is set, it operates in **Demo Mode**, serving structured mock responses offline.

---

## 💡 Supported Demo Mode Queries

While running in **Demo Mode**, you can test the following interactive templates:

1. **General Scheme Profiles** (Renders a responsive dashboard card):
   * *"Tell me about Parag Parikh Flexi Cap"*
   * *"Details of Parag Parikh Dynamic Asset Allocation"*
   * *Other supported schemes:* Large Cap, ELSS Tax Saver, Conservative Hybrid, Liquid Fund, Arbitrage Fund.
2. **Specific Scheme Metrics** (Factual answers):
   * *"What is the expense ratio of Large Cap?"*
   * *"Exit load of Arbitrage Fund?"*
   * *"Lock-in period for ELSS?"*
   * *"Minimum SIP of Flexi Cap?"*
   * *"Riskometer of liquid fund"* (renders the visual gauge widget).
   * *"What is the benchmark of Conservative Hybrid?"*
3. **Scheme Comparisons** (Renders a comparison table):
   * *"Flexi vs Liquid"*
   * *"Compare Large Cap and ELSS"*
4. **General Operational FAQs**:
   * *"How do I download my capital-gains statement?"*
   * *"How to download my account statement?"*
   * *"PPFAS contact number or email"*
5. **Boundary & Compliance Tests**:
   * **Out-of-Scope math/chat**: `"2+2"` or `"who is the prime minister"` (returns a polite refusal).
   * **Performance/Returns block**: `"What are the returns of Flexi Cap?"` (refuses performance calculations and links to factsheets).
   * **PII Blocker**: Typing an email address or mobile number (triggers the client warning bubble).

---

## 🚀 Production Deployment (Vercel)

This project is pre-configured to build static files (`index.html`, `styles.css`, `app.js`) to `@vercel/static` and map backend requests to serverless Node instances inside `/api/` using `vercel.json`.

1. Push your repository to **GitHub**.
2. Import the project into **Vercel**.
3. Under **Project Settings** → **Environment Variables**, add `GEMINI_API_KEY`.
4. Click **Deploy**.
