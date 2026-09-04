import { updateTransaction, isDismissed } from '../db.js';

export function reconcileTransactions(transactions) {
  console.log(`[Reconciler] Reconciling ${transactions.length} transactions... (0 API calls — pure logic)`);
  const invoiceCounts = {};
  
  for (const tx of transactions) {
    if (tx.invoice_ref) {
      invoiceCounts[tx.invoice_ref] = (invoiceCounts[tx.invoice_ref] || 0) + 1;
    }
  }

  for (const tx of transactions) {
    let flagsUpdated = false;
    const flags = new Set(tx.flags || []);

    // ── Missing invoice ref on income ───────────────────────────────────────
    if (tx.type === 'income' || tx.category === 'client_income') {
      if (!tx.invoice_ref || tx.invoice_ref.trim() === '') {
        if (isDismissed('unmatched_invoice', tx.description)) {
          tx.previously_dismissed = true;
        } else {
          flags.add('unmatched_invoice');
          flagsUpdated = true;
          tx.anomaly_explanation = `Flagged: Income transaction of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${tx.description}) is missing an invoice reference.`;
          tx.match_status    = 'exception';
          tx.exception_type  = 'missing_invoice';
          tx.exception_reason = `Income transaction has no invoice reference — cannot verify payment source`;
        }
      }
    }

    // ── Duplicate invoice ref ───────────────────────────────────────────────
    if (tx.invoice_ref && invoiceCounts[tx.invoice_ref] > 1) {
      if (isDismissed('duplicate_invoice', tx.description)) {
        tx.previously_dismissed = true;
      } else {
        flags.add('duplicate_invoice');
        flagsUpdated = true;
        tx.anomaly_explanation = `Flagged: Invoice reference ${tx.invoice_ref} appears on multiple transactions.`;
        tx.match_status    = 'exception';
        tx.exception_type  = 'duplicate_ref';
        tx.exception_reason = `Invoice ref ${tx.invoice_ref} appears on multiple transactions — possible duplicate billing`;
      }
    }

    if (flagsUpdated) {
      tx.flags = Array.from(flags);
      tx.confidence = 'high';
      updateTransaction(tx.id, {
        flags:              tx.flags,
        confidence:         'high',
        anomaly_explanation: tx.anomaly_explanation,
        match_status:       tx.match_status,
        exception_type:     tx.exception_type,
        exception_reason:   tx.exception_reason,
      });
    }
  }

  return transactions;
}
