import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function parseCsvFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const parsedRecords = [];

  for (const record of records) {
    if (!record.date || !record.description || !record.amount || !record.type) {
      throw new Error(`Missing required columns in CSV row: ${JSON.stringify(record)}`);
    }

    parsedRecords.push({
      date: record.date,
      description: record.description,
      amount: Math.abs(parseFloat(record.amount)),
      type: record.type,
      invoice_ref: record.invoice_ref || null,
      flags: [],
    });
  }

  return parsedRecords;
}
