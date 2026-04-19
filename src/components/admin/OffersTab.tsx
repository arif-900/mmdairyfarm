import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

// Setup Types based on db
type PromoCode = Database['public']['Tables']['promo_codes']['Row'];

export const OffersTab = () => {
  const { toast } = useToast();
  
  // States for Promo Banner
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDesc, setBannerDesc] = useState("");
  const [bannerCode, setBannerCode] = useState("");
  const [savingBanner, setSavingBanner] = useState(false);

  // States for Promo Codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  
  // States for New Promo Code Form
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newValue, setNewValue] = useState("");
  const [addingCode, setAddingCode] = useState(false);

  useEffect(() => {
    fetchBannerSettings();
    fetchPromoCodes();
  }, []);

  const fetchBannerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "promo_banner")
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.value) {
        // Parse the JSON string
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setBannerActive(parsed.isActive || false);
        setBannerTitle(parsed.title || "");
        setBannerDesc(parsed.description || "");
        setBannerCode(parsed.promoCode || "");
      }
    } catch (err: any) {
      console.error("Failed to fetch banner settings:", err);
    }
  };

  const fetchPromoCodes = async () => {
    setLoadingCodes(true);
    try {
      // Intentionally ignore error boundaries in TS during dev if schema isn't fully synched
      const { data, error } = await (supabase as any)
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== '42P01') { // Ignore missing table temporarily
        throw error;
      }
      setPromoCodes(data || []);
    } catch (err: any) {
      console.error("Failed to fetch promo codes:", err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      const payload = JSON.stringify({
        isActive: bannerActive,
        title: bannerTitle,
        description: bannerDesc,
        promoCode: bannerCode
      });

      const { error } = await supabase
        .from("app_settings")
        .upsert({ 
          key: "promo_banner", 
          value: payload 
        }, { onConflict: 'key' });

      if (error) throw error;

      toast({ title: "Success", description: "Promo banner settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBanner(false);
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.trim() || !newValue) {
      toast({ title: "Error", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }

    setAddingCode(true);
    try {
      const { error } = await (supabase as any)
        .from("promo_codes")
        .insert({
          code: newCode.toUpperCase().trim(),
          description: newDesc,
          discount_type: newType,
          discount_value: Number(newValue),
          is_active: true
        });

      if (error) throw error;

      toast({ title: "Success", description: "Promo code created successfully" });
      setNewCode("");
      setNewDesc("");
      setNewValue("");
      fetchPromoCodes();
    } catch (err: any) {
      toast({ title: "Error creating promo code", description: err.message, variant: "destructive" });
    } finally {
      setAddingCode(false);
    }
  };

  const togglePromoCode = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("promo_codes")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      fetchPromoCodes();
    } catch (err: any) {
      toast({ title: "Error toggling code status", description: err.message, variant: "destructive" });
    }
  };

  const deletePromoCode = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const { error } = await (supabase as any)
        .from("promo_codes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      fetchPromoCodes();
    } catch (err: any) {
      toast({ title: "Error deleting code", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Homepage Promo Banner</CardTitle>
              <CardDescription>
                Configure the large marketing banner at the top of the homepage.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="banner-active" className="text-sm">
                {bannerActive ? "Visible" : "Hidden"}
              </Label>
              <Switch
                id="banner-active"
                checked={bannerActive}
                onCheckedChange={setBannerActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Top Title / Label</Label>
            <Input 
              placeholder="e.g., Weekend Special Offer!"
              value={bannerTitle}
              onChange={e => setBannerTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Description Text</Label>
            <Input 
              placeholder="Start your mornings right. Get 15% off..."
              value={bannerDesc}
              onChange={e => setBannerDesc(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Promo Code Displayed (Optional)</Label>
            <Input 
              placeholder="PUREDAIRY15"
              value={bannerCode}
              onChange={e => setBannerCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">This just displays text. You still need to create the actual code below.</p>
          </div>
          <Button onClick={handleSaveBanner} disabled={savingBanner} className="mt-4">
            {savingBanner ? "Saving..." : "Save Banner Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Promo Code Management */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout Promo Codes</CardTitle>
          <CardDescription>Manage discount coupons users can enter at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input 
                placeholder="FREEGHEE" 
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">% Percentage</SelectItem>
                  <SelectItem value="fixed">₹ Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input 
                type="number" 
                placeholder={newType === "percentage" ? "15" : "50"} 
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Internal Note (Optional)</Label>
              <Input 
                placeholder="Diwali sales..." 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateCode} disabled={addingCode} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add Code
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCodes ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading codes...</TableCell>
                  </TableRow>
                ) : promoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No promo codes found.</TableCell>
                  </TableRow>
                ) : (
                  promoCodes.map(code => (
                    <TableRow key={code.id} className={!code.is_active ? "opacity-60" : ""}>
                      <TableCell className="font-bold tracking-wider">{code.code}</TableCell>
                      <TableCell className="capitalize">{code.discount_type}</TableCell>
                      <TableCell className="font-medium text-primary">
                        {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `₹${code.discount_value} OFF`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{code.description || "-"}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={code.is_active} 
                          onCheckedChange={() => togglePromoCode(code.id, code.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deletePromoCode(code.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Instructions for Product Discounts */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary text-lg">💡 How to put individual products on sale?</CardTitle>
          <CardDescription className="text-primary/70">
            You don't need a promo code to put a product on sale. Simply go to the <strong>Products Tab</strong> above, edit a product, and set its <strong>Original Price</strong>. If the Original Price is higher than the Current Price, the site will automatically show the "Red Sale Badge" and strike-through price.
          </CardDescription>
        </CardHeader>
      </Card>

    </div>
  );
};
