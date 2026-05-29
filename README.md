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

To run this application locally without cross-origin resource sharing (CORS) blockages, serve the files from a web server.

### 1. Launch a Local Web Server
You can launch a lightweight web server instantly using Python. Open your terminal, navigate to the project directory, and run:

```bash
cd /Users/abhishekspillai/faq-chatbot
python3 -m http.server 8000
```

### 2. Access the Application
Open your browser and navigate to:
👉 **`http://localhost:8000`**

### 3. Setup Gemini API Key
- Get a free API Key from the [Google AI Studio](https://aistudio.google.com/app/apikey).
- Open the settings modal (clicking the **gear icon** in the chatbot header).
- Input your key and click **Save Key**.
