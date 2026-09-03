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

export async function handleChatMessage(message, res) {
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

  try {
    let result = await chat.sendMessageStream(message);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let keepLooping = true;
    while (keepLooping) {
      let functionCall = null;
      let textBuffer = "";

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          textBuffer += text;
          res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
        }
        const call = chunk.functionCalls()?.[0];
        if (call) {
          functionCall = call;
        }
      }

      if (functionCall) {
        res.write(`data: ${JSON.stringify({ type: 'tool_call_start', name: functionCall.name })}\n\n`);
        let toolResponse = {};
        
        if (functionCall.name === 'query_transactions') {
          const args = functionCall.args;
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
               const result = {};
               for (const [key, txs] of Object.entries(grouped)) {
                 result[key] = txs.reduce((s, t) => s + t.amount, 0);
               }
               toolResponse = { data: result };
             } else if (args.aggregate === 'count') {
               const result = {};
               for (const [key, txs] of Object.entries(grouped)) {
                 result[key] = txs.length;
               }
               toolResponse = { data: result };
             } else if (args.aggregate === 'avg') {
               const result = {};
               for (const [key, txs] of Object.entries(grouped)) {
                 result[key] = txs.reduce((s, t) => s + t.amount, 0) / txs.length;
               }
               toolResponse = { data: result };
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
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}
