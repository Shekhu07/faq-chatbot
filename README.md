# ⚡ Mutual Fund FAQ Chatbot (Working Prototype)

A clean, centered **Tiny UI** working prototype that searches the web in real-time to answer factual questions about Parag Parikh Mutual Fund schemes.

Built with **HTML, Vanilla CSS, and JavaScript**, it integrates the official **Google Gen AI Client SDK** (`@google/genai`) to enable native **Google Search Grounding** via Gemini 2.5 Flash.

## 🧠 Specifications & Rules

- **Factual Queries Only** — Strictly answers factual queries such as:
  - *"What is the expense ratio of Parag Parikh Flexi Cap Fund?"*
  - *"What is the lock-in period for PPFAS ELSS Tax Saver?"*
  - *"What is the minimum SIP of Parag Parikh Liquid Fund?"*
  - *"What is the exit load of Parag Parikh Flexi Cap?"*
  - *"What is the riskometer and benchmark of Parag Parikh Conservative Hybrid?"*
  - *"How do I download my capital-gains statement?"*
- **One Clear Citation** — Every factual response shows exactly **one clear official citation link** right below the answer bubble.
- **Refuses Financial Advice** — Strictly refuses investment opinions, portfolio advice, or recommendation queries (e.g. *"Should I buy Parag Parikh Flexi Cap?"*, *"Which fund should I sell?"*) with a polite, facts-only message and a direct link to the **PPFAS Investor FAQs** education page.
- **Tiny UI** — Features a minimal, card-based interface containing:
  - Welcome line.
  - 3 clickable example questions.
  - A note: *"Facts-only. No investment advice."*
  - An input bar.
  - Settings modal for Gemini API Key configuration.

---

## 🛠️ Project Structure

```
faq-chatbot/
├── index.html          # Clean Tiny UI layout and modal setup
├── styles.css          # Customized scrollbar and dark-themed CSS stylesheet
├── app.js              # Client-side logic for search grounding, citations, and advice refusals
├── official_sources.md # Curated list of official AMC/SEBI/AMFI public pages
└── README.md           # Documentation and running instructions
```

---

## ⚙️ Setup & Local Execution

The chatbot runs on a secure **Zero-Client-Key** architecture. All live grounding API requests are proxied server-side to hide your `GEMINI_API_KEY` from client browsers.

### 1. Run Locally (Python Flask Proxy)
Navigate to the project directory, set your environment variable, and start the local server:

```bash
export GEMINI_API_KEY="AIzaSyYourActualKey"
python3 server.py
```
*(On Windows cmd, use `set GEMINI_API_KEY=AIzaSy...` and run `python server.py`)*

### 2. Access the Chatbot
Open your browser and navigate to:
👉 **`http://localhost:8000`**

- If `GEMINI_API_KEY` is set, the status badge will show **Live Grounded** (routed securely through the server).
- If no key is set, the application operates in **Demo Mode**, utilizing a local mock database.

---

## 🚀 Deployment (Vercel)

This project is pre-configured for direct, serverless deployment on **Vercel** utilizing the Node.js endpoints inside `/api/` and the static roots configuration.

### Deployment Steps:

1. **Push code to GitHub**: Push this repository to a private (or public) GitHub repository.
2. **Import to Vercel**:
   - Go to [Vercel](https://vercel.com/) and click **Add New** → **Project**.
   - Import your repository.
3. **Configure Environment Variable (Crucial)**:
   - Expand the **Environment Variables** section during configuration.
   - Add a new variable:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: `[Your Gemini API Key starting with AIzaSy]`
4. **Deploy**: Click **Deploy**. Vercel will build the static frontend assets and map the `/api/chat.js` and `/api/status.js` paths to serverless function instances automatically.

