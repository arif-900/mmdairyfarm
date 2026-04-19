import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface FeedbackItem {
    id: string;
    order_id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles: { full_name: string; phone: string } | null;
}

export function FeedbackTab() {
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setIsLoading(true);
            const { data: feedbackData, error: feedbackError } = await (supabase as any)
                .from("order_feedback")
                .select("id, order_id, rating, comment, created_at, user_id")
                .order("created_at", { ascending: false });

            if (feedbackError) throw feedbackError;

            const feedbacks = feedbackData || [];

            if (feedbacks.length > 0) {
                const userIds = [...new Set(feedbacks.map((f: any) => f.user_id).filter(Boolean))];
                let profilesMap: Record<string, any> = {};

                if (userIds.length > 0) {
                    const { data: profilesData } = await (supabase as any)
                        .from("profiles")
                        .select("id, full_name, phone")
                        .in("id", userIds);

                    if (profilesData) {
                        profilesMap = profilesData.reduce((acc: any, profile: any) => {
                            acc[profile.id] = profile;
                            return acc;
                        }, {});
                    }
                }

                const mergedData = feedbacks.map((item: any) => ({
                    ...item,
                    profiles: item.user_id ? profilesMap[item.user_id] || null : null,
                }));

                setFeedbackList(mergedData);
            } else {
                setFeedbackList([]);
            }
        } catch (error: any) {
            console.error("Error fetching feedback:", error);
            toast({
                title: "Failed to load feedback",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "fill-transparent text-gray-300"}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-gray-800">Customer Feedback</h3>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : feedbackList.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p>No feedback received yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="min-w-[250px]">Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbackList.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {format(new Date(item.created_at), "dd MMM, p")}
                                        </TableCell>
                                        <TableCell>
                                            {item.profiles ? (
                                                <div>
                                                    <p className="font-medium text-foreground">{item.profiles.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.profiles.phone}</p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Anonymous</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            #{item.order_id.slice(0, 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell>
                                            {renderStars(item.rating)}
                                        </TableCell>
                                        <TableCell>
                                            {item.comment ? (
                                                <p className="text-sm text-foreground break-words bg-gray-50 p-2 rounded border border-gray-100">{item.comment}</p>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No comment provided</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
