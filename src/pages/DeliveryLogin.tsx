import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bike, Loader2, Eye, EyeOff } from "lucide-react";

const DeliveryLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const { isStaff, role, loading, user } = useStaffAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Redirect if already logged in with correct role
    useEffect(() => {
        if (!loading && user && role === 'delivery_boy') {
            navigate("/delivery/dashboard");
        }
    }, [loading, user, isStaff, role, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await signIn(email, password);

            if (error) {
                toast({
                    title: "Login Failed",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }
            
            // Redirection is handled by the useEffect above
        } catch (err) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <Card className="w-full max-w-md shadow-2xl border-none rounded-[2rem] overflow-hidden">
                <CardHeader className="text-center space-y-4 pb-2 pt-8">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-inner">
                        <Bike className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Delivery Portal</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                            MMVALI Dairy Farm
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5 font-medium focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5 font-medium pr-12 focus:ring-primary/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    SECURE LOGIN...
                                </>
                            ) : (
                                "START DELIVERING"
                            )}
                        </Button>
                    </form>
                    
                    <div className="mt-8 text-center px-4">
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            By logging in, you agree to our delivery safety guidelines and professional conduct policy.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DeliveryLogin;
