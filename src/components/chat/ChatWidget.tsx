// src/components/chat/ChatWidget.tsx
// Upgraded chat widget — now powered by the MM Dairy Farm AI Agent microservice.
// Replaces the direct OpenAI call with POST /chat to the agent service.
// Keeps the original UI intact (shadcn/ui components, existing styles).

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ConversationEntry {
    role: "user" | "assistant";
    content: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

// AI Agent microservice URL — set VITE_AI_AGENT_URL in your .env
// Falls back to localhost:3001 for development
// Production-ready routing — use relative path for Vercel
const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || "/api";

const WELCOME_MSG = "Hi! I'm the MM Dairy Farm assistant 🥛 How can I help you today?";

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "welcome", role: "assistant", content: WELCOME_MSG }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId] = useState(() => crypto.randomUUID());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // ── Auth: resolve logged-in user ─────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setUserId(session?.user?.id ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // ── Focus input when opened ──────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
    }, [isOpen]);

    // ── Build conversation history for context ───────────────────────────────
    const buildHistory = useCallback((): ConversationEntry[] => {
        return messages
            .filter(m => m.id !== "welcome")
            .slice(-12)
            .map(m => ({ role: m.role, content: m.content }));
    }, [messages]);

    // ── Render message content (Premium Markdown-lite) ──────────────────────
    const renderContent = (content: string) => {
        const lines = content.split('\n');
        
        return (
            <div className="space-y-2">
                {lines.map((line, lineIdx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return <div key={lineIdx} className="h-2" />;

                    // Handle Bullet Points
                    const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
                    const cleanLine = isBullet ? trimmedLine.slice(2) : line;

                    // Bold text (**text**)
                    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
                    const renderedLine = parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-extrabold text-forest underline-offset-2 decoration-forest/30">{part.slice(2, -2)}</strong>;
                        }
                        
                        // Handle Emails
                        const emailParts = part.split(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                        return emailParts.map((ePart, ei) => {
                            if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+$/gi.test(ePart)) {
                                return <a key={`${i}-${ei}`} href={`mailto:${ePart}`} className="text-blue-600 font-bold underline hover:text-blue-800 transition-colors">{ePart}</a>;
                            }
                            return ePart;
                        });
                    });

                    return (
                        <div key={lineIdx} className={isBullet ? "flex gap-2.5 items-start pl-1 group" : ""}>
                            {isBullet && (
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex-shrink-0 shadow-sm group-hover:scale-125 transition-transform" />
                            )}
                            <span className={isBullet ? "text-[13.5px] leading-relaxed text-slate-700" : "text-[13.5px] leading-relaxed inline-block"}>
                                {renderedLine}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Core send function ───────────────────────────────────────────────────
    const sendMessage = useCallback(async (text: string, currentHistory: ConversationEntry[]) => {
        try {
            const res = await fetch(`${AI_AGENT_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, userId, history: currentHistory })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const reply = data.reply || "I couldn't process that. Please try again.";

            setMessages(prev => [...prev, { id: uid(), role: "assistant", content: reply }]);

            // Log to Supabase chat_history (background)
            (supabase as any)
                .from("chat_history")
                .insert([
                    { session_id: sessionId, user_id: userId ?? null, role: "user",      content: text  },
                    { session_id: sessionId, user_id: userId ?? null, role: "assistant", content: reply }
                ])
                .then(({ error }: any) => { if (error) console.warn("chat_history:", error.message); });

        } catch (err: unknown) {
            console.error("[ChatWidget]", err);
            toast({ title: "Chat Unavailable", description: "Something went wrong. Please try Email.", variant: "destructive" });
            setMessages(prev => [
                ...prev,
                { id: uid(), role: "assistant", content: "I'm having trouble connecting. Please reach us at mmvalidairyfarm@gmail.com or WhatsApp: +91 63098 35752" }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [userId, sessionId, toast]);

    // ── Handle send button / Enter ───────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: Message = { id: uid(), role: "user", content: text };
        const history = buildHistory();
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        await sendMessage(text, history);
    }, [input, isLoading, buildHistory, sendMessage]);

    // ── Quick chip tap ───────────────────────────────────────────────────────
    const sendChip = useCallback(async (chip: string) => {
        if (isLoading) return;
        const userMsg: Message = { id: uid(), role: "user", content: chip };
        const history = buildHistory();
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        await sendMessage(chip, history);
    }, [isLoading, buildHistory, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const CHIPS = ["What products do you have?", "Track my order", "Delivery info", "Payment options"];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* FAB */}
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50 p-0 flex items-center justify-center transition-transform hover:scale-105"
                onClick={() => setIsOpen(true)}
                style={{ display: isOpen ? "none" : "flex" }}
                aria-label="Open chat"
            >
                <MessageCircle className="h-7 w-7 text-white" />
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-gray-100 animate-in slide-in-from-bottom-5">

                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-2xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <div>
                                <h3 className="font-semibold leading-none">MMVALI Chat Support</h3>
                                <p className="text-xs text-white/70 mt-0.5">{isLoading ? "Thinking…" : "AI Assistant • Online"}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm text-sm border transition-all duration-300 ${
                                    msg.role === "user"
                                        ? "bg-gradient-to-br from-primary to-emerald-600 text-white rounded-tr-none border-primary/20 shadow-primary/10"
                                        : "bg-white border-slate-100 text-slate-800 rounded-tl-none shadow-slate-200/50"
                                }`}>
                                    {renderContent(msg.content)}
                                </div>
                            </div>
                        ))}

                        {/* Suggestion chips — only shown on first open */}
                        {messages.length === 1 && !isLoading && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {CHIPS.map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => sendChip(chip)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary bg-white hover:bg-primary/5 transition-colors"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-gray-500">Typing…</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Email escalation */}
                    <div className="bg-blue-50 px-4 py-2 border-t border-b border-blue-100 flex items-center justify-between">
                        <span className="text-xs text-blue-800 flex items-center gap-1">
                            <MessageSquareWarning className="h-3 w-3" /> Need human help?
                        </span>
                        <a href="mailto:mmvalidairyfarm@gmail.com" className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline">
                            Email Us
                        </a>
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white flex items-center gap-2 rounded-b-2xl">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type your message…"
                            className="flex-1 bg-gray-50 text-sm border-0 rounded-full px-4 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <Button size="icon" className="rounded-full h-9 w-9 flex-shrink-0" onClick={handleSend} disabled={!input.trim() || isLoading}>
                            <Send className="h-4 w-4 -ml-0.5" />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
