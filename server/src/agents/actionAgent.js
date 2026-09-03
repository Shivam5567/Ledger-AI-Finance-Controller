import { updateTransaction } from '../db.js';
import { callGemini } from '../utils/gemini.js';

export async function generateActions(transactions) {
  console.log(`[ActionAgent] Generating action drafts for flagged transactions...`);
  
  const flagged = transactions.filter(t => t.flags && t.flags.length > 0);
  if (flagged.length === 0) return transactions;

  // Prepare metadata & fallback drafts per item
  for (const tx of flagged) {
    if (tx.flags.includes('unmatched_invoice')) {
      tx.action_type = 'reminder_email';
      tx.fallbackDraft = `Subject: Invoice Reference Required — Payment Received ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})

Hi Finance Team,

We recently received a payment of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} on ${tx.date} for "${tx.description}".

However, no invoice reference was provided. Could you please reply with the corresponding invoice number so we can properly reconcile this payment?

Thank you,
Accounts Receivable Team`;
    } else if (tx.flags.includes('duplicate') || tx.flags.includes('duplicate_invoice')) {
      tx.action_type = 'refund_request';
      tx.fallbackDraft = `REFUND / DUPLICATE DISCREPANCY NOTE:
----------------------------------------
Transaction ID: ${tx.id} | Date: ${tx.date}
Description: ${tx.description}
Amount: $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Flag: ${tx.flags.includes('duplicate_invoice') ? 'Duplicate Invoice Ref (' + tx.invoice_ref + ')' : 'Duplicate Charge'}

Recommended Action:
Contact vendor/client regarding duplicate transaction. Request a refund or credit memo of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
    } else if (tx.flags.includes('anomaly')) {
      tx.action_type = 'anomaly_explanation';
      tx.fallbackDraft = tx.anomaly_explanation || `Anomaly Review Note: Charge of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for ${tx.description} on ${tx.date} exceeds historical category baseline. Verify authorization.`;
    }
  }

  // Batch Gemini call for all action drafts
  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  if (hasApiKey) {
    const draftsToGenerate = flagged.filter(t => t.action_type === 'reminder_email' || t.action_type === 'refund_request');
    if (draftsToGenerate.length > 0) {
      const promptList = draftsToGenerate.map(t => 
        `ID: ${t.id} | Type: ${t.action_type} | Desc: ${t.description} | Amount: $${t.amount} | Date: ${t.date}`
      ).join('\n');

      const prompt = `
For each flagged transaction below, draft a short, professional email or internal note appropriate for its action type (reminder_email -> email to client, refund_request -> internal note asking for refund).
Return JSON array of objects: [{"id": number, "draft": string}]

Transactions:
${promptList}
`;

      try {
        const results = await callGemini(prompt, { json: true });
        if (Array.isArray(results)) {
          for (const item of results) {
            const tx = draftsToGenerate.find(t => t.id === item.id);
            if (tx && item.draft) {
              tx.action_draft = item.draft.trim();
            }
          }
        }
      } catch (err) {
        console.error("[ActionAgent] Batched Gemini call failed, using fallback templates:", err.message);
      }
    }
  }

  // Update DB for all flagged items
  for (const tx of flagged) {
    if (!tx.action_draft) {
      tx.action_draft = tx.fallbackDraft;
    }
    delete tx.fallbackDraft;

    tx.action_status = tx.action_status && tx.action_status !== 'none' ? tx.action_status : 'pending';
    updateTransaction(tx.id, {
      action_type: tx.action_type,
      action_draft: tx.action_draft,
      action_status: tx.action_status
    });
  }

  return transactions;
}
