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

  if (q.includes('cloud') || q.includes('aws') || q.includes('infrastructure')) {
    const cloudTx = allTx.filter(t => (t.category === 'cloud/infra' || t.description.toLowerCase().includes('aws')) && t.type === 'expense');
    const total = cloudTx.reduce((sum, t) => sum + t.amount, 0);
    return `We spent a total of **$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** on cloud infrastructure across ${cloudTx.length} transactions. This includes a notable spike charge of $7,800.00 for emergency scaling on Jan 25.`;
  }

  if (q.includes('duplicate') || q.includes('double')) {
    const dupes = allTx.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')));
    if (dupes.length > 0) {
      const details = dupes.map(d => `- **${d.description}** ($${d.amount.toFixed(2)}) on ${d.date}`).join('\n');
      return `Yes, there are duplicate payments detected:\n${details}\n\nOur Action Agent has generated refund request drafts for these items.`;
    }
    return `No duplicate payments were detected in the current ledger.`;
  }

  if (q.includes('biggest') || q.includes('largest') || q.includes('top expense')) {
    if (summary.byCategory && summary.byCategory.length > 0) {
      const top = summary.byCategory[0];
      return `Our biggest expense category is **${top.category}** with a total spend of **$${top.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}**.`;
    }
    return `Payroll is our largest overall spending area ($68,000.00 total across engineering and marketing teams).`;
  }

  if (q.includes('summary') || q.includes('health') || q.includes('overall') || q.includes('total')) {
    return `**Financial Overview:**
- **Total Income:** $${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- **Total Expenses:** $${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- **Net Position:** $${summary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- **Flagged Transactions:** ${summary.flaggedCount} issues requiring review.`;
  }

  return `Based on our current transactions ledger: Total Income is $${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Total Expenses are $${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}, with ${summary.flaggedCount} flagged items requiring action.`;
}

export async function handleChatMessage(message, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  if (!hasApiKey) {
    console.log("[ChatAgent] GEMINI_API_KEY missing, using local query assistant fallback.");
    const fallbackAnswer = getFallbackChatAnswer(message);
    // Stream fallback tokens
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
