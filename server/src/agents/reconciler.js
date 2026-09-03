import { updateTransaction } from '../db.js';

export function reconcileTransactions(transactions) {
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

    // Rule 1: unmatched_invoice
    if (tx.type === 'income' || tx.category === 'client_income') {
      if (!tx.invoice_ref || tx.invoice_ref.trim() === '') {
        flags.add('unmatched_invoice');
        flagsUpdated = true;
      }
    }

    // Rule 2: duplicate_invoice
    if (tx.invoice_ref && invoiceCounts[tx.invoice_ref] > 1) {
      flags.add('duplicate_invoice');
      flagsUpdated = true;
    }

    if (flagsUpdated) {
      tx.flags = Array.from(flags);
      updateTransaction(tx.id, { flags: tx.flags });
    }
  }

  return transactions;
}
