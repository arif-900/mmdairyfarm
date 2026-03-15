import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Smartphone, LogIn } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { user, signIn, signUp, signInWithGoogle, signInWithPhone, verifyPhoneOtp, signOut } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    otp: "",
  });

  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; phone?: string; otp?: string }>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Check for session in URL errors
  useEffect(() => {
    const errorDesc = searchParams.get("error_description");
    if (errorDesc) {
      toast({
        title: "Authentication Error",
        description: errorDesc,
        variant: "destructive",
      });
      // Clear URL params to avoid persistent toast
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  // If user is already logged in, redirect away (with role-based routing)
  useEffect(() => {
    if (user) {
      const checkRoleAndRedirect = async () => {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const role = data?.role;
        
        // Strictly block staff and admins from main web login
        if ((role as any) === 'delivery_boy' || (role as any) === 'staff' || (role as any) === 'admin') {
          console.log("Blocking non-customer login on main site");
          toast({
            title: "Access Restricted",
            description: "Please use the dedicated staff or delivery portal for your account. This page is for customers only.",
            variant: "destructive",
          });
          // Use our robust signOut from context to ensure state is cleared even if server throws 403
          await signOut();
          return;
        }

        navigate(redirect, { replace: true });
      };
      checkRoleAndRedirect();
    }
  }, [user, navigate, redirect]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    console.log("Auth Page: Initiating Google Login...");
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Auth Page: Google Login Error:", error);
        toast({
          title: "Google Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Google login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) {
      setErrors({ phone: "Phone number is required" });
      return;
    }

    setIsLoading(true);
    try {
      if (!otpSent) {
        // Step 1: Send OTP
        const { error } = await signInWithPhone(formData.phone);
        if (error) {
          toast({
            title: "Failed to send OTP",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setOtpSent(true);
          toast({
            title: "OTP Sent",
            description: "Check your phone for the verification code",
          });
        }
      } else {
        // Step 2: Verify OTP
        const { error } = await verifyPhoneOtp(formData.phone, formData.otp);
        if (error) {
          toast({
            title: "Verification Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome!",
            description: "Successfully signed in with phone",
          });
          navigate(redirect);
        }
      }
    } catch (err) {
      console.error("Phone auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = authSchema.safeParse(formData);

    // Manual validation for Name during signup
    let hasError = false;
    const fieldErrors: { fullName?: string; email?: string; password?: string } = {};

    if (!isLogin && !formData.fullName.trim()) {
      fieldErrors.fullName = "Full name is required";
      hasError = true;
    }

    if (!result.success) {
      result.error.errors.forEach((err) => {
        const field = err.path[0] as "email" | "password";
        fieldErrors[field] = err.message;
      });
      hasError = true;
    }

    if (hasError) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in",
          });
          // Role-based redirect is handled by the useEffect watching `user`
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created!",
            description: "You can now place orders",
          });
          navigate(redirect);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
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
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLogin
                  ? "Sign in to continue your order"
                  : "Sign up to start ordering fresh dairy"
                }
              </p>
            </div>

            {/* Auth Method Tabs */}
            {isLogin && (
              <div className="flex bg-muted p-1 rounded-lg mb-6">
                <button
                  onClick={() => { setAuthMethod("email"); setOtpSent(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMethod === "email" ? "bg-background shadow-sm" : "hover:text-foreground/80"
                    }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMethod === "phone" ? "bg-background shadow-sm" : "hover:text-foreground/80"
                    }`}
                >
                  Phone
                </button>
              </div>
            )}

            {authMethod === "email" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mt-1">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
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
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    isLogin ? "Sign In" : "Create Account"
                  )}
                </Button>
              </form>
            ) : (
              /* Phone Auth Form */
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="pl-10"
                      required
                      disabled={otpSent || isLoading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                {otpSent && (
                  <div className="animate-fade-in">
                    <Label htmlFor="otp">Verification Code (OTP)</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        value={formData.otp}
                        onChange={(e) => handleChange("otp", e.target.value)}
                        className="pl-10"
                        required
                        maxLength={6}
                      />
                    </div>
                    {errors.otp && (
                      <p className="text-sm text-destructive mt-1">{errors.otp}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-primary mt-2 hover:underline"
                    >
                      Change phone number
                    </button>
                  </div>
                )}

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
                      {otpSent ? "Verifying..." : "Sending OTP..."}
                    </>
                  ) : (
                    otpSent ? "Verify & Login" : "Send OTP"
                  )}
                </Button>
              </form>
            )}

            {/* Social Login Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setAuthMethod("email"); }}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
