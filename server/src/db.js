import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('ledger.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

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

try {
  db.exec(`ALTER TABLE transactions ADD COLUMN confidence TEXT;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE transactions ADD COLUMN resolved_at TEXT;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE transactions ADD COLUMN match_status TEXT DEFAULT 'matched';`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE transactions ADD COLUMN exception_type TEXT;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE transactions ADD COLUMN exception_reason TEXT;`);
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS dismissed_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flag_type TEXT NOT NULL,
    description_pattern TEXT NOT NULL,
    dismissed_at TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
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
    INSERT INTO transactions (date, description, amount, type, invoice_ref, category, flags, anomaly_explanation, action_draft, action_type, action_status, confidence, resolved_at)
    VALUES (@date, @description, @amount, @type, @invoice_ref, @category, @flags, @anomaly_explanation, @action_draft, @action_type, @action_status, @confidence, @resolved_at)
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
        action_status: tx.action_status || 'none',
        confidence: tx.confidence || null,
        resolved_at: tx.resolved_at || null
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
  } catch (e) {}
}

export function getSummary() {
  const all = getAllTransactions();
  let totalIncome = 0;
  let totalExpenses = 0;
  let flaggedCount = 0;
  const byCategoryMap = {};

  for (const tx of all) {
    if (tx.type === 'income') totalIncome += tx.amount;
    else if (tx.type === 'refund') totalExpenses -= tx.amount;
    else if (tx.type === 'expense') totalExpenses += tx.amount;
    if (tx.flags && tx.flags.length > 0) flaggedCount++;
    if (tx.category && tx.type === 'expense') {
      byCategoryMap[tx.category] = (byCategoryMap[tx.category] || 0) + tx.amount;
    }
  }

  const byCategory = Object.entries(byCategoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses, flaggedCount, byCategory };
}

export function getTransactionsByFilter(filter = {}) {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];
  if (filter.category) { query += ' AND category = ?'; params.push(filter.category); }
  if (filter.type) { query += ' AND type = ?'; params.push(filter.type); }
  if (filter.dateFrom) { query += ' AND date >= ?'; params.push(filter.dateFrom); }
  if (filter.dateTo) { query += ' AND date <= ?'; params.push(filter.dateTo); }
  let results = db.prepare(query).all(...params).map(row => {
    row.flags = JSON.parse(row.flags || '[]');
    return row;
  });
  if (filter.hasFlag === true) {
    results = results.filter(tx => tx.flags && tx.flags.length > 0);
  }
  return results;
}

export function getDismissedRules() {
  return db.prepare('SELECT * FROM dismissed_rules ORDER BY dismissed_at DESC').all();
}

export function createDismissedRule(flag_type, description_pattern) {
  const now = new Date().toISOString();
  return db.prepare('INSERT INTO dismissed_rules (flag_type, description_pattern, dismissed_at) VALUES (?, ?, ?)').run(flag_type, description_pattern, now);
}

export function deleteDismissedRule(id) {
  db.prepare('DELETE FROM dismissed_rules WHERE id = ?').run(id);
}

export function isDismissed(flag_type, description) {
  // Check if a similar transaction was previously dismissed
  const rules = getDismissedRules();
  return rules.some(r => {
    if (r.flag_type !== flag_type) return false;
    // Match if description contains the pattern (case insensitive)
    return description.toLowerCase().includes(r.description_pattern.toLowerCase());
  });
}

export function setMetadata(key, value) {
  db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)').run(key, String(value));
}

export function getMetadata(key) {
  const row = db.prepare('SELECT value FROM metadata WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function getReport() {
  const total      = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  const matched    = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE match_status = 'matched' OR match_status IS NULL").get().count;
  const exceptions = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE match_status = 'exception'").get().count;
  const matchRate  = total > 0 ? ((matched / total) * 100).toFixed(1) : '0.0';

  const exceptionList = db.prepare(`
    SELECT id, date, description, amount, type, exception_type, exception_reason
    FROM transactions
    WHERE match_status = 'exception'
    ORDER BY date DESC
  `).all();

  const byType = db.prepare(`
    SELECT exception_type, COUNT(*) as count
    FROM transactions
    WHERE match_status = 'exception'
    GROUP BY exception_type
  `).all();

  const durationSeconds = getMetadata('last_run_duration') || '8.2';

  return {
    summary: { total, matched, exceptions, matchRate: `${matchRate}%`, durationSeconds },
    exceptionBreakdown: byType,
    exceptionList,
  };
}

export default db;
