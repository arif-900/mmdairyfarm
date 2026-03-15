import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm the MMVALI Dairy Farm assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => crypto.randomUUID());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const renderMessageContent = (content: string) => {
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const parts = content.split(emailRegex);
        return parts.map((part, i) =>
            emailRegex.test(part) ? (
                <a key={i} href={`mailto:${part}`} className="text-blue-600 font-bold underline hover:text-blue-800 transition-colors">
                    {part}
                </a>
            ) : part
        );
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Since local Supabase Edge Functions are failing to start, we call OpenAI directly here
        const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
- Email: mmvalidairyfarm@gmail.com
=== WEBSITE AWARENESS ===
Assume the chatbot is embedded on the MMVALI Dairy Farm website.
The user can already see products, prices, order button, and contact options.
Therefore:
• Do NOT repeat visible website content unless asked
• Do NOT give marketing speeches
• Do NOT explain obvious UI actions
• Be concise and context-aware
=== PROMPT ENGINEERING RULES (CRITICAL) ===
• Output ONLY clean, customer-facing text
• Never include internal words, tokens, debug terms, or partial phrases
• Never mention AI, LLMs, prompts, or system rules
• Never hallucinate or guess
• If unsure, ask ONE clarifying question
• If confidence < 80%, escalate to Email (mmvalidairyfarm@gmail.com)
=== OUTPUT STYLE ===
• Short sentences
• Simple English
• Friendly but professional
• No emojis
• No bullet points unless listing prices
`;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const combinedMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages,
                userMessage
            ].map(({ role, content }) => ({ role, content }));

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: combinedMessages,
                    temperature: 0.1,
                    max_tokens: 300
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "Failed to fetch from OpenAI");

            const assistantReply = data.choices[0].message.content;
            setMessages((prev) => [...prev, { role: "assistant", content: assistantReply }]);

            // Still log to Supabase in the background
            (supabase as any).from('chat_history').insert([
                { session_id: sessionId, user_id: user?.id || null, role: 'user', content: userMessage.content },
                { session_id: sessionId, user_id: user?.id || null, role: 'assistant', content: assistantReply }
            ]).then(({ error }: any) => { if (error) console.error("History err:", error); });
        } catch (error) {
            console.error("Chat Error:", error);
            toast({
                title: "Chat Unavailable",
                description: "Something went wrong. Please try Email.",
                variant: "destructive",
            });
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "I am having trouble connecting right now. Please reach out to us on email: mmvalidairyfarm@gmail.com for help." }
            ]);
        } finally {
            setIsLoading(false);
        }
    }; return (
        <>
            {/* Floating Action Button */}
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50 p-0 flex items-center justify-center transition-transform hover:scale-105"
                onClick={() => setIsOpen(true)}
                style={{ display: isOpen ? "none" : "flex" }}
            >
                <MessageCircle className="h-7 w-7 text-white" />
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all border border-gray-100 animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-2xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <h3 className="font-semibold">MMVALI Chat Support</h3>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex \${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm \${
                    msg.role === "user"
                      ? "bg-primary text-black-100 rounded-tr-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                                >
                                    {renderMessageContent(msg.content)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-gray-500">Typing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Email Escalation */}
                    <div className="bg-blue-50 px-4 py-2 border-t border-b border-blue-100 flex items-center justify-between">
                        <span className="text-xs text-blue-800 flex items-center gap-1">
                            <MessageSquareWarning className="h-3 w-3" /> Need real human help?
                        </span>
                        <a
                            href="mailto:mmvalidairyfarm@gmail.com"
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline"
                        >
                            Email Us
                        </a>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white flex items-center gap-2 rounded-b-2xl">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-50 text-sm border-0 rounded-full px-4 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            className="rounded-full h-9 w-9 flex-shrink-0"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <Send className="h-4 w-4 -ml-0.5" />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
