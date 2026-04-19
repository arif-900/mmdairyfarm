import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface StaffProtectedRouteProps {
    children: ReactNode;
}

export const StaffProtectedRoute = ({ children }: StaffProtectedRouteProps) => {
    const { role, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    const isDeliveryPath = location.pathname.startsWith('/delivery');
    const isStaffPath = location.pathname.startsWith('/staff');

    if (isDeliveryPath && role !== 'delivery_boy') {
        if (role === 'admin' || role === 'staff') {
             return <Navigate to="/staff/dashboard" replace />;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    if (isStaffPath && (role !== 'staff' && role !== 'admin')) {
        if (role === 'delivery_boy') {
            return <Navigate to="/delivery/dashboard" replace />;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};
