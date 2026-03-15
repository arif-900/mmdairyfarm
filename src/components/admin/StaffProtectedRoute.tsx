import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Loader2 } from "lucide-react";

interface StaffProtectedRouteProps {
    children: ReactNode;
}

export const StaffProtectedRoute = ({ children }: StaffProtectedRouteProps) => {
    const { isStaff, role, loading, user } = useStaffAuth();
    const location = window.location.pathname;

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
        return <Navigate to="/delivery/login" replace />;
    }

    if (!isStaff) {
        return <Navigate to="/" replace />;
    }

    // Role-based steering
    if (role === 'delivery_boy' && location.startsWith('/staff/dashboard')) {
        return <Navigate to="/delivery/dashboard" replace />;
    }

    if ((role === 'staff' || role === 'admin') && location.startsWith('/delivery/login')) {
        return <Navigate to="/staff/dashboard" replace />;
    }

    return <>{children}</>;
};
