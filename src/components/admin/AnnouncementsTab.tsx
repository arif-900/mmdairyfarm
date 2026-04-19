import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Megaphone, Loader2, Power, PowerOff } from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    message: string;
    is_active: boolean;
    created_at: string;
}

export function AnnouncementsTab() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    const { toast } = useToast();

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await (supabase as any)
                .from("announcements")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error: any) {
            console.error("Error fetching announcements:", error);
            toast({
                title: "Failed to load announcements",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        try {
            setIsSubmitting(true);
            const { error } = await (supabase as any)
                .from("announcements")
                .insert([{ title, message, is_active: true }]);

            if (error) throw error;

            toast({
                title: "Announcement created",
                description: "The announcement is now live on the website.",
            });

            setTitle("");
            setMessage("");
            fetchAnnouncements();
        } catch (error: any) {
            toast({
                title: "Error creating announcement",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await (supabase as any)
                .from("announcements")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;

            fetchAnnouncements();
            toast({ title: `Announcement \${!currentStatus ? 'activated' : 'deactivated'}` });
        } catch (error: any) {
            toast({
                title: "Error updating status",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const { error } = await (supabase as any)
                .from("announcements")
                .delete()
                .eq("id", id);

            if (error) throw error;

            fetchAnnouncements();
            toast({ title: "Announcement deleted" });
        } catch (error: any) {
            toast({
                title: "Error deleting announcement",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Create New Announcement</h3>
                </div>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <Input
                            placeholder="e.g., Heavy Rain Alert"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <Textarea
                            placeholder="e.g., Deliveries might be delayed by 1 hour today due to heavy rains."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={3}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting || !title.trim() || !message.trim()} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Publish Announcement
                    </Button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Recent Announcements</h3>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p>No announcements found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className={`p-4 transition-colors \${announcement.is_active ? 'bg-white' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-semibold truncate \${announcement.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                                                {announcement.title}
                                            </h4>
                                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold \${announcement.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {announcement.is_active ? 'Live' : 'Hidden'}
                                            </span>
                                        </div>
                                        <p className={`text-sm \${announcement.is_active ? 'text-gray-600' : 'text-gray-400'} break-words`}>
                                            {announcement.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(announcement.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <Button
                                            variant={announcement.is_active ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                                            className="h-8 w-8 p-0"
                                            title={announcement.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {announcement.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(announcement.id)}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
