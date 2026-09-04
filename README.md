# ⚡ Ledger AI — Finance Controller Agent

An AI-powered finance dashboard that ingests transactions, runs them through an intelligent agent pipeline (categorization, reconciliation, anomaly detection), and provides a chat Q&A interface — all powered by Groq Cloud API.

## Features

- **📊 Transaction Ingestion** — Load CSV data and view raw transaction tables
- **🏷️ AI Categorization** — Automatically categorize transactions using Groq LLM
- **🔍 Invoice Reconciliation** — Match income against invoice references, flag mismatches
- **⚠️ Anomaly Detection** — Flag spending spikes (>2x category average) and duplicate payments
- **🤖 Action Agent** — Auto-draft reminder emails, refund requests, and anomaly explanations
- **💬 Chat Q&A** — Ask natural-language questions about your finances with tool-use AI

## Quick Start

### Prerequisites
- Node.js 18+
- A [Groq API key](https://console.groq.com/keys)

### Setup

```bash
# 1. Install all dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 2. Set your Groq API key
# Edit server/.env and set GROQ_API_KEY=your_key_here

# 3. Run both server and client
npm run dev
```

The app will be available at **http://localhost:5173**

### Demo Script

1. **Load Data** — Click "📂 Load Transactions" to ingest the sample CSV (55 transactions)
2. **Run Agent** — Click "🚀 Run AI Reconciliation" and watch categorization + flags populate live
3. **Review Flags** — Click on flagged transactions to see AI-generated action drafts
4. **Approve Actions** — Click "Approve" to resolve flagged items
5. **Chat** — Open the chat panel and ask questions like:
   - "How much did we spend on cloud infrastructure?"
   - "Are there any duplicate payments?"
   - "What's our biggest expense category?"

## Architecture

```
├── sample_transactions.csv    # 55 transactions with intentional anomalies
├── server/                    # Express + SQLite + Groq API
│   ├── src/
│   │   ├── agents/            # AI agent modules
│   │   │   ├── categorizer.js # Batch Groq LLM categorization
│   │   │   ├── reconciler.js  # Invoice matching (pure logic)
│   │   │   ├── anomaly.js     # Anomaly detection + LLM explanations
│   │   │   ├── actionAgent.js # Draft emails/notes per flag
│   │   │   └── chatAgent.js   # Tool-use Q&A with function calling
│   │   ├── routes/            # Express API endpoints
│   │   ├── utils/             # Groq client, CSV parser
│   │   └── db.js              # SQLite with better-sqlite3
│   └── .env                   # GROQ_API_KEY
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
| AI | Groq Cloud API (OpenAI GPT-OSS models) |
| Frontend | React 19, Vite |
| Styling | Tailwind CSS v4 |
| Design | Dark Glassmorphism |

## Accuracy & Transparency

Ledger does not cherry-pick results. After every agent run, it reports:

| Metric | Value |
|--------|-------|
| Transactions processed | 55 |
| Successfully matched | 49 (89.1%) |
| Exceptions found | 6 (10.9%) |
| Exception types | Missing invoice, Duplicate ref, Duplicate payment, Spend anomaly |

Every exception is listed with a specific, plain-English reason why it could not be resolved automatically — not a generic error message.

The agent flags what it cannot resolve and hands it back to a human with context, rather than silently dropping it or making assumptions.

## Razorpay Integration (Roadmap)

Ledger AI is designed to connect directly to **Razorpay's Payments API** and **Payouts API** for real-time transaction ingestion — eliminating the need for CSV uploads entirely.

The agent pipeline (categorization, reconciliation, anomaly detection, action drafting) is **API-agnostic** and ready for live data. Integration would involve:

1. **Webhook ingestion** — receive `payment.captured`, `refund.processed`, and `payout.processed` events from Razorpay in real-time
2. **Automatic categorization** — new transactions run through the Groq AI pipeline immediately on receipt
3. **Live reconciliation** — match Razorpay order IDs directly to invoice references
4. **Proactive alerts** — push anomaly notifications before end-of-day review

```javascript
// Example: Razorpay webhook handler (planned)
app.post('/webhook/razorpay', (req, res) => {
  const event = req.body;
  if (event.event === 'payment.captured') {
    const tx = mapRazorpayToTransaction(event.payload.payment.entity);
    insertTransactions([tx]);
    runIncrementalPipeline(tx); // categorize + anomaly check immediately
  }
  res.json({ status: 'ok' });
});
```

This positions Ledger AI as a production-ready finance controller for any business using Razorpay as their payment gateway — with zero manual data entry.

## License

MIT
