import { updateTransaction } from '../db.js';
import { callGemini, hasValidApiKey } from '../utils/gemini.js';

// ---------------------------------------------------------------------------
// Template drafts (used when API is unavailable or quota is exhausted)
// ---------------------------------------------------------------------------
function makeReminderEmailDraft(tx) {
  return `Subject: Invoice Reference Required — Payment Received ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})

Hi Finance Team,

We recently received a payment of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} on ${tx.date} for "${tx.description}".

However, no invoice reference was provided with this payment. Could you please reply with the corresponding invoice number so we can properly reconcile this in our ledger?

Thank you,
Accounts Receivable Team`;
}

function makeRefundRequestDraft(tx) {
  const flagDetail = tx.flags.includes('duplicate_invoice')
    ? `Duplicate Invoice Ref (${tx.invoice_ref})`
    : 'Duplicate Charge';
  return `REFUND / DUPLICATE DISCREPANCY NOTE
─────────────────────────────────────
Transaction ID : ${tx.id}
Date           : ${tx.date}
Description    : ${tx.description}
Amount         : $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Flag           : ${flagDetail}

Recommended Action:
Contact vendor/client regarding the duplicate transaction and request a refund or
credit memo of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function generateActions(transactions) {
  console.log('[ActionAgent] Generating action drafts for flagged transactions…');

  const flagged = transactions.filter(t => t.flags && t.flags.length > 0);
  if (flagged.length === 0) return transactions;

  // Assign action_type and build fallback draft for each flagged transaction
  for (const tx of flagged) {
    if (!tx.action_type) {
      if (tx.flags.includes('unmatched_invoice')) {
        tx.action_type  = 'reminder_email';
      } else if (tx.flags.includes('duplicate') || tx.flags.includes('duplicate_invoice')) {
        tx.action_type  = 'refund_request';
      } else if (tx.flags.includes('anomaly')) {
        tx.action_type  = 'anomaly_explanation';
      }
    }

    // Pre-compute fallback drafts (used if AI call fails or is skipped)
    if (!tx._fallbackDraft) {
      if (tx.action_type === 'reminder_email') {
        tx._fallbackDraft = makeReminderEmailDraft(tx);
      } else if (tx.action_type === 'refund_request') {
        tx._fallbackDraft = makeRefundRequestDraft(tx);
      } else if (tx.action_type === 'anomaly_explanation') {
        tx._fallbackDraft = tx.anomaly_explanation ||
          `Anomaly Review Note: Charge of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ` +
          `for ${tx.description} on ${tx.date} exceeds the historical category baseline. Please verify authorization.`;
      }
    }
  }

  // ── AI batch draft generation ─────────────────────────────────────────────
  // Only generate for items that need an email/refund note AND don't already have a draft
  const needsDraft = flagged.filter(
    t => (t.action_type === 'reminder_email' || t.action_type === 'refund_request') && !t.action_draft
  );

  if (needsDraft.length > 0 && hasValidApiKey()) {
    const promptList = needsDraft
      .map(t =>
        `ID: ${t.id} | Type: ${t.action_type} | Desc: ${t.description} | ` +
        `Amount: $${t.amount} | Date: ${t.date}`
      )
      .join('\n');

    const prompt =
      `You are a finance assistant drafting professional communications.\n` +
      `For each transaction below, write a short professional email or internal note:\n` +
      `  - reminder_email → polite email to client requesting their invoice reference\n` +
      `  - refund_request → internal note to finance team requesting a refund/credit memo\n\n` +
      `Return ONLY a valid JSON array: [{"id": number, "draft": string}]\n\n` +
      `Transactions:\n${promptList}`;

    try {
      const results = await callGemini(prompt, { json: true });
      if (Array.isArray(results)) {
        for (const item of results) {
          const tx = needsDraft.find(t => t.id === item.id || t.id === Number(item.id));
          if (tx && item.draft) {
            tx.action_draft = item.draft.trim();
          }
        }
      }
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        console.log('[ActionAgent] Quota exhausted. Using template drafts.');
      } else if (err.message !== 'NO_KEY') {
        console.error('[ActionAgent] Gemini draft error, using templates:', err.message);
      }
    }
  }

  // Persist final state for all flagged items
  for (const tx of flagged) {
    if (!tx.action_draft) {
      tx.action_draft = tx._fallbackDraft;
    }
    delete tx._fallbackDraft;

    if (!tx.action_status || tx.action_status === 'none') {
      tx.action_status = 'pending';
    }

    updateTransaction(tx.id, {
      action_type:   tx.action_type,
      action_draft:  tx.action_draft,
      action_status: tx.action_status,
    });
  }

  return transactions;
}
