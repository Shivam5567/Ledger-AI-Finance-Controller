import express from 'express';
import { handleChatMessage } from '../agents/chatAgent.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    await handleChatMessage(message, res);
  } catch (error) {
    console.error("Chat Router Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
