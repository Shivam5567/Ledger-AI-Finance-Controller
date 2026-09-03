import express from 'express';
import { handleChatMessage } from '../agents/chatAgent.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  await handleChatMessage(message, res);
});

export default router;
