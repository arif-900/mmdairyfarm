// ai-agent/src/index.js
// MM Dairy Farm — AI Agent Microservice (Google Gemini)
// Express server on port 3001 — runs alongside local-server.js (port 5001)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processMessage } from './agent.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MM Dairy Farm AI Agent',
    provider: 'Google Gemini',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /chat
 *
 * Request body:
 *   {
 *     message : string          — user's query (required)
 *     userId  : string | null   — Supabase auth UUID (optional)
 *     history : Array           — [{role, content}] prior turns (optional)
 *   }
 *
 * Response:
 *   {
 *     reply     : string        — AI's natural language reply
 *     toolsUsed : string[]      — names of functions called
 *     timestamp : string
 *   }
 */
app.post('/chat', async (req, res) => {
  const { message, userId = null, history = [] } = req.body;

  // Validation
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: '"message" must be a non-empty string.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long. Max 2000 characters.' });
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: '"history" must be an array.' });
  }

  try {
    const { reply, toolsUsed } = await processMessage(
      message.trim(),
      userId,
      history
    );

    return res.json({
      reply,
      toolsUsed,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[/chat] Error:', err.message);
    return res.status(500).json({
      reply: "I'm having trouble right now. Please try again or contact us on WhatsApp: +91 6309835752",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', endpoints: ['GET /health', 'POST /chat'] });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server]', err);
  res.status(500).json({ reply: 'Server error. Contact +91 6309835752' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🥛 MM Dairy Farm AI Agent (Google Gemini)`);
  console.log(`✅  Running → http://localhost:${PORT}`);
  console.log(`📡  POST /chat  |  GET /health`);
  console.log(`🆓  Powered by Gemini 1.5 Flash (Free tier)\n`);
});

export default app;
