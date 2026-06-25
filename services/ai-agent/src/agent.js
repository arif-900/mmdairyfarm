// ai-agent/src/agent.js
// Core AI Agent — Google Gemini powered agentic loop.
//
// Flow:
//   1. Receive { message, userId, history }
//   2. Call Gemini with function declarations + system instruction
//   3. If Gemini returns functionCall → execute tool → send result back
//   4. Loop until Gemini returns a plain text reply
//   5. Return { reply, toolsUsed }
//
// Uses Gemini 1.5 Flash — free tier, fast, and supports function calling.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_TOOLS } from './tools/definitions.js';
import { executeTool } from './tools/executor.js';
import { SYSTEM_PROMPT } from './utils/systemPrompt.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY missing in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Note: SDK 0.21.0 defaults to v1beta for some features; if errors occur, ensure model IDs are stable.

// gemini-1.5-flash → free tier, supports function calling, very fast
// gemini-1.5-flash → free tier, supports function calling, very fast
// Use gemini-flash-latest as confirmed working in manual curl test
const MODEL_NAME = 'gemini-flash-latest';

// REDUCED for free tier quota (Limit: 20 per day)
const MAX_ITER   = 2; // safety cap on agentic loop
const RETRY_DELAY = 1000; // 1s delay to avoid burst 429s

/**
 * Convert our simple history format to Gemini's Content format.
 * Gemini uses 'model' instead of 'assistant'.
 */
function toGeminiHistory(history) {
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Process a user message through the Gemini AI agent.
 *
 * @param {string}      message  - User's natural language query
 * @param {string|null} userId   - Supabase auth user UUID (null = guest)
 * @param {Array}       history  - Prior turns [{role, content}]
 * @returns {Promise<{reply: string, toolsUsed: string[]}>}
 */
export async function processMessage(message, userId = null, history = []) {
  // console.log(`\n[Agent] user=${userId || 'guest'} | msg="${message}"`);

  // Inject userId so Gemini can extract it for tool calls
  const userContent = userId
    ? `[User ID: ${userId}]\n\n${message}`
    : message;

  // Build Gemini model with system instruction and tools
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
    tools: GEMINI_TOOLS,
    generationConfig: {
      temperature:    0.2,  // low = precise, consistent answers
      maxOutputTokens: 1024
    }
  });

  // Start chat session with prior conversation history
  const chat = model.startChat({
    history: toGeminiHistory(history)
  });

  const toolsUsed = [];
  let iteration   = 0;
  let currentMessage = userContent;

  // ── Agentic loop ──────────────────────────────────────────────────────────
  while (iteration < MAX_ITER) {
    if (iteration > 0) await new Promise(r => setTimeout(r, RETRY_DELAY));
    iteration++;
    // console.log(`[Agent] iteration ${iteration} | sending: "${String(currentMessage).slice(0, 80)}"`);

    let result;
    try {
      result = await chat.sendMessage(
        typeof currentMessage === 'string'
          ? currentMessage
          : currentMessage   // can be array of parts (function results)
      );
    } catch (err) {
      console.error('[Agent] Gemini API error:', err.message);
      throw new Error(`AI unavailable: ${err.message}`);
    }

    const response  = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      console.error('[Agent] No candidates in Gemini response');
      break;
    }

    const parts = candidate.content?.parts || [];
    // console.log(`[Agent] parts received: ${parts.map(p => p.functionCall ? 'functionCall:' + p.functionCall.name : 'text').join(', ')}`);

    // ── Check for function calls ───────────────────────────────────────────
    const functionCallParts = parts.filter(p => p.functionCall);

    if (functionCallParts.length > 0) {
      // Execute each requested function and collect results
      const functionResponseParts = [];

      for (const part of functionCallParts) {
        const { name, args } = part.functionCall;
        // console.log(`[Agent] function call: ${name}`, args);
        toolsUsed.push(name);

        const toolResult = await executeTool(name, args || {});
        // console.log(`[Agent] result: ${JSON.stringify(toolResult).slice(0, 200)}`);

        functionResponseParts.push({
          functionResponse: {
            name,
            response: { result: toolResult }
          }
        });
      }

      // Send all function results back to Gemini in one message
      currentMessage = functionResponseParts;
      continue;
    }

    // ── Plain text reply — we're done ─────────────────────────────────────
    const textPart = parts.find(p => p.text);
    if (textPart?.text?.trim()) {
      const reply = textPart.text.trim();
      // console.log(`[Agent] final reply: "${reply.slice(0, 100)}"`);
      return { reply, toolsUsed };
    }

    // console.warn('[Agent] No text or function call in response — breaking loop');
    break;
  }

  return {
    reply: 'I had trouble processing that. Please try again or contact us on WhatsApp: +91 63098 35752',
    toolsUsed
  };
}
