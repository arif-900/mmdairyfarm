// src/components/chat/ChatWidget.tsx
// Upgraded chat widget — now powered by the MM Dairy Farm AI Agent microservice.
// Replaces the direct OpenAI call with POST /chat to the agent service.
// Keeps the original UI intact (shadcn/ui components, existing styles).

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Loader2, MessageSquareWarning, Lock } from "lucide-react";
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

// AI Agent Unified URL — set VITE_AI_AGENT_URL in your .env
// Defaults to "/api" for production-ready relative routing.
// Locally proxies to your Unified Backend (port 5001).
const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || "/api";

const WELCOME_MSG = "Hi! I'm MilkMind AI 🌿 How can I help you with your orders, products, or subscriptions today?";

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
                            return <strong key={i} className="font-extrabold text-[#C98A24] underline-offset-2 decoration-[#C98A24]/30">{part.slice(2, -2)}</strong>;
                        }
                        
                        // Handle Emails
                        const emailParts = part.split(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                        return emailParts.map((ePart, ei) => {
                            if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+$/gi.test(ePart)) {
                                return <a key={`${i}-${ei}`} href={`mailto:${ePart}`} className="text-[#C98A24] font-bold underline hover:text-[#D9A441] transition-colors">{ePart}</a>;
                            }
                            return ePart;
                        });
                    });

                    return (
                        <div key={lineIdx} className={isBullet ? "flex gap-2.5 items-start pl-1 group" : ""}>
                            {isBullet && (
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#C98A24] flex-shrink-0 shadow-sm group-hover:scale-125 transition-transform" />
                            )}
                            <span className={isBullet ? "text-[13.5px] leading-relaxed text-[#F5F3EC]" : "text-[13.5px] leading-relaxed inline-block text-[#F5F3EC]"}>
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* FAB */}
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-[#061A13] hover:bg-[#0B2118] z-50 p-1 flex items-center justify-center transition-all hover:scale-105 overflow-hidden border-2 border-[#C98A24] ring-2 ring-[#C98A24]/30"
                onClick={() => setIsOpen(true)}
                style={{ display: isOpen ? "none" : "flex" }}
                aria-label="Open MilkMind AI chat"
            >
                <img src="/milkmind-ai-logo.png" alt="MilkMind AI" className="w-full h-full object-contain rounded-full bg-[#061A13]" />
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-[#08251A] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-white/10 animate-in slide-in-from-bottom-5">

                    {/* Header */}
                    <div className="bg-[#061A13] text-[#F5F3EC] p-4 flex justify-between items-center rounded-t-2xl border-b border-white/10 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#061A13] p-0.5 shadow-md shrink-0 overflow-hidden border border-[#C98A24] flex items-center justify-center">
                                <img src="/milkmind-ai-logo.png" alt="MilkMind AI" className="w-full h-full object-contain rounded-full" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 text-[#F5F3EC]">
                                    MilkMind AI
                                    <span className="text-[10px] bg-[#C98A24]/20 text-[#C98A24] border border-[#C98A24]/30 px-1.5 py-0.5 rounded-full font-extrabold uppercase">Copilot</span>
                                </h3>
                                <p className="text-xs text-[#9AAFA4] mt-0.5">{isLoading ? "Analyzing..." : "Online • Dairy Assistant"}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#AAB8B0] hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages Container */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-[#0B2118] custom-scrollbar">
                        {userId ? (
                            <>
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-md text-sm border transition-all duration-300 ${
                                            msg.role === "user"
                                                ? "bg-[#C98A24] text-[#061A13] font-bold rounded-tr-none border-[#C98A24]"
                                                : "bg-[#10291F] border-white/10 text-[#F5F3EC] rounded-tl-none"
                                        }`}>
                                            {msg.role === "user" ? (
                                                <p className="text-xs sm:text-sm leading-relaxed text-[#061A13] font-semibold">{msg.content}</p>
                                            ) : (
                                                renderContent(msg.content)
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#10291F] border border-white/10 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#C98A24]" />
                                            <span className="text-xs text-[#9AAFA4] font-medium">Typing…</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-5 animate-in fade-in duration-500">
                                <div className="h-16 w-16 bg-[#10291F] border border-white/10 rounded-full flex items-center justify-center shadow-inner">
                                    <Lock className="h-7 w-7 text-[#C98A24]" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="font-extrabold text-[#F5F3EC] text-base">Login Required</h4>
                                    <p className="text-xs text-[#9AAFA4] leading-relaxed max-w-[240px] mx-auto">
                                        To chat with our <strong>AI Support Agent</strong> and get instant help, please sign in.
                                    </p>
                                </div>
                                <Link to="/auth" onClick={() => setIsOpen(false)} className="w-full pt-2">
                                    <Button className="w-full rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black py-5 text-xs uppercase tracking-wider h-auto border border-[#C98A24] shadow-lg">
                                        Sign In Now
                                    </Button>
                                </Link>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Email escalation & Input - Only if logged in */}
                    {userId && (
                        <>
                            <div className="bg-[#061A13] px-4 py-2 border-t border-b border-white/10 flex items-center justify-between text-xs">
                                <span className="text-[#9AAFA4] flex items-center gap-1.5">
                                    <MessageSquareWarning className="h-3.5 w-3.5 text-[#C98A24]" /> Need human help?
                                </span>
                                <a href="mailto:mmvalidairyfarm@gmail.com" className="font-bold text-[#C98A24] hover:underline">
                                    Email Us
                                </a>
                            </div>

                            <div className="p-3 bg-[#08251A] flex items-center gap-2 rounded-b-2xl border-t border-white/10">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type your message…"
                                    className="flex-1 bg-[#10291F] text-[#F5F3EC] placeholder:text-[#718078] text-xs sm:text-sm border border-white/10 rounded-xl px-4 py-2.5 focus:border-[#C98A24] focus:outline-none"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                />
                                <Button size="icon" className="rounded-xl h-10 w-10 flex-shrink-0 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13]" onClick={handleSend} disabled={!input.trim() || isLoading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
