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
            <section className="bg-[#061A13] min-h-[85vh] flex items-center justify-center p-4 sm:p-6 text-[#F5F3EC] font-sans">
                <div className="max-w-md w-full mx-auto">
                    <div className="bg-[#0B2118] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 rounded-2xl bg-[#10291F] border border-white/10 flex items-center justify-center mx-auto text-[#C98A24] shadow-xl">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F5F3EC] uppercase tracking-tight">
                                RESET <span className="text-[#C98A24]">PASSWORD</span>
                            </h1>
                            <p className="text-xs text-[#AAB8B0] leading-relaxed">
                                {isSent
                                    ? "Check your inbox for step-by-step instructions"
                                    : "Enter your email address to receive a secure password reset link"
                                }
                            </p>
                        </div>

                        {isSent ? (
                            <div className="text-center space-y-4 pt-2">
                                <p className="text-xs text-[#AAB8B0]">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Button
                                    onClick={() => setIsSent(false)}
                                    className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] border border-white/20 shadow-xl"
                                >
                                    Try Again
                                </Button>
                                <Link
                                    to="/auth"
                                    className="inline-flex items-center text-xs font-bold text-[#C98A24] hover:underline pt-2"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs font-bold text-[#F5F3EC]">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A24]" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 text-sm rounded-xl bg-[#10291F] border-white/10 text-[#F5F3EC] placeholder:text-[#718078] focus:border-[#C98A24]"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] border border-[#C98A24] shadow-xl mt-4"
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

                                <div className="pt-4 text-center">
                                    <Link
                                        to="/auth"
                                        className="inline-flex items-center text-xs font-bold text-[#AAB8B0] hover:text-[#C98A24] hover:underline"
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
