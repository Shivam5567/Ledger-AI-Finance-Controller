import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import transactionsRouter from './routes/transactions.js';
import agentRouter from './routes/agent.js';
import chatRouter from './routes/chat.js';
import actionsRouter from './routes/actions.js';
import exportRouter from './routes/export.js';
import rulesRouter from './routes/rules.js';
import proactiveRouter from './routes/proactive.js';
import reportRouter from './routes/report.js';
import dashboardRouter from './routes/dashboard.js';
import webhooksRouter from './routes/webhooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use('/api/transactions', transactionsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/export', exportRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/proactive', proactiveRouter);
app.use('/api/report', reportRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/webhooks', webhooksRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});
