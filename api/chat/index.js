// api/chat/index.js
// Vercel Serverless Function — Express-compatible
import express from 'express';
import cors from 'cors';
import { processMessage } from '../ai/agent.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message, userId = null, history = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: '"message" must be a non-empty string.' });
  }

  try {
    console.log('[/api/chat] Incoming request - message:', message, 'userId:', userId);
    const { reply, toolsUsed } = await processMessage(
      message.trim(),
      userId,
      history
    );
    console.log('[/api/chat] Success - reply:', reply, 'tools:', toolsUsed);

    return res.status(200).json({
      reply,
      toolsUsed,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[/api/chat] Error:', err.message);
    return res.status(500).json({
      reply: "I'm having trouble right now. Please try again or contact us on WhatsApp: +91 63098 35752",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default app;
