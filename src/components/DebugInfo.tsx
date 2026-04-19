import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const DebugInfo = () => {
  const { user, profile, loading } = useAuth();

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from("products").select("count").limit(1);
      console.log("Database connection test:", { data, error });
    } catch (err) {
      console.error("Database connection error:", err);
    }
  };

  const testEdgeFunction = async () => {
    if (!user) {
      console.log("No user logged in for edge function test");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: [{
            name: "Test Product",
            description: "Test",
            price: 100,
            quantity: 1,
            unit: "liter"
          }],
          deliveryType: "one-time",
          shippingAddress: "Test Address",
          phone: "9876543210",
          paymentMethod: "cod"
        }
      });
      console.log("Edge function test result:", { data, error });
    } catch (err) {
      console.error("Edge function test error:", err);
    }
  };

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Auth Loading: {loading ? "Yes" : "No"}</div>
        <div>User: {user ? "Logged in" : "Not logged in"}</div>
        <div>Profile: {profile ? "Loaded" : "Not loaded"}</div>
        <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? "Set" : "Missing"}</div>
        <div>Supabase Key: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Set" : "Missing"}</div>
      </div>
      <div className="mt-2 space-x-2">
        <button onClick={testConnection} className="bg-blue-600 px-2 py-1 rounded text-xs">
          Test DB
        </button>
        <button onClick={testEdgeFunction} className="bg-green-600 px-2 py-1 rounded text-xs">
          Test Function
        </button>
      </div>
    </div>
  );
};

export default DebugInfo;