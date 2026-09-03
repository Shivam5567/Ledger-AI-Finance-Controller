import { getModel, shouldUseGemini } from '../utils/gemini.js';
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

  // Concept / Definition queries
  if (q.includes('what is a transaction') || q.includes('what is transaction') || q.includes('explain transaction') || q.includes('definition of transaction')) {
    return `A **transaction** is any financial activity where money moves into or out of your business account. In Ledger AI, each transaction has a date, description, amount, type (*income*, *expense*, or *refund*), category, and any associated invoice references.`;
  }

  if (q.includes('what is anomaly') || q.includes('explain anomaly') || q.includes('anomaly detection')) {
    return `An **anomaly** is an unusual or unexpected transaction—such as a sudden spending spike (e.g., an AWS charge 3.3x higher than your monthly average) or an unexpected large outflow. Ledger AI flags these automatically for review.`;
  }

  if (q.includes('what is reconciliation') || q.includes('explain reconciliation')) {
    return `**Reconciliation** is the process of matching bank payments against customer invoice references to ensure every dollar received corresponds to an issued bill, preventing unmatched income or lost payments.`;
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

  if (!shouldUseGemini()) {
    console.log("[ChatAgent] MOCK_AI active or API key unavailable, using local intelligent query assistant (0 API calls)...");
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
    const summary = getSummary();
    const allTx = getAllTransactions();
    
    // Provide recent flagged items summary in context
    const flaggedItems = allTx.filter(t => t.flags && t.flags.length > 0).map(t => 
      `${t.date}: ${t.description} ($${t.amount.toFixed(2)}) - Flags: ${JSON.stringify(t.flags)}`
    ).slice(0, 10).join('; ');

    const contextPrompt = `You are a financial analyst assistant for Ledger AI.
Current Financial Context:
- Total Income: $${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Total Expenses: $${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Net Position: $${summary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Flagged Items Count: ${summary.flaggedCount}
- Top Expense Breakdown: ${JSON.stringify(summary.byCategory || [])}
- Key Flagged Items: ${flaggedItems || 'None'}

User Question: ${message}

Answer the user's question accurately, concisely, and specifically using the numbers above. Format with markdown if helpful.`;

    const model = getModel();
    const result = await model.generateContentStream(contextPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
    if (isRateLimit) {
      console.log("[ChatAgent] Gemini rate limit reached (429), streaming local intelligent answer.");
    } else {
      console.error("[ChatAgent] Stream error:", error.message || error);
    }
    // Fallback to local QA answer on error
    const fallbackAnswer = getFallbackChatAnswer(message);
    res.write(`data: ${JSON.stringify({ type: 'token', text: fallbackAnswer })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
}
