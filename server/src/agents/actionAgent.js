import { updateTransaction } from '../db.js';
import { callGemini } from '../utils/gemini.js';

export async function generateActions(transactions) {
  console.log(`[ActionAgent] Generating action drafts for flagged transactions...`);
  
  for (const tx of transactions) {
    if (!tx.flags || tx.flags.length === 0) continue;

    let action_type = null;
    let action_draft = null;

    if (tx.flags.includes('unmatched_invoice')) {
      action_type = 'reminder_email';
      const fallbackDraft = `Subject: Invoice Reference Required — Payment Received ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})

Hi Finance Team,

We recently received a payment of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} on ${tx.date} with description "${tx.description}".

However, no invoice reference was provided with this remittance. Could you please reply with the corresponding invoice number so we can properly reconcile this payment against your account?

Thank you,
Accounts Receivable Team`;

      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        const prompt = `
Draft a professional payment reminder email asking the client to provide the invoice reference for their recent payment.
Payment Details:
Date: ${tx.date}
Amount: $${tx.amount}
Description: ${tx.description}
Keep it short, professional, and clear.
`;
        try {
          action_draft = await callGemini(prompt);
        } catch (e) {
          console.error("[ActionAgent] Failed to generate reminder email with Gemini, using template:", e.message);
          action_draft = fallbackDraft;
        }
      } else {
        action_draft = fallbackDraft;
      }

    } else if (tx.flags.includes('duplicate') || tx.flags.includes('duplicate_invoice')) {
      action_type = 'refund_request';
      const fallbackDraft = `REFUND / DUPLICATE DISCREPANCY NOTE:
----------------------------------------
Transaction ID: ${tx.id}
Date: ${tx.date}
Description: ${tx.description}
Amount: $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Flag: ${tx.flags.includes('duplicate_invoice') ? 'Duplicate Invoice Ref (' + tx.invoice_ref + ')' : 'Duplicate Charge Detected'}

Recommended Action:
Contact vendor/client regarding potential double-billing or duplicate payout. Request a refund or credit memo of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for the duplicate entry.`;

      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        const prompt = `
Draft a brief internal refund request note for investigating a duplicate transaction.
Transaction: ${tx.description} for $${tx.amount} on ${tx.date}.
Include recommended next steps.
`;
        try {
          action_draft = await callGemini(prompt);
        } catch (e) {
          console.error("[ActionAgent] Failed to generate refund request with Gemini, using template:", e.message);
          action_draft = fallbackDraft;
        }
      } else {
        action_draft = fallbackDraft;
      }

    } else if (tx.flags.includes('anomaly')) {
      action_type = 'anomaly_explanation';
      action_draft = tx.anomaly_explanation || `Anomaly Review Note: This charge of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for ${tx.description} on ${tx.date} significantly exceeds typical historical spending for this category. Please verify authorization and billing details.`;
    }

    if (action_type) {
      tx.action_type = action_type;
      tx.action_draft = action_draft;
      tx.action_status = tx.action_status && tx.action_status !== 'none' ? tx.action_status : 'pending';
      
      updateTransaction(tx.id, {
        action_type: tx.action_type,
        action_draft: tx.action_draft,
        action_status: tx.action_status
      });
    }
  }

  return transactions;
}
