import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useStaffAuth = () => {
    const { user, loading: authLoading } = useAuth();
    const [isStaff, setIsStaff] = useState(false);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const checkStaffRole = async () => {
            if (!user) {
                setIsStaff(false);
                setRole(null);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (error) {
                    console.error("Error checking staff role:", error);
                    setIsStaff(false);
                    setRole(null);
                } else {
                    const userRole = data?.role;
                    setRole(userRole || null);
                    setIsStaff((userRole as any) === "staff" || (userRole as any) === "admin" || (userRole as any) === "delivery_boy");
                }
            } catch (err) {
                console.error("Error in staff check:", err);
                setIsStaff(false);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            checkStaffRole();
        }
    }, [user, authLoading]);

    return { isStaff, role, loading: loading || authLoading, user };
};
