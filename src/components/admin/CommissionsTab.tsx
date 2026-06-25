import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Commission = {
    id: string;
    order_id: string;
    staff_id: string;
    amount: number;
    status: 'pending' | 'paid';
    created_at: string;
    profiles?: { full_name: string };
};

export function CommissionsTab() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      // Note: This expects the commissions table to exist and have a relation with profiles
      const { data, error } = await (supabase
        .from("commissions" as any) as any)
        .select(`
          *,
          profiles:staff_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommissions(data as any || []);
    } catch (err) {
      console.error("Error fetching commissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await (supabase
        .from("commissions" as any) as any)
        .update({ status: 'paid' })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Commission Paid",
        description: "Status successfully updated to paid.",
      });
      fetchCommissions();
    } catch (err) {
      console.error("Error updating commission:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-[10px] flex items-center justify-between">
          <div>
            <p className="text-orange-800 text-sm font-medium">Pending Commissions</p>
            <p className="text-2xl font-bold text-orange-900">₹{totalPending.toFixed(2)}</p>
          </div>
          <Clock className="h-8 w-8 text-orange-600 opacity-50" />
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-[10px] flex items-center justify-between">
          <div>
            <p className="text-emerald-800 text-sm font-medium">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-900">
               ₹{commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)}
            </p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-50" />
        </div>
      </div>

      <div className="border rounded-[10px] overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Staff Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No commissions recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((comm) => (
                <TableRow key={comm.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(comm.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{comm.profiles?.full_name || "Unknown"}</TableCell>
                  <TableCell className="font-bold">₹{Number(comm.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      comm.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {comm.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {comm.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(comm.id)}>
                        Mark as Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
