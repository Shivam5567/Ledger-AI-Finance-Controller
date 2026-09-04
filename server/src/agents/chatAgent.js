import { callLLM, callLLMStream, extractText, extractToolCalls, hasValidApiKey } from '../utils/llm.js';
import { getSummary, getAllTransactions, getTransactionsByFilter } from '../db.js';

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
      name: 'get_summary',
      description: 'Get the high-level financial summary: total income, total expenses, net position, flagged count, and spend by category.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ---------------------------------------------------------------------------
// Execute a tool call against the live SQLite DB
// ---------------------------------------------------------------------------
function executeTool(name, args) {
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (name === 'get_summary') {
    const s = getSummary();
    return {
      totalIncome:    fmt(s.totalIncome),
      totalExpenses:  fmt(s.totalExpenses),
      netPosition:    fmt(s.net),
      flaggedCount:   s.flaggedCount,
      byCategory:     (s.byCategory || []).map(c => ({ category: c.category, total: fmt(c.total) })),
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
  const q      = message.toLowerCase();
  const allTx  = getAllTransactions();
  const summary = getSummary();
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const expensesByCategory = (catName, keyword = '') =>
    allTx.filter(
      t => t.type === 'expense' &&
        ((t.category && t.category.toLowerCase().includes(catName)) ||
         (keyword && t.description.toLowerCase().includes(keyword)))
    );

  if (q.includes('payroll') || q.includes('salary') || q.includes('wages')) {
    const txs   = expensesByCategory('payroll', 'payroll');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Payroll total: **${fmt(total)}** across ${txs.length} payment cycles.`;
  }
  if (q.includes('cloud') || q.includes('aws') || q.includes('infra')) {
    const txs   = expensesByCategory('cloud/infra', 'aws');
    const total = txs.reduce((s, t) => s + t.amount, 0);
    return `Cloud/infra spend: **${fmt(total)}** across ${txs.length} transactions.`;
  }
  if (q.includes('duplicate') || q.includes('double')) {
    const dupes = allTx.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')));
    if (!dupes.length) return 'No duplicate payments detected.';
    const list = dupes.map(d => `- **${d.description}** (${fmt(d.amount)}) on ${d.date}`).join('\n');
    return `**${dupes.length} duplicate entries** detected:\n${list}`;
  }
  if (q.includes('biggest') || q.includes('largest') || q.includes('top')) {
    if (summary.byCategory?.length) {
      const top = summary.byCategory[0];
      return `Biggest expense category: **${top.category}** (${fmt(top.total)}).`;
    }
  }
  if (allTx.length === 0) {
    return 'No transaction data loaded yet. Please click **Load Transactions** and then **Run AI Agent** first.';
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
    await sendFallback(message);
  }
}
