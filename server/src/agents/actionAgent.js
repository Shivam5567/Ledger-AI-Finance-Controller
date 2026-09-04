import { updateTransaction } from '../db.js';
import { callLLM, extractText, safeParseJSON, hasValidApiKey } from '../utils/llm.js';

// ---------------------------------------------------------------------------
// Template drafts (used when API is unavailable or quota is exhausted)
// ---------------------------------------------------------------------------
function makeReminderEmailDraft(tx) {
  const amtFormatted = tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return `Subject: Payment Reminder — Invoice Required — ₹${amtFormatted}

Dear [Client/Finance Team],

We hope this message finds you well. Our records indicate we received a payment of ₹${amtFormatted} on ${tx.date} referencing "${tx.description}", however we were unable to match this to any outstanding invoice in our system.

To ensure accurate reconciliation, could you please:
  1. Share the invoice number or reference for this payment
  2. Confirm the period or service this payment covers

Once we receive this information, we will update our records immediately.

Best regards,
Finance & Accounts Team
Ledger AI Controller`;
}

function makeRefundRequestDraft(tx) {
  const flagDetail = tx.flags.includes('duplicate_invoice') ? 'duplicate_invoice' : 'duplicate';
  const amtFormatted = tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return `Subject: Duplicate Payment Detected — Refund Request

Hi Team,

Our automated reconciliation system has flagged a potential duplicate payment:

  Transaction: ${tx.description}
  Amount:      ₹${amtFormatted}
  Date:        ${tx.date}
  Flag:        ${flagDetail}

This charge appears to be a duplicate of a previous transaction. Please verify with the relevant vendor/client and initiate a refund or credit memo for ₹${amtFormatted} if confirmed.

Action required by: [3 business days from date]

Ledger AI — Automated Finance Controller`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function generateActions(transactions) {
  const flagged = transactions.filter(t => t.flags && t.flags.length > 0);
  if (flagged.length === 0) return transactions;

  // Assign action_type and pre-compute fallback drafts
  for (const tx of flagged) {
    if (!tx.action_type) {
      if (tx.flags.includes('unmatched_invoice')) {
        tx.action_type = 'reminder_email';
      } else if (tx.flags.includes('duplicate') || tx.flags.includes('duplicate_invoice')) {
        tx.action_type = 'refund_request';
      } else if (tx.flags.includes('anomaly')) {
        tx.action_type = 'anomaly_explanation';
      }
    }

    if (!tx._fallbackDraft) {
      if (tx.action_type === 'reminder_email') {
        tx._fallbackDraft = makeReminderEmailDraft(tx);
      } else if (tx.action_type === 'refund_request') {
        tx._fallbackDraft = makeRefundRequestDraft(tx);
      } else if (tx.action_type === 'anomaly_explanation') {
        const amtFormatted = tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        tx._fallbackDraft = `⚠️ SPEND ALERT — ${tx.description}
────────────────────────────────────────
Amount    : ₹${amtFormatted}
Date      : ${tx.date}
Category  : ${tx.category || 'N/A'}
Reason    : This charge exceeds the typical spend threshold for this category.

Recommended Action:
Verify this expense with the relevant budget owner before approving. If this is
a legitimate one-time cost, approve and add a note. If unexpected, investigate
further before processing payment.

Ledger AI — Automated Anomaly Detection`;
      }
    }
  }

  // ── Batch AI draft generation ────────────────────────────────────────────
  const needsDraft = flagged.filter(
    t => (t.action_type === 'reminder_email' || t.action_type === 'refund_request') && !t.action_draft
  );

  if (needsDraft.length > 0 && hasValidApiKey()) {
    console.log(`[ActionAgent] Running batched action drafts for ${needsDraft.length} flagged items (1 API call)...`);

    const promptList = JSON.stringify(needsDraft.map(t => ({
      id:          t.id,
      description: t.description,
      amount:      `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      flag_type:   t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice')
                     ? 'duplicate'
                     : 'unmatched_invoice',
      date:        t.date,
    })), null, 2);

    const prompt = `Write an action draft for each flagged transaction.
Use the flag_type to determine the draft format:
- duplicate → refund request note (internal)
- unmatched_invoice → payment reminder email (to client)

Include the actual description, amount (formatted in ₹ INR), and date in every draft.
Make it sound like a real finance team wrote it, not a template. Always use Indian Rupees (₹).

Flagged transactions:
${promptList}

Return ONLY a raw JSON array. No explanation, no markdown, no code fences:
[{"id": 3, "draft": "Subject: Duplicate Payment — ...\\n\\nHi Team,\\n..."}]`;

    try {
      const response = await callLLM(prompt, { model: 'smart' });
      const raw      = extractText(response);
      const results  = safeParseJSON(raw);
      if (Array.isArray(results)) {
        for (const item of results) {
          const tx = needsDraft.find(t => t.id === item.id || t.id === Number(item.id));
          if (tx && item.draft) tx.action_draft = item.draft.trim();
        }
      }
    } catch (err) {
      if (err.status === 429) console.log('[ActionAgent] Rate limit. Using template drafts.');
      else                    console.error('[ActionAgent] LLM draft error, using templates:', err.message);
    }
  }

  // Persist final state
  for (const tx of flagged) {
    if (!tx.action_draft) tx.action_draft = tx._fallbackDraft;
    delete tx._fallbackDraft;
    if (!tx.action_status || tx.action_status === 'none') tx.action_status = 'pending';
    updateTransaction(tx.id, {
      action_type:   tx.action_type,
      action_draft:  tx.action_draft,
      action_status: tx.action_status,
    });
  }

  return transactions;
}
