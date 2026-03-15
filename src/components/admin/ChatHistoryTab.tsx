import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export function ChatHistoryTab() {
    const [sessions, setSessions] = useState<{ session_id: string; messages: any[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchChatHistory();
    }, []);

    const fetchChatHistory = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from("chat_history")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Group by session_id
            const grouped = (data || []).reduce((acc: any, curr: any) => {
                if (!acc[curr.session_id]) acc[curr.session_id] = [];
                acc[curr.session_id].push(curr);
                return acc;
            }, {});

            // Convert to array and sort by latest message
            const sessionArray = Object.keys(grouped).map(sessionId => ({
                session_id: sessionId,
                messages: grouped[sessionId]
            })).sort((a, b) => {
                const lastA = new Date(a.messages[a.messages.length - 1].created_at).getTime();
                const lastB = new Date(b.messages[b.messages.length - 1].created_at).getTime();
                return lastB - lastA; // descending
            });

            setSessions(sessionArray);
        } catch (err) {
            console.error("Error fetching chat history:", err);
            toast({
                title: "Error",
                description: "Failed to load chat history",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = sessions.filter(session => {
        if (!searchTerm) return true;
        return session.messages.some((m: any) => m.content.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No chat history found</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredSessions.map((session) => (
                        <div key={session.session_id} className="border rounded-xl bg-card overflow-hidden">
                            <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center text-sm text-muted-foreground">
                                <span className="font-mono text-xs">Session: {session.session_id.slice(0, 8)}...</span>
                                <span>
                                    {format(new Date(session.messages[session.messages.length - 1].created_at), "dd MMM, p")}
                                </span>
                            </div>
                            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                                {session.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm \${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted text-foreground border rounded-tl-sm'
                    }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
