import { ReactNode, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { ChatWidget } from "../chat/ChatWidget";
import InstallBanner from "./InstallBanner";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { PWAUpdateHandler } from "./PWAUpdateHandler";
import { OfflineStatus } from "./OfflineStatus";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardByRole } from "@/utils/routeUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Only redirect if they are on a non-auth customer page
    // The /auth page has its own aggressive signOut logic for staff trying to login there
    const isStaffRole = role === "staff" || role === "admin" || role === "delivery_boy";

    if (!loading && isStaffRole && location.pathname !== '/auth') {
      // If a staff member is detected on a customer page (e.g., via cross-tab login)
      // Redirect them to their proper portal instead of signing them out,
      // so we don't destroy their valid session in the other tab.
      toast({
        title: "Redirecting...",
        description: "Staff accounts must use the dedicated portal. Moving you there now.",
      });
      
      const dashboard = getDashboardByRole(role);
      navigate(dashboard, { replace: true });
    }
  }, [role, loading, navigate, location.pathname, toast]);

  // Optionally, we could return a blank screen while `loading && isStaff` is true
  // but rendering children normally ensures normal customers don't see a loading flash.
  // The staff user will see a split second of the page before being kicked.

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
      <InstallBanner />
      <PWAUpdateHandler />
      <OfflineStatus />
    </div>
  );
};

export default Layout;
