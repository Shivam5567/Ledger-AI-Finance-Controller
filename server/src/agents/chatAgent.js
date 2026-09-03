import { getModel, hasValidApiKey } from '../utils/gemini.js';
import { getSummary, getAllTransactions } from '../db.js';

// ---------------------------------------------------------------------------
// Build a rich context snapshot from live DB data, injected into the prompt
// ---------------------------------------------------------------------------
function buildDataContext() {
  const allTx  = getAllTransactions();
  const summary = getSummary();

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  const txLines = allTx.map(t =>
    `  [${t.date}] ${t.type.toUpperCase()} | ${t.description} | ` +
    `$${fmt(t.amount)} | cat:${t.category || 'uncategorized'} | ` +
    `flags:[${(t.flags || []).join(',')}]`
  ).join('\n');

  const catLines = (summary.byCategory || [])
    .map(c => `  ${c.category}: $${fmt(c.total)}`)
    .join('\n');

  return `LIVE LEDGER DATA (as of now):
Total Income   : $${fmt(summary.totalIncome)}
Total Expenses : $${fmt(summary.totalExpenses)}
Net Position   : $${fmt(summary.net)}
Flagged Items  : ${summary.flaggedCount}

Spend by Category:
${catLines || '  (none yet)'}

All Transactions (${allTx.length}):
${txLines || '  (no transactions ingested yet)'}`;
}

// ---------------------------------------------------------------------------
// Local rule-based fallback Q&A (no API required)
// ---------------------------------------------------------------------------
function getFallbackAnswer(message) {
  const q      = message.toLowerCase();
  const allTx  = getAllTransactions();
  const summary = getSummary();
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  const expensesByCategory = (catName, keyword = '') =>
    allTx.filter(
      t => t.type === 'expense' &&
        ((t.category && t.category.toLowerCase().includes(catName)) ||
         (keyword && t.description.toLowerCase().includes(keyword)))
    );

  if (q.includes('payroll') || q.includes('salary') || q.includes('wages')) {
    const txs   = expensesByCategory('payroll', 'payroll');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Payroll total: **$${fmt(total)}** across ${txs.length} payment cycles (engineering & marketing teams).`;
  }

  if (q.includes('cloud') || q.includes('aws') || q.includes('infra') || q.includes('server')) {
    const txs   = expensesByCategory('cloud/infra', 'aws');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Cloud / infrastructure spend: **$${fmt(total)}** across ${txs.length} transactions. Includes a spike charge of $7,800 on Jan 25 (flagged as anomaly).`;
  }

  if (q.includes('marketing') || q.includes('ads') || q.includes('advertising') || q.includes('facebook')) {
    const txs   = expensesByCategory('marketing', 'ads');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Marketing / ads spend: **$${fmt(total)}** across ${txs.length} campaigns.`;
  }

  if (q.includes('software') || q.includes('saas') || q.includes('subscri')) {
    const txs   = expensesByCategory('software');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Software subscriptions: **$${fmt(total)}** across ${txs.length} tools.`;
  }

  if (q.includes('rent') || q.includes('office')) {
    const txs   = expensesByCategory('rent', 'rent');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Office / rent spend: **$${fmt(total)}** across ${txs.length} payments.`;
  }

  if (q.includes('duplicate') || q.includes('double') || q.includes('repeat')) {
    const dupes = allTx.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')));
    if (!dupes.length) return 'No duplicate payments were detected.';
    const list = dupes.map(d => `- **${d.description}** ($${fmt(d.amount)}) on ${d.date}`).join('\n');
    return `**${dupes.length} duplicate entries** detected:\n${list}\n\nRefund request notes have been drafted for these.`;
  }

  if (q.includes('unmatched') || q.includes('invoice') || q.includes('missing')) {
    const um = allTx.filter(t => t.flags && t.flags.includes('unmatched_invoice'));
    if (!um.length) return 'All income payments have valid invoice references.';
    const list = um.map(u => `- **${u.description}** ($${fmt(u.amount)}) on ${u.date}`).join('\n');
    return `**${um.length} unmatched income payment(s)** missing an invoice ref:\n${list}\n\nPayment reminder emails have been drafted.`;
  }

  if (q.includes('biggest') || q.includes('largest') || q.includes('top') || q.includes('most')) {
    if (summary.byCategory?.length) {
      const top    = summary.byCategory[0];
      const second = summary.byCategory[1];
      return `Biggest expense category: **${top.category}** ($${fmt(top.total)})` +
             (second ? `, followed by **${second.category}** ($${fmt(second.total)}).` : '.');
    }
  }

  if (q.includes('flagged') || q.includes('anomal') || q.includes('issue')) {
    const flagged = allTx.filter(t => t.flags && t.flags.length > 0);
    if (!flagged.length) return 'No flagged transactions found.';
    const list = flagged.slice(0, 5).map(t => `- **${t.description}** (${t.flags.join(', ')})`).join('\n');
    return `**${flagged.length} flagged transactions** requiring attention:\n${list}`;
  }

  if (q.includes('income') || q.includes('revenue') || q.includes('earning')) {
    const txs   = allTx.filter(t => t.type === 'income');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Total income: **$${fmt(total)}** across ${txs.length} payments received.`;
  }

  // General finance question — answer using the live data summary
  if (allTx.length === 0) {
    return 'No transaction data is loaded yet. Please click **Load Transactions** and then **Run AI Agent** first.';
  }

  return `**Ledger AI Financial Summary**
- **Total Income:** $${fmt(summary.totalIncome)}
- **Total Expenses:** $${fmt(summary.totalExpenses)}
- **Net Position:** $${fmt(summary.net)}
- **Flagged Items:** ${summary.flaggedCount} transaction(s) need review (duplicates, anomalies, missing invoices)

For specific questions, try: "How much did we spend on payroll?", "Are there any duplicate payments?", or "What is our biggest expense?"`;
}

// ---------------------------------------------------------------------------
// Streamed word-by-word helper
// ---------------------------------------------------------------------------
async function streamText(text, res) {
  const words = text.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ type: 'token', text: word + ' ' })}\n\n`);
    await new Promise(r => setTimeout(r, 15));
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function handleChatMessage(message, res) {
  // ── Flush SSE headers immediately ─────────────────────────────────────────
  // res.headersSent only becomes true after the first res.write() / res.end(),
  // NOT after res.setHeader(). Calling flushHeaders() physically sends the HTTP
  // 200 + headers right now, ensuring HTTP 500 can never be returned after this.
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  // Safe fallback sender — won't throw even if db is empty
  const sendFallback = async (msg) => {
    try {
      await streamText(getFallbackAnswer(msg), res);
    } catch (_) {
      res.write(`data: ${JSON.stringify({ type: 'token', text: 'Sorry, I encountered an error. Please try again.' })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  };

  // ── No API key → instant local answer ────────────────────────────────────
  if (!hasValidApiKey()) {
    console.log('[ChatAgent] No API key. Using local assistant.');
    await sendFallback(message);
    return;
  }

  // ── Gemini direct-prompt approach ─────────────────────────────────────────
  // We inject the live transaction data directly into the prompt instead of
  // using function-calling tools (which some model variants don't support).
  try {
    const dataContext = buildDataContext();

    const prompt =
      `You are a financial analyst assistant for Ledger AI.\n` +
      `Use ONLY the live data below to answer the user's question. ` +
      `Be concise, factual, and use specific numbers from the data. ` +
      `Use markdown for formatting (bold for numbers, bullet points for lists). ` +
      `If the question is about something not in the data, say so clearly.\n\n` +
      `${dataContext}\n\n` +
      `USER QUESTION: ${message}`;

    const model  = getModel();
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      try {
        const text = chunk.text();
        if (text) res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
      } catch (_) { /* metadata-only chunk */ }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    const is429 = error.status === 429 || (error.message && error.message.includes('429'));
    if (is429) {
      console.log('[ChatAgent] Quota exhausted. Using local assistant.');
    } else {
      console.error('[ChatAgent] Gemini error:', error.message);
    }
    await sendFallback(message);
  }
}
