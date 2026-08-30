import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.0"

// Import Supabase SDK
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

"// System Prompt defined in the requirements
const SYSTEM_PROMPT = `
You are \"MM Assistant\", the official intelligent customer assistant for MM Dairy Farm.
You operate on a LIVE production e-commerce website.
Your job is to understand the customer's intent, retrieve accurate information when necessary, and provide a concise, natural, useful response.

=== CORE PRINCIPLES ===
1. Understand what the customer actually wants.
2. Answer ONLY what is relevant to the customer's current question.
3. Do not provide unnecessary information, dump product catalogs, or repeat information unnecessarily.
4. Live database data is the primary source of truth for products, prices, stock, delivery, coin rewards, and subscriptions.
5. Prefer short, accurate answers (1-3 sentences).
6. Represent MM Dairy Farm professionally with warmth and clarity.
7. Currency: ₹. 4 Coins = ₹1. Cash on Delivery is NOT accepted.
8. Support: WhatsApp +91 63098 35752 | mmvalidairyfarm@gmail.com
`;

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { messages, message, history, sessionId, userId } = payload;

        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not configured in environment");
        }

        // Build Gemini payload contents array
        let geminiContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        if (Array.isArray(messages) && messages.length > 0) {
            geminiContents = messages
                .filter((m: any) => m.role !== 'system')
                .map((m: any) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));
        } else if (message) {
            if (Array.isArray(history) && history.length > 0) {
                geminiContents = history.map((h: any) => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }]
                }));
            }
            const userText = userId ? `[User ID: ${userId}]\n\n${message}` : message;
            geminiContents.push({
                role: 'user',
                parts: [{ text: userText }]
            });
        } else {
            throw new Error("Missing message or messages array in payload");
        }

        // Fetch real-time products from database for dynamic AI knowledge
        let dynamicSystemPrompt = SYSTEM_PROMPT;
        try {
            const { data: dbProducts } = await supabase
                .from('products')
                .select('name, price, base_price_per_kg, description, unit, unit_type, is_active')
                .eq('is_active', true);
            
            if (dbProducts && dbProducts.length > 0) {
                const productListStr = dbProducts.map((p: any) => 
                    `• ${p.name}: ${p.base_price_per_kg ? `₹${p.base_price_per_kg}/kg` : `₹${p.price}/${p.unit || 'unit'}`} - ${p.description || ''}`
                ).join('\n');
                dynamicSystemPrompt += `\n\n=== LIVE REAL-TIME DATABASE PRODUCTS & PRICES ===\n${productListStr}\n`;
            }
        } catch (dbErr) {
            console.warn("Could not fetch DB products for edge context:", dbErr);
        }

        // Call Google Gemini REST API directly
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        const geminiRes = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: dynamicSystemPrompt }]
                },
                contents: geminiContents,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            throw new Error(`Gemini API Error (${geminiRes.status}): ${errorText}`);
        }

        const data = await geminiRes.json();
        const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here to help you with MMVALI Dairy Farm products and orders. How can I assist you today?";

        // Log the conversation to database async if sessionId provided
        const userPrompt = message || (Array.isArray(messages) ? messages[messages.length - 1]?.content : "");
        if (sessionId && userPrompt) {
            supabase.from('chat_history').insert([
                { session_id: sessionId, user_id: userId || null, role: 'user', content: userPrompt },
                { session_id: sessionId, user_id: userId || null, role: 'assistant', content: assistantMessage }
            ]).then(({ error }) => {
                if (error) console.error("Error logging chat:", error);
            });
        }

        return new Response(JSON.stringify({ reply: assistantMessage, response: assistantMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Chat Error:", error);

        const fallbackMessage = "I am currently unable to process your request. For immediate assistance, please contact us on WhatsApp: +919959091618.";

        return new Response(JSON.stringify({ error: error.message, reply: fallbackMessage, response: fallbackMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
})
