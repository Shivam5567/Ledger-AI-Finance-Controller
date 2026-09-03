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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/export', exportRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/proactive', proactiveRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
