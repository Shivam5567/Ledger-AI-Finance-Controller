import { updateTransaction, isDismissed } from '../db.js';

export function reconcileTransactions(transactions) {
  console.log(`[Reconciler] Reconciling ${transactions.length} transactions... (0 API calls — pure logic)`);
  
  // Sort transactions chronologically to identify which payment is the original vs duplicate
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const seenIncomeInvoices = new Set();

  for (const tx of sorted) {
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
          tx.anomaly_explanation = `Flagged: Income transaction of ₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${tx.description}) is missing an invoice reference.`;
          tx.match_status    = 'exception';
          tx.exception_type  = 'missing_invoice';
          tx.exception_reason = `Income transaction has no invoice reference — cannot verify payment source`;
        }
      }
    }

    // ── Duplicate invoice ref (subsequent payment re-using existing ref) ─────
    if (tx.type === 'income' && tx.invoice_ref && tx.invoice_ref.trim() !== '') {
      const ref = tx.invoice_ref.trim();
      if (seenIncomeInvoices.has(ref)) {
        if (isDismissed('duplicate_invoice', tx.description)) {
          tx.previously_dismissed = true;
        } else {
          flags.add('duplicate_invoice');
          flagsUpdated = true;
          tx.anomaly_explanation = `Flagged: Invoice reference ${ref} was already used on an earlier payment.`;
          tx.match_status    = 'exception';
          tx.exception_type  = 'duplicate_ref';
          tx.exception_reason = `Invoice ref ${ref} was already reconciled on a prior payment — possible duplicate billing`;
        }
      } else {
        seenIncomeInvoices.add(ref);
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
