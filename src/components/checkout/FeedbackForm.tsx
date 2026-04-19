import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";

interface FeedbackFormProps {
    orderId: string;
    onSuccess?: () => void;
}

export function FeedbackForm({ orderId, onSuccess }: FeedbackFormProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        checkExistingFeedback();
    }, [orderId]);

    const checkExistingFeedback = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await (supabase as any)
                .from("order_feedback")
                .select("rating, comment")
                .eq("order_id", orderId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setHasSubmitted(true);
                setRating(data.rating);
                setComment(data.comment || "");
            }
        } catch (error) {
            console.error("Error checking feedback:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast({ title: "Please select a rating", variant: "destructive" });
            return;
        }

        try {
            setIsSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("Not authenticated");

            const payload = {
                order_id: orderId,
                user_id: user.id,
                rating,
                comment: comment.trim() || null,
            };

            const { error } = await (supabase as any)
                .from("order_feedback")
                .insert([payload]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error("You have already submitted feedback for this order.");
                }
                throw error;
            }

            setHasSubmitted(true);
            toast({
                title: "Thank You!",
                description: "Your feedback has been recorded.",
            });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    if (hasSubmitted) {
        return (
            <div className="bg-gray-50 border rounded-lg p-4 text-center space-y-2">
                <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-5 w-5 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "fill-transparent text-gray-300"}`} />
                    ))}
                </div>
                <p className="text-sm font-medium text-gray-800">You rated this order</p>
                {comment && (
                    <p className="text-sm text-gray-600 italic bg-white p-3 rounded-md border text-left mt-2 shadow-sm">
                        "{comment}"
                    </p>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">How was your delivery?</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`p-1 transition-colors focus:outline-none rounded-full focus:ring-2 focus:ring-primary/20 ${star <= (hoveredRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                }`}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRating(star);
                            }}
                        >
                            <Star className={`h-8 w-8 pointer-events-none ${star <= (hoveredRating || rating) ? "fill-current" : ""}`} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Any additional comments? (Optional)</label>
                <Textarea
                    placeholder="Tell us what you liked or what we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                />
            </div>

            <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit Feedback
            </Button>
        </form>
    );
}
