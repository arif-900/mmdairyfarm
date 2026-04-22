import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth but save the attempted path
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
