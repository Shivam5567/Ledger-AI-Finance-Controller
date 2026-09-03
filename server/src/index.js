import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import transactionsRouter from './routes/transactions.js';
import agentRouter from './routes/agent.js';
import chatRouter from './routes/chat.js';
import actionsRouter from './routes/actions.js';

// Global safety nets to prevent server process crashes
process.on('uncaughtException', (err) => {
  console.error('[SERVER CRASH PREVENTED] Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER CRASH PREVENTED] Unhandled Rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/actions', actionsRouter);

// Global Express Error Middleware
app.use((err, req, res, next) => {
  console.error('[EXPRESS ROUTE ERROR]:', err.stack || err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
