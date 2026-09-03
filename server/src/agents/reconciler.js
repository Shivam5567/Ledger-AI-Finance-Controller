import { updateTransaction } from '../db.js';

export function reconcileTransactions(transactions) {
  console.log(`[Reconciler] Reconciling ${transactions.length} transactions...`);
  const invoiceCounts = {};
  
  // Count invoice occurrences
  for (const tx of transactions) {
    if (tx.invoice_ref) {
      invoiceCounts[tx.invoice_ref] = (invoiceCounts[tx.invoice_ref] || 0) + 1;
    }
  }

  for (const tx of transactions) {
    let flagsUpdated = false;
    const flags = new Set(tx.flags || []);

    // Rule 1: unmatched_invoice (income transactions without an invoice_ref)
    if (tx.type === 'income' || tx.category === 'client_income') {
      if (!tx.invoice_ref || tx.invoice_ref.trim() === '') {
        flags.add('unmatched_invoice');
        flagsUpdated = true;
        if (!tx.anomaly_explanation) {
          tx.anomaly_explanation = `Flagged: Income transaction of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${tx.description}) is missing an invoice reference.`;
        }
      }
    }

    // Rule 2: duplicate_invoice
    if (tx.invoice_ref && invoiceCounts[tx.invoice_ref] > 1) {
      flags.add('duplicate_invoice');
      flagsUpdated = true;
      if (!tx.anomaly_explanation) {
        tx.anomaly_explanation = `Flagged: Invoice reference ${tx.invoice_ref} appears on multiple transactions.`;
      }
    }

    if (flagsUpdated) {
      tx.flags = Array.from(flags);
      updateTransaction(tx.id, { flags: tx.flags, anomaly_explanation: tx.anomaly_explanation });
    }
  }

  return transactions;
}
