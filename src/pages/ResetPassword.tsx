import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
    const navigate = useNavigate();
    const { updatePassword, session } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Supabase handles the recovery session automatically when the user clicks the link.
        // If there's no session, they shouldn't be here unless they're visiting it manually (which won't work).
        if (!session) {
            // We could add a check here, but sometimes session takes a moment to load.
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "Passwords do not match",
                description: "Please make sure both passwords are the same",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await updatePassword(password);
            if (error) {
                toast({
                    title: "Error resetting password",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Your password has been reset successfully. You can now login with your new password.",
                });
                navigate("/auth");
            }
        } catch (err) {
            console.error("Reset password error:", err);
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
                                <Lock className="w-8 h-8" />
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F5F3EC] uppercase tracking-tight">
                                NEW <span className="text-[#C98A24]">PASSWORD</span>
                            </h1>
                            <p className="text-xs text-[#AAB8B0] leading-relaxed">
                                Enter your new secure password below to complete reset
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-xs font-bold text-[#F5F3EC]">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A24]" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 text-sm rounded-xl bg-[#10291F] border-white/10 text-[#F5F3EC] placeholder:text-[#718078] focus:border-[#C98A24]"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#F5F3EC]">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C98A24]" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 h-12 text-sm rounded-xl bg-[#10291F] border-white/10 text-[#F5F3EC] placeholder:text-[#718078] focus:border-[#C98A24]"
                                        required
                                        minLength={6}
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
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
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
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default ResetPassword;
