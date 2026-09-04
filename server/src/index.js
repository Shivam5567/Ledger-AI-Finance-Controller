import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import transactionsRouter from './routes/transactions.js';
import agentRouter from './routes/agent.js';
import chatRouter from './routes/chat.js';
import actionsRouter from './routes/actions.js';
import exportRouter from './routes/export.js';
import rulesRouter from './routes/rules.js';
import proactiveRouter from './routes/proactive.js';
import reportRouter from './routes/report.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/transactions', transactionsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/export', exportRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/proactive', proactiveRouter);
app.use('/api/report', reportRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
