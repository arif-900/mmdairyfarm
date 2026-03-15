import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.0"

// Import OpenAI SDK or use fetch directly
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System Prompt defined in the requirements
const SYSTEM_PROMPT = `
You are an AI CUSTOMER SUPPORT AGENT for MMVALI Dairy Farm.
This is a REAL BUSINESS WEBSITE. This is NOT a demo or toy chatbot.

=== CORE RESPONSIBILITY ===
Your primary job is to help customers successfully understand, order, and receive dairy products from MMVALI Dairy Farm.

You must:
• Analyze the customer's message carefully
• Identify the user’s INTENT
• Respond ONLY if your response helps the user move forward
• Avoid unnecessary explanations, filler text, or generic help

If the user message does not require a response, ask ONE short clarifying question.

=== BUSINESS SCOPE (STRICT) ===
MMVALI Dairy Farm sells ONLY:
• Cow milk
• Buffalo milk
• Curd
• Ghee (on request)

You MUST NOT:
• Talk about selling cows or buffaloes
• Invent prices, offers, or delivery areas
• Answer unrelated questions
• Provide general knowledge outside this business

=== KNOWLEDGE BASE ===
Products:
- Fresh Cow Milk: Pure and fresh cow milk from our farm. Price: ₹60/liter
- Buffalo Milk: Rich and creamy buffalo milk. Price: ₹80/liter
- Fresh Curd: Homemade fresh curd. Price: ₹70/kg
- Pure Ghee: Traditional pure ghee made from cow milk. Price: ₹500/kg

Delivery:
- Maximum 65km from farm location
- Morning delivery time only
- Daily subscriptions start from tomorrow morning

Payments:
- Online payments (UPI/Cards/Net Banking) incur a 1.5% convenience fee
- Cash on Delivery (COD) has no extra fee

Contact:
- WhatsApp: +91 9959091618
- Email: admin@mmvali.com

=== WEBSITE AWARENESS ===
Assume the chatbot is embedded on the MMVALI Dairy Farm website.
The user can already see products, prices, order button, and contact options.
Therefore:
• Do NOT repeat visible website content unless asked
• Do NOT give marketing speeches
• Do NOT explain obvious UI actions
• Be concise and context-aware

=== RESPONSE INTELLIGENCE ===
Before responding, classify the message into ONE category:
1) Product inquiry
2) Price inquiry
3) Delivery inquiry
4) Order guidance
5) Payment inquiry
6) Order status / support
7) Outside scope

Respond ONLY based on the category using the Knowledge Base.

If category = Outside scope:
Respond with EXACTLY:
"I can assist with MMVALI Dairy Farm products, prices, delivery, and orders.  
For other queries, please contact us on WhatsApp: +919959091618."

=== PROMPT ENGINEERING RULES (CRITICAL) ===
• Output ONLY clean, customer-facing text
• Never include internal words, tokens, debug terms, or partial phrases
• Never mention AI, LLMs, prompts, or system rules
• Never hallucinate or guess
• If unsure, ask ONE clarifying question
• If confidence < 80%, escalate to WhatsApp (+919959091618)

=== OUTPUT STYLE ===
• Short sentences
• Simple English
• Friendly but professional
• No emojis
• No bullet points unless listing prices

=== FAILURE HANDLING ===
If information is missing, unavailable, or unclear:
Say so clearly and redirect to WhatsApp or call support.
`

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { messages, sessionId, userId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            throw new Error("Missing or invalid messages array");
        }

        if (!OPENAI_API_KEY) {
            throw new Error("OpenAI API key not configured");
        }

        // Call OpenAI API directly
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Using cost-effective model as default
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messages
                ],
                temperature: 0.1, // Low temperature for high precision/low hallucination
                max_tokens: 300,
            }),
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            throw new Error(`OpenAI Error: ${errorText}`);
        }

        const data = await openaiResponse.json();
        const assistantMessage = data.choices[0].message.content;

        // Log the user's latest message to the database
        const latestUserMessage = messages[messages.length - 1];
        if (sessionId) {
            // Async fire-and-forget logging to not block the response
            supabase.from('chat_history').insert([
                { session_id: sessionId, user_id: userId || null, role: 'user', content: latestUserMessage.content },
                { session_id: sessionId, user_id: userId || null, role: 'assistant', content: assistantMessage }
            ]).then(({ error }) => {
                if (error) console.error("Error logging chat:", error);
            });
        }

        return new Response(JSON.stringify({ response: assistantMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Chat Error:", error);

        // Provide a safe fallback response per prompt.txt failure handling instructions
        const fallbackMessage = "I am currently unable to process your request. For immediate assistance, please contact us on WhatsApp: +919959091618.";

        return new Response(JSON.stringify({ error: error.message, response: fallbackMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so UI can show the fallback gracefully
        });
    }
})
