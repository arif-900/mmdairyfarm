import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Send, AlertCircle, MessageSquareWarning, Megaphone } from "lucide-react";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_WHATSAPP_API_URL || "/api/admin";

export const WhatsAppTab = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("wa_admin_token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [abandoned, setAbandoned] = useState<any[]>([]);
  const [retries, setRetries] = useState<any[]>([]);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem("wa_admin_token", data.token);
        toast({ title: "Logged in successfully to WhatsApp Admin" });
        fetchData();
      } else {
        toast({ title: "Login failed", description: data.error || "Invalid credentials", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error connecting to server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("wa_admin_token");
  };

  const authFetch = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.status === 401) {
      handleLogout();
      throw new Error("Unauthorized");
    }
    return res.json();
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashboardRes, logsRes, abandonedRes, retriesRes] = await Promise.all([
        authFetch("/dashboard"),
        authFetch("/logs"),
        authFetch("/abandoned-orders"),
        authFetch("/retries")
      ]);
      setStats(dashboardRes);
      setLogs(logsRes);
      setAbandoned(abandonedRes);
      setRetries(retriesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleResend = async (id: string, type: 'reminder' | 'retry') => {
    try {
      toast({ title: "Triggering resend..." });
      const path = type === 'reminder' ? `/resend-reminder/${id}` : `/retry/${id}`;
      const res = await authFetch(path, { method: "POST" });
      if (res.success) {
        toast({ title: "Message sent successfully" });
        fetchData();
      } else {
        toast({ title: "Failed to send", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error sending message", variant: "destructive" });
    }
  };

  if (!token) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>WhatsApp Service Login</CardTitle>
          <CardDescription>Enter admin credentials to manage WhatsApp notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Controller</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Log out WS</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.messagesSent || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.messagesFailed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandoned Carts</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.abandonedCarts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracked</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
          <TabsTrigger value="abandoned">Abandoned Carts</TabsTrigger>
          <TabsTrigger value="retries">Failed / Retries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[10px] border h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap">{log.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'sent' ? "default" : log.status === 'failed' ? "destructive" : "secondary"}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="truncate max-w-lg">{log.message}</TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-4">No logs found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abandoned">
           <Card>
            <CardHeader>
              <CardTitle>Abandoned Carts</CardTitle>
              <CardDescription>Orders pending for over 15 minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abandoned.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono">{o.id.substring(0, 8).toUpperCase()}</TableCell>
                        <TableCell>{format(new Date(o.created_at), "dd MMM p")}</TableCell>
                        <TableCell>{o.phone}</TableCell>
                        <TableCell>{o.retry_count || 0}</TableCell>
                        <TableCell>
                          {o.reminder_sent ? <Badge>Sent</Badge> : <Badge variant="secondary">Pending</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleResend(o.id, 'reminder')} disabled={o.reminder_sent}>
                            Resend Reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {abandoned.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-4">No abandoned carts right now</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retries">
           <Card>
            <CardHeader>
              <CardTitle>Failed Messages</CardTitle>
              <CardDescription>Orders that had errors pushing to WhatsApp (retry_count &gt; 0)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Target Status</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retries.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono">{o.id.substring(0, 8).toUpperCase()}</TableCell>
                        <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                        <TableCell>{o.phone}</TableCell>
                        <TableCell className="font-bold text-destructive">{o.retry_count || 0}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => handleResend(o.id, 'retry')}>
                            Force Send Again
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {retries.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-4">System operates flawlessly, no failed deliveries.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
