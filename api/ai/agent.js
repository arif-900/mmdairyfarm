// api/ai/agent.js
// Core AI Agent — Groq (Primary) & Google Gemini (Fallback) powered agentic loop.
// Adapted for Vercel Serverless Functions.

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_TOOLS, GROQ_TOOLS } from './tools/definitions.js';
import { executeTool } from './tools/executor.js';
import { SYSTEM_PROMPT } from './utils/systemPrompt.js';

const GEMINI_MODEL_NAME = 'gemini-flash-latest';
const GROQ_MODEL_NAME   = 'llama-3.3-70b-versatile';
const MAX_ITER          = 2; 

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
 * Process user message via Groq Llama-3.3-70b AI agent.
 */
async function processMessageWithGroq(message, userId, history) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const userContent = userId ? `[User ID: ${userId}]\n\n${message}` : message;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userContent }
  ];

  const toolsUsed = [];
  let iteration = 0;

  while (iteration < MAX_ITER) {
    iteration++;

    let response;
    try {
      response = await groq.chat.completions.create({
        model: GROQ_MODEL_NAME,
        messages,
        tools: GROQ_TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens: 1024
      });
    } catch (err) {
      console.error('[Agent] Groq API error:', err.message);
      if (err.message.includes('429') || err.message.toLowerCase().includes('rate')) {
        return {
          reply: "Our AI assistant is temporarily busy (Groq rate limit). Please contact us on WhatsApp: +91 63098 35752!",
          toolsUsed: []
        };
      }
      throw err;
    }

    const responseMessage = response.choices[0]?.message;
    console.log('[Agent] Groq responseMessage:', JSON.stringify(responseMessage, null, 2));
    if (!responseMessage) break;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch (e) {
          functionArgs = {};
        }

        toolsUsed.push(functionName);
        const toolResult = await executeTool(functionName, functionArgs);

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify({ result: toolResult })
        });
      }
      continue;
    }

    if (responseMessage.content?.trim()) {
      return { reply: responseMessage.content.trim(), toolsUsed };
    }

    break;
  }

  return {
    reply: 'I had trouble processing that. Please try again or contact us on WhatsApp: +91 63098 35752',
    toolsUsed
  };
}

/**
 * Process a user message through the AI agent (Groq preferred, Gemini fallback).
 */
export async function processMessage(message, userId = null, history = []) {
  // 1. Prefer Groq if GROQ_API_KEY is defined
  if (process.env.GROQ_API_KEY) {
    try {
      return await processMessageWithGroq(message, userId, history);
    } catch (groqErr) {
      console.warn('[Agent] Groq failed, falling back to Gemini if available:', groqErr.message);
      if (!process.env.GEMINI_API_KEY) {
        throw groqErr;
      }
    }
  }

  // 2. Gemini fallback
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY environment variable is set.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const userContent = userId ? `[User ID: ${userId}]\n\n${message}` : message;

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
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
      if (err.message.includes('429') || err.message.toLowerCase().includes('quota')) {
        return {
          reply: "Our AI assistant is temporarily resting due to high demand. 🥛 Please reach out to us on WhatsApp: +91 63098 35752!",
          toolsUsed: []
        };
      }
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
