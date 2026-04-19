import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, X } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    message: string;
}

export function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const { data, error } = await (supabase as any)
                .from('announcements')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setAnnouncements(data as Announcement[]);
            }
        };

        fetchAnnouncements();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('public:announcements')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'announcements' },
                () => {
                    fetchAnnouncements();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    if (!isVisible || announcements.length === 0) return null;

    // Join messages together if there are multiple active
    const displayText = announcements.map(a => `${a.title}: ${a.message}`).join("  •  ");

    return (
        <div className="bg-primary text-white px-4 py-2 flex items-center justify-between relative z-50 overflow-hidden">
            <div className="flex bg-primary z-10 pr-2 items-center shrink-0 shadow-[10px_0_10px_-5px_rgba(var(--primary),1)]">
                <Megaphone className="h-4 w-4 mr-2 hidden sm:block animate-pulse" />
                <span className="font-semibold text-sm uppercase tracking-wider hidden sm:block whitespace-nowrap">
                    Update:
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative flex items-center mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div className="whitespace-nowrap animate-marquee flex text-sm">
                    <span className="mx-4">{displayText}</span>
                </div>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className="ml-2 bg-primary z-10 pl-2 shrink-0 hover:bg-black/10 rounded-full p-1 transition-colors"
                aria-label="Close banner"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
