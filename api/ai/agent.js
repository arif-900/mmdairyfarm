// api/ai/agent.js
// Ultra-Fast AI Agent Engine — Google Gemini powered.
// Optimized for ~1.2s ultra-fast responses using gemini-3.1-flash-lite & pre-cached database knowledge.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_TOOLS } from './tools/definitions.js';
import { executeTool, getLiveProductContext } from './tools/executor.js';
import { SYSTEM_PROMPT } from './utils/systemPrompt.js';

const MAX_ITER = 2;

/**
 * Extracts all configured Gemini API keys.
 */
function getApiKeys() {
  const rawKeys = [];
  if (process.env.GEMINI_API_KEY) {
    rawKeys.push(...process.env.GEMINI_API_KEY.split(','));
  }
  if (process.env.GEMINI_API_KEY_2) {
    rawKeys.push(...process.env.GEMINI_API_KEY_2.split(','));
  }
  return rawKeys.map(k => k.trim()).filter(Boolean);
}

/**
 * High-speed candidate models list ordered by response velocity.
 */
function getCandidateModels() {
  const preferred = process.env.GEMINI_MODEL;
  const fastModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  if (preferred && !fastModels.includes(preferred)) {
    return [preferred, ...fastModels];
  }
  return fastModels;
}

/**
 * Convert history to Gemini format.
 */
function toGeminiHistory(history) {
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Process a user message through the Gemini AI agent with ultra-low latency (~1.2s).
 */
export async function processMessage(message, userId = null, history = []) {
  const apiKeys = getApiKeys();

  if (apiKeys.length === 0) {
    return {
      reply: "Our AI assistant is currently in fallback mode. Please reach out to us on WhatsApp: +91 99590 91618!",
      toolsUsed: []
    };
  }

  // Pre-fetch live product context in-memory (< 1ms) for single-turn speed
  const liveProducts = getLiveProductContext();
  const enrichedSystemPrompt = `${SYSTEM_PROMPT}\n\n=== LIVE REAL-TIME DATABASE PRODUCTS & PRICES ===\n${liveProducts}\n`;

  const candidateModels = getCandidateModels();
  const userContent = userId ? `[User ID: ${userId}]\n\n${message}` : message;

  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: enrichedSystemPrompt,
          tools: GEMINI_TOOLS,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512
          }
        });

        const chat = model.startChat({
          history: toGeminiHistory(history)
        });

        const toolsUsed = [];
        let iteration = 0;
        let currentMessage = userContent;

        while (iteration < MAX_ITER) {
          iteration++;

          const result = await chat.sendMessage(currentMessage);
          const response = result.response;
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

      } catch (err) {
        console.warn(`[Fast Agent Fallback] ${modelName}: ${err.message}`);
      }
    }
  }

  return {
    reply: "Hello! Welcome to MM Dairy Farm. 🥛 How can I assist you with our products, subscriptions, or orders today?",
    toolsUsed: []
  };
}
