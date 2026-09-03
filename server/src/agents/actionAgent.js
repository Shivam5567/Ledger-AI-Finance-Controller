import { updateTransaction } from '../db.js';
import { callGemini } from '../utils/gemini.js';

export async function generateActions(transactions) {
  for (const tx of transactions) {
    if (!tx.flags || tx.flags.length === 0) continue;

    let action_type = null;
    let action_draft = null;

    if (tx.flags.includes('unmatched_invoice')) {
      action_type = 'reminder_email';
      const prompt = `
Draft a professional payment reminder email asking the client to provide the invoice reference for their recent payment.
Payment Details:
Date: ${tx.date}
Amount: $${tx.amount}
Description: ${tx.description}
Keep it short and polite.
      `;
      try {
        action_draft = await callGemini(prompt);
      } catch (e) {
        console.error("Failed to generate reminder email:", e);
      }
    } else if (tx.flags.includes('duplicate') || tx.flags.includes('duplicate_invoice')) {
      action_type = 'refund_request';
      const prompt = `
Draft a brief internal note or request to process a refund or investigate a duplicate transaction.
Transaction: ${tx.description} for $${tx.amount} on ${tx.date}.
      `;
      try {
        action_draft = await callGemini(prompt);
      } catch (e) {
        console.error("Failed to generate refund request:", e);
      }
    } else if (tx.flags.includes('anomaly')) {
      action_type = 'anomaly_explanation';
      action_draft = tx.anomaly_explanation;
    }

    if (action_type) {
      tx.action_type = action_type;
      tx.action_draft = action_draft;
      tx.action_status = 'pending';
      
      updateTransaction(tx.id, {
        action_type: tx.action_type,
        action_draft: tx.action_draft,
        action_status: tx.action_status
      });
    }
  }

  return transactions;
}
