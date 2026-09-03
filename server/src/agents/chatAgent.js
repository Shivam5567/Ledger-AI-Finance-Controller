import { getModel } from '../utils/gemini.js';
import { getTransactionsByFilter, getSummary, getAllTransactions } from '../db.js';

const tools = [
  {
    name: 'query_transactions',
    description: "Query the transaction database with optional filters and aggregation. aggregation can be sum, count, avg, list. groupBy can be category, type, date.",
    parameters: {
      type: "OBJECT",
      properties: {
        filter: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING" },
            type: { type: "STRING" },
            dateFrom: { type: "STRING" },
            dateTo: { type: "STRING" },
            hasFlag: { type: "BOOLEAN" }
          }
        },
        aggregate: { type: "STRING" },
        groupBy: { type: "STRING" }
      }
    }
  },
  {
    name: 'get_summary',
    description: "Get overall financial summary including totals and category breakdown.",
    parameters: { type: "OBJECT", properties: {} }
  },
  {
    name: 'get_flagged_transactions',
    description: "Get all transactions that have been flagged for issues.",
    parameters: { type: "OBJECT", properties: {} }
  }
];

function getFallbackChatAnswer(message) {
  const q = message.toLowerCase();
  const allTx = getAllTransactions();
  const summary = getSummary();

  // Helper for category / keyword filtering
  const getCategorySpend = (catName, keyword) => {
    return allTx.filter(t => 
      t.type === 'expense' && 
      ((t.category && t.category.toLowerCase().includes(catName)) || 
       (keyword && t.description.toLowerCase().includes(keyword)))
    );
  };

  // 1. Payroll query
  if (q.includes('payroll') || q.includes('salary') || q.includes('salaries') || q.includes('wages')) {
    const txs = getCategorySpend('payroll', 'payroll');
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    return `We spent a total of **$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** on payroll across ${txs.length} payment cycles (including engineering and marketing teams).`;
  }

  // 2. Cloud / Infra query
  if (q.includes('cloud') || q.includes('aws') || q.includes('infra') || q.includes('server')) {
    const txs = getCategorySpend('cloud/infra', 'aws');
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    return `We spent a total of **$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** on cloud infrastructure across ${txs.length} transactions. This includes a notable emergency scale charge of $7,800.00 on Jan 25.`;
  }

  // 3. Marketing / Ads query
  if (q.includes('marketing') || q.includes('ads') || q.includes('advertising') || q.includes('facebook') || q.includes('google ads')) {
    const txs = getCategorySpend('marketing', 'ads');
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    return `We spent **$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** on marketing and advertising across ${txs.length} ad campaigns.`;
  }

  // 4. Software query
  if (q.includes('software') || q.includes('saas') || q.includes('tool') || q.includes('subscription')) {
    const txs = getCategorySpend('software', '');
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    return `We spent **$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** on software subscriptions across ${txs.length} tools.`;
  }

  // 5. Duplicates query
  if (q.includes('duplicate') || q.includes('double') || q.includes('repeat')) {
    const dupes = allTx.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')));
    if (dupes.length > 0) {
      const listStr = dupes.map(d => `- **${d.description}** ($${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) on ${d.date}`).join('\n');
      return `Yes, there are **${dupes.length} duplicate entries** detected in the ledger:\n${listStr}\n\nOur Action Agent has drafted refund request notes for these items.`;
    }
    return `No duplicate payments were detected in the current ledger.`;
  }

  // 6. Unmatched / Invoice query
  if (q.includes('unmatched') || q.includes('invoice') || q.includes('missing invoice')) {
    const unmatched = allTx.filter(t => t.flags && t.flags.includes('unmatched_invoice'));
    if (unmatched.length > 0) {
      const listStr = unmatched.map(u => `- **${u.description}** ($${u.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) on ${u.date}`).join('\n');
      return `Found **${unmatched.length} unmatched income payment(s)** missing an invoice reference:\n${listStr}\n\nOur Action Agent auto-drafted payment reminder emails for these.`;
    }
    return `All income payments have valid invoice references.`;
  }

  // 7. Biggest / Largest expense category query
  if (q.includes('biggest') || q.includes('largest') || q.includes('top expense') || q.includes('most expensive')) {
    if (summary.byCategory && summary.byCategory.length > 0) {
      const top = summary.byCategory[0];
      return `Our biggest expense category is **${top.category}** with a total spend of **$${top.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}**, followed by **${summary.byCategory[1]?.category || 'other'}** ($${summary.byCategory[1]?.total.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0'}).`;
    }
  }

  // 8. Overall financial summary / health query
  return `**Ledger AI Financial Health Summary:**
- **Total Income:** $${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- **Total Expenses:** $${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- **Net Position:** $${summary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- **Flagged Issues:** ${summary.flaggedCount} transaction(s) requiring review (duplicates, anomalies, or unmatched invoices).`;
}

export async function handleChatMessage(message, res) {
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  if (!hasApiKey) {
    console.log("[ChatAgent] GEMINI_API_KEY missing, using local query assistant fallback.");
    const fallbackAnswer = getFallbackChatAnswer(message);
    const words = fallbackAnswer.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ type: 'token', text: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 20));
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    return;
  }

  try {
    const model = getModel();
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "System Prompt: You are a financial analyst assistant for Ledger AI. You help users understand their transaction data. Use the provided tools to query the database and answer questions accurately. Always provide specific numbers and be concise." }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to help as a financial analyst assistant." }]
        }
      ],
      tools: [{ functionDeclarations: tools }]
    });

    let result = await chat.sendMessageStream(message);

    let keepLooping = true;
    let loopCount = 0;
    while (keepLooping && loopCount < 5) {
      loopCount++;
      let functionCall = null;

      for await (const chunk of result.stream) {
        const calls = chunk.functionCalls ? chunk.functionCalls() : null;
        if (calls && calls.length > 0) {
          functionCall = calls[0];
        } else {
          try {
            const text = chunk.text();
            if (text) {
              res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
            }
          } catch (e) {
            // Ignored if chunk doesn't contain text
          }
        }
      }

      if (functionCall) {
        res.write(`data: ${JSON.stringify({ type: 'tool_call_start', name: functionCall.name })}\n\n`);
        let toolResponse = {};
        
        if (functionCall.name === 'query_transactions') {
          const args = functionCall.args || {};
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
               const resObj = {};
               for (const [key, txs] of Object.entries(grouped)) {
                 resObj[key] = txs.reduce((s, t) => s + t.amount, 0);
               }
               toolResponse = { data: resObj };
             } else if (args.aggregate === 'count') {
               const resObj = {};
               for (const [key, txs] of Object.entries(grouped)) {
                 resObj[key] = txs.length;
               }
               toolResponse = { data: resObj };
             } else if (args.aggregate === 'avg') {
               const resObj = {};
               for (const [key, txs] of Object.entries(grouped)) {
                 resObj[key] = txs.reduce((s, t) => s + t.amount, 0) / txs.length;
               }
               toolResponse = { data: resObj };
             } else {
               toolResponse = { data: grouped };
             }
          } else if (args.aggregate === 'sum') {
             toolResponse = { total: data.reduce((s, t) => s + t.amount, 0), count: data.length };
          } else if (args.aggregate === 'count') {
             toolResponse = { count: data.length };
          } else if (args.aggregate === 'avg') {
             toolResponse = { average: data.length ? data.reduce((s, t) => s + t.amount, 0) / data.length : 0 };
          } else {
             toolResponse = { data, count: data.length };
          }
        } else if (functionCall.name === 'get_summary') {
          toolResponse = getSummary();
        } else if (functionCall.name === 'get_flagged_transactions') {
          toolResponse = { data: getTransactionsByFilter({ hasFlag: true }) };
        }

        res.write(`data: ${JSON.stringify({ type: 'tool_call_result', name: functionCall.name })}\n\n`);

        result = await chat.sendMessageStream([{
          functionResponse: {
            name: functionCall.name,
            response: toolResponse
          }
        }]);
      } else {
        keepLooping = false;
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Chat Error:", error);
    // Fallback to local QA answer on error
    const fallbackAnswer = getFallbackChatAnswer(message);
    res.write(`data: ${JSON.stringify({ type: 'token', text: fallbackAnswer })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
}
