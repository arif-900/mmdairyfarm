import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
    const { sendPasswordResetEmail } = useAuth();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            const { error } = await sendPasswordResetEmail(email);
            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                setIsSent(true);
                toast({
                    title: "Reset Link Sent",
                    description: "Check your email for the password reset link",
                });
            }
        } catch (err) {
            console.error("Forgot password error:", err);
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <section className="section-padding min-h-[70vh] flex items-center">
                <div className="container-main max-w-md mx-auto">
                    <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card animate-scale-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="font-display text-2xl font-bold text-foreground">
                                Reset Password
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {isSent
                                    ? "Check your email for instructions"
                                    : "Enter your email and we'll send you a link to reset your password"
                                }
                            </p>
                        </div>

                        {isSent ? (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsSent(false)}
                                    className="w-full"
                                >
                                    Try Again
                                </Button>
                                <Link
                                    to="/auth"
                                    className="inline-flex items-center text-sm text-primary hover:underline"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="accent"
                                    size="lg"
                                    className="w-full mt-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>

                                <div className="mt-6 text-center">
                                    <Link
                                        to="/auth"
                                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary hover:underline"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default ForgotPassword;
