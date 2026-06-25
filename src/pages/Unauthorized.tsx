import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardByRole } from "@/utils/routeUtils";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const handleGoToDashboard = () => {
    navigate(getDashboardByRole(role), { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 p-4 rounded-full mb-6">
          <ShieldAlert className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display text-center mb-4 text-foreground">
          Access Denied
        </h1>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          You don't have permission to view this page. Navigate back to your dashboard or sign in with an authorized account.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleGoToDashboard} variant="default">
            Go to Dashboard
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign in with different account</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Unauthorized;
