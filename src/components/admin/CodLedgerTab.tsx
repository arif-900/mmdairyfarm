import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Bike, 
  IndianRupee, 
  HandCoins, 
  CheckCircle2, 
  Clock, 
  History, 
  PackageCheck, 
  Search,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface LedgerEntry {
  id: string;
  agent_id: string;
  order_id?: string;
  amount: number;
  type: 'COLLECTION' | 'SETTLEMENT';
  status: 'COLLECTED' | 'SUBMITTED' | 'VERIFIED';
  created_at: string;
  notes?: string;
  agent_name?: string;
}

export const CodLedgerTab = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const { toast } = useToast();

  const fetchDeliveryBoys = async () => {
    try {
      // Fetch user IDs with delivery role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "delivery_boy");

      if (roleError) throw roleError;
      
      if (roleData && roleData.length > 0) {
        const userIds = roleData.map(r => r.user_id);
        
        // Fetch profiles for those user IDs
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, settlement_requested")
          .in("user_id", userIds);
          
        if (profileError) throw profileError;

        // Merge them
        const merged = roleData.map(role => ({
          ...role,
          profiles: profileData?.find(p => p.user_id === role.user_id) || { full_name: "Unknown Agent" }
        }));
        
        setDeliveryBoys(merged);
      } else {
        setDeliveryBoys([]);
      }
    } catch (error) {
      console.error("Error fetching delivery boys:", error);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("cod_ledger")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedAgentId !== "all") {
        query = query.eq("agent_id", selectedAgentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enhance with agent names
      if (data && data.length > 0) {
        const agentIds = [...new Set(data.map((e: any) => e.agent_id))];
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", agentIds);

        const profileMap = profileData?.reduce((acc: any, p: any) => {
          acc[p.user_id] = p.full_name;
          return acc;
        }, {});

        const enhanced = data.map((e: any) => ({
          ...e,
          agent_name: profileMap[e.agent_id] || "Unknown Agent"
        }));
        setEntries(enhanced);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast({
        title: "Fetch Failed",
        description: "Could not load ledger data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
    fetchLedger();
  }, [selectedAgentId]);

  const toggleSettlementRequest = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ settlement_requested: !currentStatus } as any)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Settlement Requested" : "Request Cancelled",
        description: !currentStatus ? "Delivery partner will see a priority banner." : "Priority banner removed.",
      });
      fetchDeliveryBoys();
    } catch (error) {
      console.error("Error toggling settlement request:", error);
      toast({
        title: "Update Failed",
        description: "Could not update settlement request status.",
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (entryId: string) => {
    setVerifying(entryId);
    try {
      const { error } = await supabase
        .from("cod_ledger")
        .update({
          status: "VERIFIED",
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        } as any)
        .eq("id", entryId);

      if (error) throw error;

      toast({
        title: "Verified",
        description: "Cash handover has been successfully verified.",
      });
      fetchLedger();
    } catch (error) {
      console.error("Error verifying:", error);
      toast({
        title: "Verification Failed",
        description: "Could not verify the handover.",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const pendingRequests = entries.filter(e => e.type === 'SETTLEMENT' && e.status === 'SUBMITTED');
  
  // Calculate stats for current selection
  const totalInHand = entries
    .filter(e => e.type === 'COLLECTION')
    .reduce((sum, e) => sum + Number(e.amount), 0) - 
    entries
    .filter(e => e.type === 'SETTLEMENT' && e.status === 'VERIFIED')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Filters & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HandCoins className="h-6 w-6 text-primary" />
            COD Reconciliation
          </h2>
          <p className="text-sm text-slate-500 font-medium">Manage and audit cash collections from delivery personnel.</p>
        </div>
        <div className="w-[240px]">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 font-bold h-11">
              <Bike className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Select Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Delivery Boys</SelectItem>
              {deliveryBoys.map((db) => (
                <SelectItem key={db.user_id} value={db.user_id}>
                  {db.profiles?.full_name || "Agent"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-none shadow-xl shadow-emerald-500/5 bg-gradient-to-br from-emerald-50 to-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <IndianRupee className="h-24 w-24 text-emerald-600" />
          </div>
          <CardHeader>
            <CardDescription className="text-emerald-700 font-black uppercase tracking-widest text-[10px]">Total Outstanding</CardDescription>
            <CardTitle className="text-4xl font-black text-emerald-950 tracking-tighter">
              ₹{totalInHand.toFixed(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-bold text-emerald-600/60">Cash currently held by personnel</p>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-xl shadow-amber-500/5 bg-gradient-to-br from-amber-50 to-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="h-24 w-24 text-amber-600" />
          </div>
          <CardHeader>
            <CardDescription className="text-amber-700 font-black uppercase tracking-widest text-[10px]">Pending Verification</CardDescription>
            <CardTitle className="text-4xl font-black text-amber-950 tracking-tighter">
              ₹{pendingRequests.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-bold text-amber-600/60">{pendingRequests.length} unverified requests</p>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-xl shadow-blue-500/5 bg-gradient-to-br from-blue-50 to-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <History className="h-24 w-24 text-blue-600" />
          </div>
          <CardHeader>
            <CardDescription className="text-blue-700 font-black uppercase tracking-widest text-[10px]">Total Collections</CardDescription>
            <CardTitle className="text-4xl font-black text-blue-950 tracking-tighter">
              ₹{entries.filter(e => e.type === 'COLLECTION').reduce((sum, e) => sum + Number(e.amount), 0).toFixed(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-bold text-blue-600/60">Lifetime COD volume</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-white border border-slate-100 p-1 rounded-2xl h-14 w-full md:w-fit mb-6 shadow-sm">
          <TabsTrigger value="requests" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <HandCoins className="h-4 w-4" />
            Verification Queue
            {pendingRequests.length > 0 && (
              <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[10px] ml-1">{pendingRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="balances" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Bike className="h-4 w-4" />
            Agent Balances
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <History className="h-4 w-4" />
            Audit Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-lg font-black tracking-tight">Handover Requests</CardTitle>
              <CardDescription className="text-xs font-medium">Confirm physical cash receipt to update the agent balance.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingRequests.length === 0 ? (
                <div className="p-20 text-center">
                  <PackageCheck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Queue is clear</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Agent</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Time</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Amount</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-8">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id} className="group hover:bg-amber-50/30 transition-colors border-slate-50">
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                              {request.agent_name?.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{request.agent_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium text-xs">
                          {format(new Date(request.created_at), "dd MMM · HH:mm")}
                        </TableCell>
                        <TableCell className="font-black text-slate-900">
                          ₹{Number(request.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button 
                            onClick={() => handleVerify(request.id)}
                            disabled={verifying === request.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-6 h-9 rounded-xl shadow-lg shadow-emerald-600/20"
                          >
                            {verifying === request.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                            Verify & Settle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances">
          <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-lg font-black tracking-tight">Agent Cash Summary</CardTitle>
              <CardDescription className="text-xs font-medium">Real-time outstanding balance for every delivery partner.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Agent Name</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Phone</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Total Collected</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Total Settled</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Request Cash</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-8">Current In-Hand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryBoys.map((db) => {
                    const agentEntries = entries.filter(e => e.agent_id === db.user_id);
                    const collected = agentEntries.filter(e => e.type === 'COLLECTION').reduce((sum, e) => sum + Number(e.amount), 0);
                    const settled = agentEntries.filter(e => e.type === 'SETTLEMENT' && e.status === 'VERIFIED').reduce((sum, e) => sum + Number(e.amount), 0);
                    const balance = collected - settled;
                    
                    return (
                      <TableRow key={db.user_id} className="border-slate-50 group hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-8">
                          <span className="font-bold text-slate-900">{db.profiles?.full_name}</span>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium text-xs">
                          {db.profiles?.phone || "N/A"}
                        </TableCell>
                        <TableCell className="text-emerald-600 font-bold text-xs">
                          ₹{collected.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-blue-600 font-bold text-xs">
                          ₹{settled.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={db.profiles?.settlement_requested || false}
                              onCheckedChange={() => toggleSettlementRequest(db.user_id, db.profiles?.settlement_requested || false)}
                            />
                            {db.profiles?.settlement_requested && (
                              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none animate-pulse text-[8px] h-4">Active</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <span className={cn(
                            "inline-flex items-center px-4 py-1.5 rounded-xl font-black text-sm tracking-tight",
                            balance > 0 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          )}>
                            ₹{balance.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-lg font-black tracking-tight">Full Transaction History</CardTitle>
              <CardDescription className="text-xs font-medium">A immutable record of all COD financial activity.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Agent</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Type</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Amount</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-8">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="border-slate-50">
                      <TableCell className="pl-8">
                        <span className="font-bold text-slate-900">{entry.agent_name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.type === 'COLLECTION' ? 
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Collection</Badge> : 
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Settlement</Badge>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-slate-900">
                        ₹{Number(entry.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          entry.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-700" : 
                          entry.status === 'SUBMITTED' ? "bg-amber-100 text-amber-700 animate-pulse" : 
                          "bg-slate-100 text-slate-700"
                        )}>
                          {entry.status === 'VERIFIED' && <CheckCircle2 className="h-2.5 w-2.5" />}
                          {entry.status === 'SUBMITTED' && <Clock className="h-2.5 w-2.5" />}
                          {entry.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 text-slate-500 font-medium text-xs">
                        {format(new Date(entry.created_at), "dd MMM · HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
