// api/ai/agent.js
// Core AI Agent — Google Gemini powered agentic loop.
// Adapted for Vercel Serverless Functions.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_TOOLS } from './tools/definitions.js';
import { executeTool } from './tools/executor.js';
import { SYSTEM_PROMPT } from './utils/systemPrompt.js';

// No process.exit in serverless functions; check key on every request
// or at module level if handled gracefully.

// gemini-1.5-flash → free tier, supports function calling, very fast
const MODEL_NAME = 'gemini-flash-latest';

// REDUCED for free tier quota & Serverless Timeout (Vercel has 10s-60s limit)
const MAX_ITER   = 2; 

/**
 * Convert our simple history format to Gemini's Content format.
 */
function toGeminiHistory(history) {
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Process a user message through the Gemini AI agent.
 */
export async function processMessage(message, userId = null, history = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Inject userId so Gemini can extract it for tool calls
  const userContent = userId
    ? `[User ID: ${userId}]\n\n${message}`
    : message;

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
    tools: GEMINI_TOOLS,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024
    }
  });

  const chat = model.startChat({
    history: toGeminiHistory(history)
  });

  const toolsUsed = [];
  let iteration   = 0;
  let currentMessage = userContent;

  while (iteration < MAX_ITER) {
    iteration++;

    let result;
    try {
      result = await chat.sendMessage(currentMessage);
    } catch (err) {
      console.error('[Agent] Gemini API error:', err.message);
      throw new Error(`AI unavailable: ${err.message}`);
    }

    const response  = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) break;

    const parts = candidate.content?.parts || [];
    const functionCallParts = parts.filter(p => p.functionCall);

    if (functionCallParts.length > 0) {
      const functionResponseParts = [];

      for (const part of functionCallParts) {
        const { name, args } = part.functionCall;
        toolsUsed.push(name);

        const toolResult = await executeTool(name, args || {});

        functionResponseParts.push({
          functionResponse: {
            name,
            response: { result: toolResult }
          }
        });
      }

      currentMessage = functionResponseParts;
      continue;
    }

    const textPart = parts.find(p => p.text);
    if (textPart?.text?.trim()) {
      return { reply: textPart.text.trim(), toolsUsed };
    }

    break;
  }

  return {
    reply: 'I had trouble processing that. Please try again or contact us on WhatsApp: +91 63098 35752',
    toolsUsed
  };
}
