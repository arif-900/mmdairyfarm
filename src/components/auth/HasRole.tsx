import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface HasRoleProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export const HasRole = ({ children, allowedRoles, fallback = null }: HasRoleProps) => {
  const { role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
