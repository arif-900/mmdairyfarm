import { ReactNode, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { ChatWidget } from "../chat/ChatWidget";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isStaff, role, loading } = useStaffAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Only redirect if they are on a non-auth customer page
    // The /auth page has its own aggressive signOut logic for staff trying to login there
    if (!loading && isStaff && location.pathname !== '/auth') {
      // If a staff member is detected on a customer page (e.g., via cross-tab login)
      // Redirect them to their proper portal instead of signing them out,
      // so we don't destroy their valid session in the other tab.
      toast({
        title: "Redirecting...",
        description: "Staff accounts must use the dedicated portal. Moving you there now.",
      });
      
      if (role === "delivery_boy") {
        navigate("/delivery/dashboard", { replace: true });
      } else {
        navigate("/staff/dashboard", { replace: true });
      }
    }
  }, [isStaff, role, loading, navigate, location.pathname, toast]);

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
    </div>
  );
};

export default Layout;
