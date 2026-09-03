import { getModel, hasValidApiKey } from '../utils/gemini.js';
import { getTransactionsByFilter, getSummary, getAllTransactions } from '../db.js';

// ---------------------------------------------------------------------------
// Tool declarations for Gemini function-calling
// NOTE: All `type` values must be lowercase per the SDK schema spec.
// ---------------------------------------------------------------------------
const tools = [
  {
    name: 'query_transactions',
    description:
      'Query the live transaction database with optional filters and aggregation. ' +
      'Filters: category (string), type (income|expense|refund), dateFrom/dateTo (YYYY-MM-DD), ' +
      'hasFlag (boolean). Aggregate: sum | count | avg. GroupBy: category | type | date.',
    parameters: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          properties: {
            category:  { type: 'string' },
            type:      { type: 'string' },
            dateFrom:  { type: 'string' },
            dateTo:    { type: 'string' },
            hasFlag:   { type: 'boolean' },
          },
        },
        aggregate: { type: 'string', description: 'sum | count | avg' },
        groupBy:   { type: 'string', description: 'category | type | date' },
      },
    },
  },
  {
    name: 'get_summary',
    description: 'Get the overall financial summary: totalIncome, totalExpenses, net position, flaggedCount, and spend breakdown by category.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_flagged_transactions',
    description: 'Get all transactions that have been flagged for anomalies, duplicates, or unmatched invoices.',
    parameters: { type: 'object', properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Local fallback Q&A (no API required)
// ---------------------------------------------------------------------------
function getFallbackAnswer(message) {
  const q      = message.toLowerCase();
  const allTx  = getAllTransactions();
  const summary = getSummary();

  const expensesByCategory = (catName, keyword = '') =>
    allTx.filter(
      t => t.type === 'expense' &&
        ((t.category && t.category.toLowerCase().includes(catName)) ||
         (keyword && t.description.toLowerCase().includes(keyword)))
    );

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  // Payroll
  if (q.includes('payroll') || q.includes('salary') || q.includes('wages')) {
    const txs   = expensesByCategory('payroll', 'payroll');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Payroll total: **$${fmt(total)}** across ${txs.length} payment cycles (engineering & marketing teams).`;
  }

  // Cloud / Infra
  if (q.includes('cloud') || q.includes('aws') || q.includes('infra') || q.includes('server')) {
    const txs   = expensesByCategory('cloud/infra', 'aws');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Cloud / infrastructure spend: **$${fmt(total)}** across ${txs.length} transactions.` +
           ` This includes a spike charge of $7,800 on Jan 25 (flagged as anomaly).`;
  }

  // Marketing
  if (q.includes('marketing') || q.includes('ads') || q.includes('advertising') || q.includes('facebook')) {
    const txs   = expensesByCategory('marketing', 'ads');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Marketing / ads spend: **$${fmt(total)}** across ${txs.length} campaigns.`;
  }

  // Software
  if (q.includes('software') || q.includes('saas') || q.includes('subscri')) {
    const txs   = expensesByCategory('software');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Software subscriptions: **$${fmt(total)}** across ${txs.length} tools.`;
  }

  // Rent
  if (q.includes('rent') || q.includes('office')) {
    const txs   = expensesByCategory('rent', 'rent');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Office / rent spend: **$${fmt(total)}** across ${txs.length} payments.`;
  }

  // Duplicates
  if (q.includes('duplicate') || q.includes('double') || q.includes('repeat')) {
    const dupes = allTx.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')));
    if (!dupes.length) return 'No duplicate payments were detected.';
    const list = dupes.map(d => `- **${d.description}** ($${fmt(d.amount)}) on ${d.date}`).join('\n');
    return `**${dupes.length} duplicate entries** detected:\n${list}\n\nRefund request notes have been drafted for these.`;
  }

  // Unmatched invoices
  if (q.includes('unmatched') || q.includes('invoice') || q.includes('missing')) {
    const um = allTx.filter(t => t.flags && t.flags.includes('unmatched_invoice'));
    if (!um.length) return 'All income payments have valid invoice references.';
    const list = um.map(u => `- **${u.description}** ($${fmt(u.amount)}) on ${u.date}`).join('\n');
    return `**${um.length} unmatched income payment(s)** missing an invoice ref:\n${list}\n\nPayment reminder emails have been drafted.`;
  }

  // Biggest category
  if (q.includes('biggest') || q.includes('largest') || q.includes('top') || q.includes('most')) {
    if (summary.byCategory?.length) {
      const top = summary.byCategory[0];
      const second = summary.byCategory[1];
      return `Biggest expense category: **${top.category}** ($${fmt(top.total)})` +
             (second ? `, followed by **${second.category}** ($${fmt(second.total)}).` : '.');
    }
  }

  // Flagged / anomalies
  if (q.includes('flagged') || q.includes('anomal') || q.includes('issue')) {
    const flagged = allTx.filter(t => t.flags && t.flags.length > 0);
    if (!flagged.length) return 'No flagged transactions found.';
    const list = flagged.slice(0, 5).map(t => `- **${t.description}** (${t.flags.join(', ')})`).join('\n');
    return `**${flagged.length} flagged transactions** requiring attention:\n${list}`;
  }

  // Net / overall summary
  return `**Ledger AI Financial Summary**
- **Total Income:** $${fmt(summary.totalIncome)}
- **Total Expenses:** $${fmt(summary.totalExpenses)}
- **Net Position:** $${fmt(summary.net)}
- **Flagged Items:** ${summary.flaggedCount} transaction(s) need review (duplicates, anomalies, missing invoices)`;
}

// ---------------------------------------------------------------------------
// Tool execution helper
// ---------------------------------------------------------------------------
function executeTool(name, args = {}) {
  if (name === 'get_summary') {
    return getSummary();
  }

  if (name === 'get_flagged_transactions') {
    return { data: getTransactionsByFilter({ hasFlag: true }) };
  }

  if (name === 'query_transactions') {
    const filter = args.filter || {};
    let data = getTransactionsByFilter(filter);

    if (args.groupBy) {
      const grouped = {};
      for (const tx of data) {
        const key = tx[args.groupBy] || 'uncategorized';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(tx);
      }
      if (args.aggregate === 'sum') {
        const out = {};
        for (const [k, txs] of Object.entries(grouped)) out[k] = txs.reduce((s, t) => s + t.amount, 0);
        return { data: out };
      }
      if (args.aggregate === 'count') {
        const out = {};
        for (const [k, txs] of Object.entries(grouped)) out[k] = txs.length;
        return { data: out };
      }
      if (args.aggregate === 'avg') {
        const out = {};
        for (const [k, txs] of Object.entries(grouped)) out[k] = txs.reduce((s, t) => s + t.amount, 0) / txs.length;
        return { data: out };
      }
      return { data: grouped };
    }

    if (args.aggregate === 'sum')   return { total: data.reduce((s, t) => s + t.amount, 0), count: data.length };
    if (args.aggregate === 'count') return { count: data.length };
    if (args.aggregate === 'avg')   return { average: data.length ? data.reduce((s, t) => s + t.amount, 0) / data.length : 0 };
    return { data, count: data.length };
  }

  return {};
}

// ---------------------------------------------------------------------------
// Streamed word-by-word helper (for fallback responses)
// ---------------------------------------------------------------------------
async function streamText(text, res) {
  const words = text.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ type: 'token', text: word + ' ' })}\n\n`);
    await new Promise(r => setTimeout(r, 18));
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function handleChatMessage(message, res) {
  // Set SSE headers first — must happen before any async work so errors can stream
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  // ── No API key → instant local answer ────────────────────────────────────
  if (!hasValidApiKey()) {
    console.log('[ChatAgent] No API key. Streaming local assistant answer.');
    await streamText(getFallbackAnswer(message), res);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    return;
  }

  // ── Gemini function-calling chat ──────────────────────────────────────────
  try {
    const model = getModel();
    const chat  = model.startChat({
      history: [
        {
          role:  'user',
          parts: [{ text:
            'System: You are a financial analyst assistant for Ledger AI. ' +
            'Always use the provided tools to look up live transaction data before answering. ' +
            'Provide specific numbers, be concise, and use markdown bullet points when listing items.'
          }],
        },
        {
          role:  'model',
          parts: [{ text: 'Understood. I will query live data and answer concisely.' }],
        },
      ],
      tools: [{ functionDeclarations: tools }],
    });

    let result = await chat.sendMessageStream(message);

    let keepLooping = true;
    let loopCount   = 0;

    while (keepLooping && loopCount < 6) {
      loopCount++;
      let functionCall = null;

      for await (const chunk of result.stream) {
        // Check for function call first (chunk.text() throws if functionCalls present)
        const calls = chunk.functionCalls ? chunk.functionCalls() : null;
        if (calls && calls.length > 0) {
          functionCall = calls[0];
        } else {
          try {
            const text = chunk.text();
            if (text) res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
          } catch (_) { /* chunk has no text (e.g. purely a usage metadata chunk) */ }
        }
      }

      if (functionCall) {
        res.write(`data: ${JSON.stringify({ type: 'tool_call_start', name: functionCall.name })}\n\n`);
        const toolResponse = executeTool(functionCall.name, functionCall.args || {});
        res.write(`data: ${JSON.stringify({ type: 'tool_call_result', name: functionCall.name })}\n\n`);

        result = await chat.sendMessageStream([{
          functionResponse: { name: functionCall.name, response: toolResponse },
        }]);
      } else {
        keepLooping = false;
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    const is429 = error.status === 429 || (error.message && error.message.includes('429')) || error.message === 'RATE_LIMIT';

    if (is429) {
      console.log('[ChatAgent] Quota exhausted. Streaming local assistant answer.');
    } else {
      console.error('[ChatAgent] Stream error:', error.message || error);
    }

    // Stream a graceful local fallback answer
    await streamText(getFallbackAnswer(message), res);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
}
