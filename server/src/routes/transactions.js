import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile } from '../utils/csv.js';
import { clearTransactions, insertTransactions, getAllTransactions, getSummary } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/ingest', (req, res) => {
  try {
    // Navigate from server/src/routes/ up to the project root
    const csvPath = path.resolve(__dirname, '../../..', 'sample_transactions.csv');
    const parsedData = parseCsvFile(csvPath);
    
    clearTransactions();
    insertTransactions(parsedData);
    
    res.json({ count: parsedData.length, message: 'Ingestion successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const transactions = getAllTransactions();
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', (req, res) => {
  try {
    const summary = getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
