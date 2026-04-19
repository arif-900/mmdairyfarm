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
            <section className="section-padding min-h-[70vh] flex items-center">
                <div className="container-main max-w-md mx-auto">
                    <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card animate-scale-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="font-display text-2xl font-bold text-foreground">
                                New Password
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Enter your new password below
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={6}
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
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
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
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default ResetPassword;
