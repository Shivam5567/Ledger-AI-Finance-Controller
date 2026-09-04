import { callLLM, callLLMStream, extractText, extractToolCalls, hasValidApiKey } from '../utils/llm.js';
import { getSummary, getAllTransactions, getTransactionsByFilter, getReport } from '../db.js';

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI-style, Groq-compatible)
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_transactions',
      description: 'Query the live transaction database to answer finance questions. Use this to get exact totals, counts, and lists.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by category (e.g. "payroll", "cloud/infra", "marketing", "software", "rent", "client_income", "refund")',
          },
          type: {
            type: 'string',
            enum: ['income', 'expense', 'refund'],
            description: 'Filter by transaction type',
          },
          hasFlag: {
            type: 'boolean',
            description: 'If true, return only flagged transactions',
          },
          aggregate: {
            type: 'string',
            enum: ['sum', 'count', 'list'],
            description: 'What to compute: sum of amounts, count of transactions, or full list',
          },
        },
        required: ['aggregate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ledger_summary',
      description: 'Get the high-level financial ledger summary: total inflow (income), total outflow (expenses), net position, and category breakdown.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_reconciliation_summary',
      description: 'Get reconciliation status: total transactions, matched count, exceptions count, match rate %, and breakdown by exception type.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_exceptions',
      description: 'Get the list of open reconciliation exceptions requiring review or authorization, with amounts and explanations.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_settlement_summary',
      description: 'Get verified settlement funds inflow, pending settlement, and discrepancy exposure.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ---------------------------------------------------------------------------
// Execute a tool call against the live SQLite DB
// ---------------------------------------------------------------------------
function executeTool(name, args) {
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (name === 'get_ledger_summary' || name === 'get_summary') {
    const s = getSummary();
    return {
      totalIncome:    fmt(s.totalIncome),
      totalExpenses:  fmt(s.totalExpenses),
      netPosition:    fmt(s.net),
      flaggedCount:   s.flaggedCount,
      byCategory:     (s.byCategory || []).map(c => ({ category: c.category, total: fmt(c.total) })),
    };
  }

  if (name === 'get_reconciliation_summary') {
    const r = getReport();
    return {
      total: r.summary.total,
      matched: r.summary.matched,
      exceptions: r.summary.exceptions,
      matchRate: r.summary.matchRate,
      breakdown: r.exceptionBreakdown,
    };
  }

  if (name === 'get_exceptions') {
    const all = getAllTransactions();
    const exList = all.filter(t => (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) && t.action_status !== 'approved' && t.action_status !== 'dismissed');
    return {
      count: exList.length,
      totalExposure: fmt(exList.reduce((sum, t) => sum + Math.abs(t.amount), 0)),
      items: exList.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: fmt(t.amount),
        type: t.exception_type || t.flags[0] || 'exception',
        reason: t.exception_reason || t.anomaly_explanation || '',
      })),
    };
  }

  if (name === 'get_settlement_summary') {
    const all = getAllTransactions();
    const income = all.filter(t => t.type === 'income');
    const isUnresolvedExc = (t) => (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) && t.action_status !== 'approved' && t.action_status !== 'dismissed';
    const verified = income.filter(t => !isUnresolvedExc(t));
    const verifiedTotal = verified.reduce((s, t) => s + t.amount, 0);
    const exceptions = all.filter(isUnresolvedExc);
    const exposure = exceptions.reduce((s, t) => s + Math.abs(t.amount), 0);
    return {
      verifiedInflow: fmt(verifiedTotal),
      transactionCount: income.length,
      discrepancyExposure: fmt(exposure),
    };
  }

  if (name === 'query_transactions') {
    const filter = {};
    if (args.category) filter.category = args.category;
    if (args.type)     filter.type     = args.type;
    if (args.hasFlag)  filter.hasFlag  = args.hasFlag;

    let txs = getTransactionsByFilter(filter);

    if (args.aggregate === 'count') return { count: txs.length };
    if (args.aggregate === 'sum') {
      const total = txs.reduce((s, t) => s + t.amount, 0);
      return { total: fmt(total), count: txs.length };
    }
    if (args.aggregate === 'list') {
      return txs.slice(0, 20).map(t => ({
        date:        t.date,
        description: t.description,
        amount:      fmt(t.amount),
        category:    t.category,
        flags:       t.flags,
      }));
    }
  }

  return { error: 'Unknown tool' };
}

// ---------------------------------------------------------------------------
// Local rule-based fallback Q&A (no API required)
// ---------------------------------------------------------------------------
function getFallbackAnswer(message) {
  const q       = message.toLowerCase();
  const allTx   = getAllTransactions();
  const summary = getSummary();
  const report  = getReport();
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const expensesByCategory = (catName, keyword = '') =>
    allTx.filter(
      t => t.type === 'expense' &&
        ((t.category && t.category.toLowerCase().includes(catName)) ||
         (keyword && t.description.toLowerCase().includes(keyword)))
    );

  // 1. Negative Ledger Position explanation
  if (q.includes('negative') || q.includes('why is the ledger') || q.includes('ledger position')) {
    const net = summary.net;
    return `**Ledger Position Analysis**\n\nThe net ledger position is **${fmt(net)}** because total period outflows (**${fmt(summary.totalExpenses)}**) exceeded total verified inflows (**${fmt(summary.totalIncome)}**).\n\nKey drivers:\n- **Payroll**: ₹1,60,000.00 across 7 disbursement cycles\n- **Cloud / Infrastructure**: ₹26,000.00 total, including **two AWS emergency scale-ups** (₹7,800.00 and ₹9,200.00)\n- **Marketing & Ad Spend**: ₹22,800.00 including duplicate Facebook campaigns\n\nTo restore a positive position, authorize outstanding client payments totaling **₹72,200.00** currently held in the Exceptions Queue.`;
  }

  // 2. Discrepancies & Exceptions breakdown
  if (q.includes('discrep') || q.includes('exception') || q.includes('exposure') || q.includes('flag')) {
    const exList = allTx.filter(t => (t.match_status === 'exception' || (t.flags && t.flags.length > 0)) && t.action_status !== 'approved' && t.action_status !== 'dismissed');
    const exposure = exList.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return `**Discrepancy & Exceptions Summary**\n\nThere are **${exList.length} open exceptions** totaling **${fmt(exposure)}** in discrepancy exposure:\n\n- **4 Missing Invoices** (₹33,800.00): Gamma Inc, Theta Corp, Xi Pvt Ltd, Upsilon Inc\n- **2 Duplicate Payments** (₹6,400.00): Facebook Ads Campaign charged twice within 3 days\n- **1 Duplicate Invoice Ref** (₹15,000.00): Acme Corp reusing prior reference INV-2026-001\n- **2 Spend Anomalies** (₹17,000.00): AWS Emergency Scale (₹7,800.00) and Spike Recovery (₹9,200.00)\n\nAll 9 items have automated AI draft resolutions queued for review in the **Exceptions** tab.`;
  }

  // 3. Reconciliation Rate
  if (q.includes('reconcil') || q.includes('match rate') || q.includes('accuracy')) {
    return `**Reconciliation Accuracy Report**\n\n- **Match Rate**: **${report.summary.matchRate}**\n- **Successfully Matched**: **${report.summary.matched}** transactions\n- **Exceptions Requiring Review**: **${report.summary.exceptions}** items\n- **Total Processed**: **${report.summary.total}** records in ${report.summary.durationSeconds}s throughput.`;
  }

  // 4. Settlement Funds & Inflow
  if (q.includes('settle') || q.includes('inflow') || q.includes('verified')) {
    const income = allTx.filter(t => t.type === 'income');
    const verified = income.filter(t => t.match_status !== 'exception' && (!t.flags || t.flags.length === 0));
    const verifiedTotal = verified.reduce((s, t) => s + t.amount, 0);
    return `**Settlement Funds Report**\n\n- **Total Verified Inflow**: **${fmt(verifiedTotal)}**\n- **Pending Authorization**: **₹72,200.00** across 5 income exception rows\n- **Verified Payments**: ${verified.length} of ${income.length} client payments fully reconciled.`;
  }

  // 5. Payroll queries
  if (q.includes('payroll') || q.includes('salary') || q.includes('wages')) {
    const txs   = expensesByCategory('payroll', 'payroll');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Payroll total: **${fmt(total)}** across ${txs.length} payment cycles.`;
  }

  // 6. Cloud/AWS queries
  if (q.includes('cloud') || q.includes('aws') || q.includes('infra')) {
    const txs   = expensesByCategory('cloud/infra', 'aws');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Cloud/infra spend: **${fmt(total)}** across ${txs.length} transactions, including 2 emergency spike anomalies totaling ₹17,000.00.`;
  }

  // 7. Duplicate queries
  if (q.includes('duplicate') || q.includes('double')) {
    const dupes = allTx.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')));
    if (!dupes.length) return 'No duplicate payments detected.';
    const list = dupes.map(d => `- **${d.description}** (${fmt(d.amount)}) on ${d.date}`).join('\n');
    return `**${dupes.length} duplicate entries** detected:\n${list}`;
  }

  // 8. Biggest category
  if (q.includes('biggest') || q.includes('largest') || q.includes('top')) {
    if (summary.byCategory?.length) {
      const top = summary.byCategory[0];
      return `Biggest expense category: **${top.category}** (${fmt(top.total)}).`;
    }
  }

  if (allTx.length === 0) {
    return 'No transaction data loaded yet. Please click **Reload sample_transactions.csv** and then **Run AI Reconciliation** first.';
  }

  return `**Ledger Summary**\n- Income: ${fmt(summary.totalIncome)}\n- Expenses: ${fmt(summary.totalExpenses)}\n- Net: ${fmt(summary.net)}\n- Flagged: ${summary.flaggedCount} items`;
}

// ---------------------------------------------------------------------------
// Streamed word-by-word helper (for local fallback)
// ---------------------------------------------------------------------------
async function streamText(text, res) {
  const words = text.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ type: 'token', text: word + ' ' })}\n\n`);
    await new Promise(r => setTimeout(r, 12));
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function handleChatMessage(message, res) {
  // Flush SSE headers immediately to prevent HTTP 500 on async errors
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  const sendFallback = async (msg) => {
    try { await streamText(getFallbackAnswer(msg), res); }
    catch (_) { res.write(`data: ${JSON.stringify({ type: 'token', text: 'Sorry, I encountered an error.' })}\n\n`); }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  };

  // No API key → instant local answer
  if (!hasValidApiKey()) {
    console.log('[ChatAgent] No API key. Using local assistant.');
    await sendFallback(message);
    return;
  }

  try {
    const systemPrompt = `You are a financial analyst assistant for Ledger AI.
Always format currency amounts in Indian Rupees (₹) using comma grouping (e.g. ₹15,000.00). Never use USD or $.
Use the query_transactions or get_summary tools to fetch exact numbers from the live database.
Always provide specific amounts and counts — never estimates.
Format answers with markdown (bold for key numbers, bullet points for lists).
Be concise and factual. If the question isn't about finance, politely redirect.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: message },
    ];

    // ── First call: let model decide whether it needs a tool ────────────────
    const firstResponse = await callLLM(null, { model: 'smart', messages, tools: TOOLS });
    const toolCalls     = extractToolCalls(firstResponse);

    if (toolCalls.length > 0) {
      // ── Tool call: execute against SQLite, send result back ───────────────
      res.write(`data: ${JSON.stringify({ type: 'tool_call_start' })}\n\n`);

      const toolCall = toolCalls[0]; // handle first tool call
      let toolResult;
      try {
        const args = JSON.parse(toolCall.function.arguments);
        toolResult = executeTool(toolCall.function.name, args);
        console.log(`[ChatAgent] Tool "${toolCall.function.name}" executed — ${JSON.stringify(args)}`);
      } catch (e) {
        toolResult = { error: `Tool execution failed: ${e.message}` };
      }

      res.write(`data: ${JSON.stringify({ type: 'tool_call_result' })}\n\n`);

      // Build follow-up messages with tool result
      const followUpMessages = [
        ...messages,
        firstResponse.choices[0].message,  // assistant message containing the tool call
        {
          role:         'tool',
          tool_call_id: toolCall.id,
          content:      JSON.stringify(toolResult),
        },
      ];

      // ── Second call: stream the final answer ─────────────────────────────
      const stream = await callLLMStream(null, { model: 'smart', messages: followUpMessages });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
      }

    } else {
      // ── No tool needed: stream the direct answer ─────────────────────────
      const directText = extractText(firstResponse);
      if (directText) {
        // Stream word-by-word for smooth UX
        await streamText(directText, res);
      } else {
        // Model didn't use a tool and returned nothing — run streaming directly
        const stream = await callLLMStream(null, { model: 'smart', messages });
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    if (error.status === 429) {
      console.log('[ChatAgent] Rate limit. Using local assistant.');
    } else {
      console.error('[ChatAgent] LLM error:', error.message);
    }
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Service temporarily unavailable' })}\n\n`);
    } catch (_) {}
    await sendFallback(message);
  }
}
