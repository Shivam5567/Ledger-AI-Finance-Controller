import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('ledger.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    invoice_ref TEXT,
    category TEXT,
    flags TEXT DEFAULT '[]',
    anomaly_explanation TEXT,
    action_draft TEXT,
    action_type TEXT,
    action_status TEXT DEFAULT 'none'
  );
`);

export function getAllTransactions() {
  return db.prepare('SELECT * FROM transactions').all().map(row => {
    row.flags = JSON.parse(row.flags || '[]');
    return row;
  });
}

export function getTransactionById(id) {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (row) {
    row.flags = JSON.parse(row.flags || '[]');
  }
  return row;
}

export function insertTransactions(rows) {
  const insert = db.prepare(`
    INSERT INTO transactions (date, description, amount, type, invoice_ref, category, flags, anomaly_explanation, action_draft, action_type, action_status)
    VALUES (@date, @description, @amount, @type, @invoice_ref, @category, @flags, @anomaly_explanation, @action_draft, @action_type, @action_status)
  `);

  const insertMany = db.transaction((transactions) => {
    for (const tx of transactions) {
      insert.run({
        ...tx,
        invoice_ref: tx.invoice_ref || null,
        category: tx.category || null,
        flags: JSON.stringify(tx.flags || []),
        anomaly_explanation: tx.anomaly_explanation || null,
        action_draft: tx.action_draft || null,
        action_type: tx.action_type || null,
        action_status: tx.action_status || 'none'
      });
    }
  });

  insertMany(rows);
}

export function updateTransaction(id, fields) {
  const setClauses = [];
  const params = [];
  
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    params.push(key === 'flags' ? JSON.stringify(value) : value);
  }
  
  params.push(id);
  
  const query = `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...params);
}

export function clearTransactions() {
  db.prepare('DELETE FROM transactions').run();
  try {
    db.prepare('DELETE FROM sqlite_sequence WHERE name = "transactions"').run();
  } catch (e) {
    // sqlite_sequence may not exist yet
  }
}

export function getSummary() {
  const all = getAllTransactions();
  
  let totalIncome = 0;
  let totalExpenses = 0;
  let flaggedCount = 0;
  const byCategoryMap = {};

  for (const tx of all) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'refund') {
      // Refunds reduce expenses
      totalExpenses -= tx.amount;
    } else if (tx.type === 'expense') {
      totalExpenses += tx.amount;
    }

    if (tx.flags && tx.flags.length > 0) {
      flaggedCount++;
    }

    // Only track expense categories for the spend chart
    if (tx.category && tx.type === 'expense') {
      byCategoryMap[tx.category] = (byCategoryMap[tx.category] || 0) + tx.amount;
    }
  }

  // Convert to array sorted by total descending
  const byCategory = Object.entries(byCategoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    flaggedCount,
    byCategory
  };
}

export function getTransactionsByFilter(filter = {}) {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (filter.category) {
    query += ' AND category = ?';
    params.push(filter.category);
  }
  if (filter.type) {
    query += ' AND type = ?';
    params.push(filter.type);
  }
  if (filter.dateFrom) {
    query += ' AND date >= ?';
    params.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    query += ' AND date <= ?';
    params.push(filter.dateTo);
  }
  
  let results = db.prepare(query).all(...params).map(row => {
    row.flags = JSON.parse(row.flags || '[]');
    return row;
  });

  if (filter.hasFlag === true) {
    results = results.filter(tx => tx.flags && tx.flags.length > 0);
  }

  return results;
}

export default db;
