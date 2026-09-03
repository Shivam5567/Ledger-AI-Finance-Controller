# ⚡ Ledger AI — Finance Controller Agent

An AI-powered finance dashboard that ingests transactions, runs them through an intelligent agent pipeline (categorization, reconciliation, anomaly detection), and provides a chat Q&A interface — all powered by Google Gemini.

## Features

- **📊 Transaction Ingestion** — Load CSV data and view raw transaction tables
- **🏷️ AI Categorization** — Automatically categorize transactions using Gemini AI
- **🔍 Invoice Reconciliation** — Match income against invoice references, flag mismatches
- **⚠️ Anomaly Detection** — Flag spending spikes (>2x category average) and duplicate payments
- **🤖 Action Agent** — Auto-draft reminder emails, refund requests, and anomaly explanations
- **💬 Chat Q&A** — Ask natural-language questions about your finances with tool-use AI

## Quick Start

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Setup

```bash
# 1. Install all dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 2. Set your Gemini API key
# Edit server/.env and set GEMINI_API_KEY=your_key_here

# 3. Run both server and client
npm run dev
```

The app will be available at **http://localhost:5173**

### Demo Script

1. **Load Data** — Click "📂 Load Transactions" to ingest the sample CSV
2. **Run Agent** — Click "🚀 Run AI Agent" and watch categorization + flags populate live
3. **Review Flags** — Click on flagged transactions to see AI-generated action drafts
4. **Approve Actions** — Click "Approve" to resolve flagged items
5. **Chat** — Open the chat panel and ask questions like:
   - "How much did we spend on cloud infrastructure?"
   - "Are there any duplicate payments?"
   - "What's our biggest expense category?"

## Architecture

```
├── sample_transactions.csv    # 28 transactions with intentional anomalies
├── server/                    # Express + SQLite + Gemini API
│   ├── src/
│   │   ├── agents/            # AI agent modules
│   │   │   ├── categorizer.js # Batch Gemini categorization
│   │   │   ├── reconciler.js  # Invoice matching (pure logic)
│   │   │   ├── anomaly.js     # Anomaly detection + LLM explanations
│   │   │   ├── actionAgent.js # Draft emails/notes per flag
│   │   │   └── chatAgent.js   # Tool-use Q&A with function calling
│   │   ├── routes/            # Express API endpoints
│   │   ├── utils/             # Gemini client, CSV parser
│   │   └── db.js              # SQLite with better-sqlite3
│   └── .env                   # GEMINI_API_KEY
├── client/                    # React + Vite + Tailwind v4
│   └── src/
│       ├── components/        # Dashboard UI components
│       ├── hooks/             # Custom React hooks for API
│       └── index.css          # Dark glassmorphism theme
└── package.json               # Root dev script
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| AI | Google Gemini 2.0 Flash |
| Frontend | React 19, Vite |
| Styling | Tailwind CSS v4 |
| Design | Dark Glassmorphism |

## License

MIT
