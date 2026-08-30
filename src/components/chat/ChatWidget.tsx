// src/components/chat/ChatWidget.tsx
// Redesigned MM Assistant — Premium Dark Mode AI Customer Assistant UI
// Features Luxury Dark Mode, Header Controls (Minimize, Maximize, Theme Toggle, Close)

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
    X, Send, Loader2, Lock, Sparkles, Paperclip, Smile, Headphones, 
    CheckCheck, Package, Milk, Calendar, Tag, Truck, User, Minus, Maximize2, Minimize2, Sun, Moon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
    showQuickActions?: boolean;
}

interface ConversationEntry {
    role: "user" | "assistant";
    content: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || "/api";

const WELCOME_MSG = "Hello! 👋\nI’m MM Assistant, your AI Dairy Assistant.\n\nI can help you with products, orders, subscriptions, delivery, offers, and more.\n\nHow can I help you today?";

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function getFormattedTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Quick Action Options ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
    { label: "Track Order", icon: Package, query: "Track my order" },
    { label: "Browse Products", icon: Milk, query: "What products do you offer and what are their prices?" },
    { label: "My Subscription", icon: Calendar, query: "Show my active milk subscriptions" },
    { label: "Offers", icon: Tag, query: "What discounts and offers are available today?" },
    { label: "Delivery Help", icon: Truck, query: "Tell me about delivery areas and morning timings" },
    { label: "Talk to Human", icon: User, query: "I want to talk to human support" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true); // Default Dark Mode

    const [messages, setMessages] = useState<Message[]>([
        { id: "welcome", role: "assistant", content: WELCOME_MSG, timestamp: getFormattedTime(), showQuickActions: true }
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
        supabase.auth.getSession().then(({ data }) => {
            setUserId(data.session?.user?.id ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setUserId(session?.user?.id ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading, isMinimized]);

    // ── Focus input when opened ──────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 120);
    }, [isOpen, isMinimized]);

    // ── Build conversation history for context ───────────────────────────────
    const buildHistory = useCallback((): ConversationEntry[] => {
        return messages
            .filter(m => m.id !== "welcome")
            .slice(-12)
            .map(m => ({ role: m.role, content: m.content }));
    }, [messages]);

    // ── Render message content (Markdown-lite formatted) ─────────────────────
    const renderContent = (content: string) => {
        const lines = content.split('\n');
        
        return (
            <div className={`space-y-1.5 text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-[#E6F0EC]" : "text-[#1C2E26]"}`}>
                {lines.map((line, lineIdx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return <div key={lineIdx} className="h-1.5" />;

                    // Handle Bullet Points
                    const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
                    const cleanLine = isBullet ? trimmedLine.slice(2) : line;

                    // Bold text (**text**)
                    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
                    const renderedLine = parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <strong key={i} className={`font-extrabold ${isDarkMode ? "text-[#D9A441]" : "text-[#0D4D36]"}`}>
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        
                        // Handle Emails / Links
                        const emailParts = part.split(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                        return emailParts.map((ePart, ei) => {
                            if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+$/gi.test(ePart)) {
                                return (
                                    <a 
                                        key={`${i}-${ei}`} 
                                        href={`mailto:${ePart}`} 
                                        className={`font-bold underline hover:opacity-80 transition-opacity ${isDarkMode ? "text-[#D9A441]" : "text-[#0D4D36]"}`}
                                    >
                                        {ePart}
                                    </a>
                                );
                            }
                            return ePart;
                        });
                    });

                    return (
                        <div key={lineIdx} className={isBullet ? "flex gap-2 items-start pl-1" : ""}>
                            {isBullet && (
                                <span className={`mt-2 h-1.5 w-1.5 rounded-full flex-shrink-0 ${isDarkMode ? "bg-[#D9A441]" : "bg-[#0D4D36]"}`} />
                            )}
                            <span className={isBullet ? "text-xs sm:text-sm leading-relaxed" : "inline-block text-xs sm:text-sm leading-relaxed"}>
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
            let reply = "";

            // 1. Primary: Call Real AI Agent API Endpoint (/api/chat)
            try {
                const res = await fetch(`${AI_AGENT_URL}/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text, userId, history: currentHistory, sessionId })
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    if (data?.reply || data?.response) {
                        const candidate = data.reply || data.response;
                        if (!candidate.includes("I can assist with MMVALI Dairy Farm products, prices")) {
                            reply = candidate;
                        }
                    }
                }
            } catch (apiErr) {
                console.warn("[ChatWidget] Primary API endpoint error:", apiErr);
            }

            // 2. Secondary: Fallback to Supabase Edge Function
            if (!reply) {
                try {
                    const { data, error } = await supabase.functions.invoke('chat', {
                        body: { message: text, userId, history: currentHistory, sessionId }
                    });
                    if (!error && (data?.reply || data?.response)) {
                        reply = data.reply || data.response;
                    }
                } catch (sfErr) {
                    console.warn("[ChatWidget] Supabase function invocation:", sfErr);
                }
            }

            if (!reply) {
                reply = "I am currently in fallback mode. For immediate assistance, please contact us on WhatsApp: +91 99590 91618.";
            }

            setMessages(prev => [...prev, { 
                id: uid(), 
                role: "assistant", 
                content: reply, 
                timestamp: getFormattedTime() 
            }]);

        } catch (err: unknown) {
            console.error("[ChatWidget]", err);
            setMessages(prev => [
                ...prev,
                { id: uid(), role: "assistant", content: "I'm having trouble connecting right now. Please reach us on WhatsApp: +91 99590 91618.", timestamp: getFormattedTime() }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [userId, sessionId]);

    // ── Handle send button / Enter ───────────────────────────────────────────
    const handleSend = useCallback(async (customText?: string) => {
        const text = (customText || input).trim();
        if (!text || isLoading) return;

        const userMsg: Message = { id: uid(), role: "user", content: text, timestamp: getFormattedTime() };
        const history = buildHistory();
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        await sendMessage(text, history);
    }, [input, isLoading, buildHistory, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleAttachmentClick = () => {
        toast({
            title: "Attachment",
            description: "You can send photos or order receipts directly to WhatsApp: +91 99590 91618",
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* FAB Launcher (Shown when completely closed) */}
            <button
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-[#061A13] hover:bg-[#092B20] z-50 p-1 flex items-center justify-center transition-all duration-300 hover:scale-105 overflow-hidden border-2 border-[#C98A24] ring-4 ring-[#C98A24]/20 group"
                onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                style={{ display: !isOpen ? "flex" : "none" }}
                aria-label="Open MM Assistant"
            >
                <div className="relative w-full h-full rounded-full overflow-hidden">
                    <img src="/mm-assistant-avatar.png" alt="MM Assistant" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#061A13]" />
                </div>
            </button>

            {/* Minimized Floating Bar Mode */}
            {isOpen && isMinimized && (
                <div 
                    className={`fixed bottom-6 right-6 w-80 h-14 rounded-full shadow-2xl z-50 px-4 py-2 flex items-center justify-between border-2 cursor-pointer transition-all animate-in fade-in duration-200 group ${
                        isDarkMode ? "bg-[#061A13] border-[#C98A24]/60 text-white hover:bg-[#092B20]" : "bg-[#093826] border-white text-white hover:bg-[#062418]"
                    }`}
                    onClick={() => setIsMinimized(false)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-white/60 shrink-0">
                            <img src="/mm-assistant-avatar.png" alt="MM Assistant" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xs leading-none text-white flex items-center gap-1.5">
                                MM Assistant
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </h4>
                            <p className="text-[10px] text-emerald-200/90 mt-0.5">Click to expand chat</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 rounded-full" 
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                            title="Expand"
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 rounded-full" 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
                            title="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Chat Window Container (Standard & Maximized) */}
            {isOpen && !isMinimized && (
                <div className={
                    isMaximized
                        ? `fixed inset-3 sm:inset-6 max-w-6xl max-h-[92vh] m-auto rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col border animate-in zoom-in-95 duration-200 ${
                            isDarkMode ? "bg-[#061A13] border-emerald-500/30 text-white shadow-emerald-950/50" : "bg-white border-slate-200 text-slate-900"
                          }`
                        : `fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[410px] h-[640px] max-h-[90vh] rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col border animate-in slide-in-from-bottom-5 duration-300 ${
                            isDarkMode ? "bg-[#061A13] border-emerald-500/30 text-white shadow-emerald-950/50" : "bg-white border-slate-200/80 text-slate-900"
                          }`
                }>

                    {/* Header with Dairy Farm Landscape Background */}
                    <div className="relative h-32 w-full p-4 flex flex-col justify-between overflow-hidden shadow-sm shrink-0">
                        {/* Background Image & Overlay */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center transition-all"
                            style={{ backgroundImage: "url('/mm-assistant-header-bg.png')" }}
                        />
                        <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors ${
                            isDarkMode ? "bg-gradient-to-r from-[#04120D]/95 via-[#061A13]/85 to-[#04120D]/95" : "bg-gradient-to-r from-emerald-950/85 via-emerald-900/70 to-emerald-950/80"
                        }`} />
                        
                        {/* Top Header Controls */}
                        <div className="relative z-10 flex items-start justify-between w-full">
                            <div className="flex items-center gap-3">
                                {/* Large Avatar with Online Dot */}
                                <div className="relative h-14 w-14 rounded-full p-0.5 bg-white/20 backdrop-blur-md shadow-lg shrink-0 border border-white/50">
                                    <img src="/mm-assistant-avatar.png" alt="MM Assistant" className="w-full h-full object-cover rounded-full" />
                                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 ring-2 ring-emerald-500/40" />
                                </div>

                                {/* Title & Subtitle */}
                                <div className="text-white">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-lg leading-tight tracking-tight text-white drop-shadow-sm">
                                            MM Assistant
                                        </h3>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#C98A24]/30 text-[#D9A441] border border-[#C98A24]/40 px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                                            <Sparkles className="h-2.5 w-2.5 text-[#D9A441] fill-[#D9A441]" /> AI
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-emerald-100/90 mt-0.5">Your AI Dairy Assistant</p>
                                    <p className="text-[11px] font-semibold text-emerald-300/90 flex items-center gap-1.5 mt-0.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online • AI-powered
                                    </p>
                                </div>
                            </div>

                            {/* Header Controls: Theme Toggle (Sun/Moon), Minimize (-), Maximize (⤢), Close (✕) */}
                            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xs">
                                {/* Theme Toggle */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors" 
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Sun className="h-3.5 w-3.5 text-[#D9A441]" /> : <Moon className="h-3.5 w-3.5" />}
                                </Button>

                                {/* Minimize Icon */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors" 
                                    onClick={() => setIsMinimized(true)}
                                    title="Minimize"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>

                                {/* Maximize / Restore Icon */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors" 
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    title={isMaximized ? "Restore size" : "Maximize"}
                                >
                                    {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </Button>

                                {/* Close Icon */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors" 
                                    onClick={() => setIsOpen(false)}
                                    title="Close"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar transition-colors ${
                        isDarkMode ? "bg-[#08231A]" : "bg-[#F4F6F3]"
                    }`}>
                        {userId ? (
                            <>
                                {messages.map(msg => (
                                    <div key={msg.id} className="space-y-2">
                                        <div className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                            {/* Assistant Avatar */}
                                            {msg.role === "assistant" && (
                                                <div className={`h-8 w-8 rounded-full overflow-hidden shrink-0 border shadow-sm mb-1 ${
                                                    isDarkMode ? "border-[#C98A24]/40" : "border-emerald-600/30"
                                                }`}>
                                                    <img src="/mm-assistant-avatar.png" alt="MM Assistant" className="w-full h-full object-cover" />
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div className={`max-w-[84%] p-4 rounded-2xl shadow-sm text-sm border transition-all ${
                                                msg.role === "user"
                                                    ? isDarkMode
                                                        ? "bg-[#C98A24] text-[#04120D] font-medium rounded-br-xs border-[#C98A24]"
                                                        : "bg-[#093826] text-white rounded-br-xs border-[#093826]"
                                                    : isDarkMode
                                                        ? "bg-[#0F3326] border-emerald-500/20 text-[#E6F0EC] rounded-bl-xs"
                                                        : "bg-white border-slate-200/90 text-slate-800 rounded-bl-xs"
                                            }`}>
                                                {msg.role === "user" ? (
                                                    <p className={`text-xs sm:text-sm leading-relaxed font-semibold ${isDarkMode ? "text-[#04120D]" : "text-white"}`}>
                                                        {msg.content}
                                                    </p>
                                                ) : (
                                                    renderContent(msg.content)
                                                )}

                                                {/* Timestamp & Status */}
                                                <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                                                    msg.role === "user" 
                                                        ? isDarkMode ? "text-[#04120D]/70 font-bold" : "text-emerald-200/80" 
                                                        : isDarkMode ? "text-emerald-300/50" : "text-slate-400"
                                                }`}>
                                                    <span>{msg.timestamp || getFormattedTime()}</span>
                                                    {msg.role === "user" && (
                                                        <CheckCheck className={`h-3.5 w-3.5 ${isDarkMode ? "text-[#04120D]" : "text-emerald-300"}`} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions Grid */}
                                        {msg.showQuickActions && (
                                            <div className="pl-10 pt-1 pr-2">
                                                <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${
                                                    isDarkMode ? "text-[#D9A441]" : "text-slate-500"
                                                }`}>
                                                    <Sparkles className="h-3 w-3 text-[#D9A441]" /> Quick Actions
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {QUICK_ACTIONS.map((action, idx) => {
                                                        const IconComp = action.icon;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleSend(action.query)}
                                                                className={`flex items-center gap-2 p-2.5 text-left text-xs font-semibold rounded-xl border transition-all shadow-2xs ${
                                                                    isDarkMode 
                                                                        ? "bg-[#0F3326] hover:bg-[#164735] text-emerald-100 border-emerald-500/30 hover:border-[#D9A441]" 
                                                                        : "bg-white hover:bg-emerald-50 text-emerald-950 border-slate-200 hover:border-emerald-300"
                                                                }`}
                                                            >
                                                                <IconComp className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-[#D9A441]" : "text-emerald-700"}`} />
                                                                <span className="truncate">{action.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start items-end gap-2">
                                        <div className={`h-8 w-8 rounded-full overflow-hidden shrink-0 border shadow-sm ${
                                            isDarkMode ? "border-[#C98A24]/40" : "border-emerald-600/30"
                                        }`}>
                                            <img src="/mm-assistant-avatar.png" alt="MM Assistant" className="w-full h-full object-cover" />
                                        </div>
                                        <div className={`p-3 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-2 border ${
                                            isDarkMode ? "bg-[#0F3326] border-emerald-500/20 text-emerald-200" : "bg-white border-slate-200 text-slate-500"
                                        }`}>
                                            <Loader2 className={`h-4 w-4 animate-spin ${isDarkMode ? "text-[#D9A441]" : "text-emerald-700"}`} />
                                            <span className="text-xs font-semibold">MM Assistant is thinking…</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Login Required View */
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 animate-in fade-in duration-300">
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center border ${
                                    isDarkMode ? "bg-[#0F3326] border-emerald-500/30 text-[#D9A441]" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}>
                                    <Lock className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className={`font-extrabold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>Sign in to Chat</h4>
                                    <p className={`text-xs leading-relaxed max-w-[240px] mx-auto ${isDarkMode ? "text-emerald-200/80" : "text-slate-500"}`}>
                                        Please sign in to chat with <strong>MM Assistant</strong> and view your orders.
                                    </p>
                                </div>
                                <Link to="/auth" onClick={() => setIsOpen(false)} className="w-full pt-2">
                                    <Button className={`w-full rounded-xl font-bold py-3 text-xs uppercase tracking-wider shadow-md ${
                                        isDarkMode ? "bg-[#C98A24] hover:bg-[#D9A441] text-[#04120D] border border-[#C98A24]" : "bg-[#093826] hover:bg-[#062418] text-white border border-[#093826]"
                                    }`}>
                                        Sign In Now
                                    </Button>
                                </Link>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Composer & Footer Area */}
                    {userId && (
                        <div className={`shrink-0 border-t ${
                            isDarkMode ? "bg-[#061A13] border-emerald-500/20" : "bg-white border-slate-200"
                        }`}>
                            {/* Input Container */}
                            <div className="p-3">
                                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all border ${
                                    isDarkMode 
                                        ? "bg-[#0B2A1F] border-emerald-500/30 focus-within:border-[#C98A24]" 
                                        : "bg-slate-50 border-slate-200 focus-within:border-emerald-600"
                                }`}>
                                    {/* Attachment Icon */}
                                    <button 
                                        type="button" 
                                        onClick={handleAttachmentClick}
                                        className={`transition-colors p-1.5 rounded-full ${
                                            isDarkMode ? "text-emerald-400/70 hover:text-[#D9A441] hover:bg-white/5" : "text-slate-400 hover:text-emerald-700 hover:bg-slate-200/50"
                                        }`}
                                        title="Attach receipt or photo"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </button>

                                    {/* Text Input */}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Ask MM Assistant anything…"
                                        className={`flex-1 bg-transparent text-xs sm:text-sm focus:outline-none py-1 ${
                                            isDarkMode ? "text-white placeholder:text-emerald-300/40" : "text-slate-800 placeholder:text-slate-400"
                                        }`}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading}
                                    />

                                    {/* Emoji Hint */}
                                    <button 
                                        type="button" 
                                        onClick={() => setInput(prev => prev + " 😊")}
                                        className={`transition-colors p-1.5 rounded-full hidden sm:block ${
                                            isDarkMode ? "text-emerald-400/70 hover:text-[#D9A441] hover:bg-white/5" : "text-slate-400 hover:text-emerald-700 hover:bg-slate-200/50"
                                        }`}
                                    >
                                        <Smile className="h-4 w-4" />
                                    </button>

                                    {/* Send Button */}
                                    <Button 
                                        size="icon" 
                                        className={`rounded-full h-9 w-9 flex-shrink-0 shadow-sm transition-transform active:scale-95 disabled:opacity-50 ${
                                            isDarkMode ? "bg-[#C98A24] hover:bg-[#D9A441] text-[#04120D]" : "bg-[#093826] hover:bg-[#062418] text-white"
                                        }`} 
                                        onClick={() => handleSend()} 
                                        disabled={!input.trim() || isLoading}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Support Footer Bar */}
                            <div className={`px-4 py-2 border-t flex items-center justify-between text-xs ${
                                isDarkMode ? "bg-[#04120D] border-white/5" : "bg-emerald-900/5 border-slate-100"
                            }`}>
                                <span className={`flex items-center gap-1.5 font-medium ${
                                    isDarkMode ? "text-emerald-300/70" : "text-slate-500"
                                }`}>
                                    <Headphones className={`h-3.5 w-3.5 ${isDarkMode ? "text-[#D9A441]" : "text-emerald-700"}`} /> Need human help?
                                </span>
                                <a 
                                    href="https://wa.me/919959091618" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`font-bold flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
                                        isDarkMode 
                                            ? "bg-[#C98A24]/20 hover:bg-[#C98A24]/30 text-[#D9A441] border-[#C98A24]/40" 
                                            : "bg-emerald-100/60 hover:bg-emerald-100 text-emerald-800 border-emerald-200/60"
                                    }`}
                                >
                                    <User className="h-3 w-3" /> Talk to Support
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
