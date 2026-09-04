import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCsvFile, parseCsvString } from '../utils/csv.js';
import { clearTransactions, insertTransactions, getAllTransactions, getSummary } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/ingest', (req, res) => {
  try {
    const csvPath = process.env.CSV_PATH || path.resolve(__dirname, '../../..', 'sample_transactions.csv');
    const parsedData = parseCsvFile(csvPath);
    
    clearTransactions();
    insertTransactions(parsedData);
    
    res.json({ count: parsedData.length, message: 'Ingestion successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'No CSV content provided. Send { csvContent: "..." }' });
    }
    const parsedData = parseCsvString(csvContent);
    if (parsedData.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no valid rows' });
    }
    clearTransactions();
    insertTransactions(parsedData);
    res.json({ count: parsedData.length, message: `Uploaded ${parsedData.length} transactions successfully` });
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
