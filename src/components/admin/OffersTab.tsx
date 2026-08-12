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
import { Plus, Trash2, Edit, Upload, ArrowUp, ArrowDown, Eye, Image as ImageIcon, Link as LinkIcon, CheckCircle2 } from "lucide-react";
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
import { PromoBannerItem } from "@/components/home/PromoCarousel";

type PromoCode = Database['public']['Tables']['promo_codes']['Row'];

export const OffersTab = () => {
  const { toast } = useToast();

  // States for Image Banners
  const [banners, setBanners] = useState<PromoBannerItem[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [savingBanners, setSavingBanners] = useState(false);

  // New/Editing Banner Form State
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerTargetUrl, setBannerTargetUrl] = useState("");
  const [bannerActive, setBannerActive] = useState(true);
  const [bannerOrder, setBannerOrder] = useState<number>(1);
  const [uploadingImage, setUploadingImage] = useState(false);

  // States for Checkout Promo Codes (Preserved 100%)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newValue, setNewValue] = useState("");
  const [addingCode, setAddingCode] = useState(false);

  useEffect(() => {
    fetchBanners();
    fetchPromoCodes();
  }, []);

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      // Try fetching from dedicated table first
      const { data: dbData, error: dbErr } = await (supabase as any)
        .from("homepage_promotional_banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (!dbErr && dbData && dbData.length > 0) {
        const mapped: PromoBannerItem[] = dbData.map((item: any) => ({
          id: item.id,
          title: item.title,
          imageUrl: item.image_url || item.imageUrl,
          targetUrl: item.target_url || item.targetUrl,
          isActive: item.is_active ?? item.isActive,
          displayOrder: item.display_order ?? item.displayOrder ?? 1,
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        }));
        setBanners(mapped);
        setLoadingBanners(false);
        return;
      }

      // Fallback to app_settings
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "homepage_banners")
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed)) {
          const sorted = [...parsed].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setBanners(sorted);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch homepage banners:", err);
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchPromoCodes = async () => {
    setLoadingCodes(true);
    try {
      const { data, error } = await (supabase as any)
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== '42P01') throw error;
      setPromoCodes(data || []);
    } catch (err: any) {
      console.error("Failed to fetch promo codes:", err);
    } finally {
      setLoadingCodes(false);
    }
  };

  // Upload Banner Image to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 5MB. Please upload an optimized WEBP, PNG, or JPG.",
        variant: "destructive",
      });
      return;
    }

    // Validate format
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only WEBP, PNG, and JPG images are supported.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      // Try uploading to Supabase Storage buckets: 'banners', 'products', 'public'
      let uploadedUrl: string | null = null;
      const bucketsToTry = ["banners", "products", "public"];

      for (const bucketName of bucketsToTry) {
        try {
          const { error: uploadErr } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, { upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
              break;
            }
          }
        } catch (e) {
          // Continue to next bucket or fallback
        }
      }

      // Fallback: If no bucket is available in Supabase Storage, convert file to Data URL
      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      setBannerImageUrl(uploadedUrl);
      toast({
        title: "Image Uploaded",
        description: "Banner image ready for promotional carousel.",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to process image file.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Save/Update Banner in Supabase
  const handleSaveBannerItem = async () => {
    if (!bannerImageUrl.trim()) {
      toast({ title: "Image Required", description: "Please upload or provide a banner image URL.", variant: "destructive" });
      return;
    }

    setSavingBanners(true);
    try {
      let updatedBanners: PromoBannerItem[] = [];

      if (editingBannerId) {
        // Update existing banner
        updatedBanners = banners.map((b) =>
          b.id === editingBannerId
            ? {
                ...b,
                title: bannerTitle.trim() || "Promotional Banner",
                imageUrl: bannerImageUrl,
                targetUrl: bannerTargetUrl.trim(),
                isActive: bannerActive,
                displayOrder: bannerOrder,
              }
            : b
        );
      } else {
        // Create new banner
        const newBanner: PromoBannerItem = {
          id: `banner-${Date.now()}`,
          title: bannerTitle.trim() || `Banner ${banners.length + 1}`,
          imageUrl: bannerImageUrl,
          targetUrl: bannerTargetUrl.trim(),
          isActive: bannerActive,
          displayOrder: bannerOrder || banners.length + 1,
          createdAt: new Date().toISOString(),
        };
        updatedBanners = [...banners, newBanner];
      }

      // Re-sort by displayOrder
      updatedBanners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      const payload = JSON.stringify(updatedBanners);

      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "homepage_banners", value: payload }, { onConflict: "key" });

      if (error) throw error;

      setBanners(updatedBanners);
      resetBannerForm();
      toast({ title: "Saved Successfully", description: "Homepage promotional banners updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBanners(false);
    }
  };

  const handleEditBanner = (banner: PromoBannerItem) => {
    setEditingBannerId(banner.id);
    setBannerTitle(banner.title);
    setBannerImageUrl(banner.imageUrl);
    setBannerTargetUrl(banner.targetUrl || "");
    setBannerActive(banner.isActive);
    setBannerOrder(banner.displayOrder || 1);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotional banner?")) return;

    setSavingBanners(true);
    try {
      const filtered = banners.filter((b) => b.id !== id);
      const payload = JSON.stringify(filtered);

      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "homepage_banners", value: payload }, { onConflict: "key" });

      if (error) throw error;

      setBanners(filtered);
      toast({ title: "Banner Deleted", description: "Banner removed successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBanners(false);
    }
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    setSavingBanners(true);
    try {
      const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b));
      const payload = JSON.stringify(updated);

      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "homepage_banners", value: payload }, { onConflict: "key" });

      if (error) throw error;

      setBanners(updated);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBanners(false);
    }
  };

  const moveBannerOrder = async (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === banners.length - 1)) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-assign displayOrder sequence
    const reordered = updated.map((b, idx) => ({ ...b, displayOrder: idx + 1 }));

    setSavingBanners(true);
    try {
      const payload = JSON.stringify(reordered);
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "homepage_banners", value: payload }, { onConflict: "key" });

      if (error) throw error;

      setBanners(reordered);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBanners(false);
    }
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle("");
    setBannerImageUrl("");
    setBannerTargetUrl("");
    setBannerActive(true);
    setBannerOrder(banners.length + 1);
  };

  // Checkout Promo Code Actions (Preserved 100%)
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
      {/* 1. HOMEPAGE PROMOTIONAL BANNERS MANAGEMENT */}
      <Card className="border-[#C98A24]/30 shadow-xl bg-[#0B2118] text-[#F5F3EC]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-[#F5F3EC] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#C98A24]" />
                Homepage Promotional Banners
              </CardTitle>
              <CardDescription className="text-[#9AAFA4] mt-1">
                Upload and manage high-resolution promotional artwork (e.g. Bakrid Offers, Milk & Ghee Discounts) displayed on the homepage carousel.
              </CardDescription>
            </div>
            {editingBannerId && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetBannerForm}
                className="border-white/20 text-[#F5F3EC] hover:bg-white/10"
              >
                + Add New Banner Instead
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* UPLOAD & FORM CONTAINER */}
          <div className="bg-[#08251A] p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 className="font-extrabold text-sm text-[#C98A24] uppercase tracking-wider">
              {editingBannerId ? "Edit Promotional Banner" : "Upload New Promotional Banner"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Internal Admin Title */}
              <div className="space-y-2">
                <Label htmlFor="banner-title" className="text-xs font-bold text-[#F5F3EC]">
                  Internal Admin Title / Campaign Name
                </Label>
                <Input
                  id="banner-title"
                  placeholder="e.g. Bakrid Special 20% OFF Offer"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="bg-[#10291F] border-white/10 text-[#F5F3EC] focus:border-[#C98A24]"
                />
                <p className="text-[10px] text-[#9AAFA4]">Used for internal admin tracking only. Will NOT be printed over the image.</p>
              </div>

              {/* Target Navigation URL */}
              <div className="space-y-2">
                <Label htmlFor="banner-target" className="text-xs font-bold text-[#F5F3EC]">
                  Optional Destination Link (Target URL)
                </Label>
                <Input
                  id="banner-target"
                  placeholder="e.g. /products or /subscriptions"
                  value={bannerTargetUrl}
                  onChange={(e) => setBannerTargetUrl(e.target.value)}
                  className="bg-[#10291F] border-white/10 text-[#F5F3EC] focus:border-[#C98A24]"
                />
                <p className="text-[10px] text-[#9AAFA4]">When clicked, customer will navigate to this page. Leave blank for visual-only banner.</p>
              </div>
            </div>

            {/* Image File Upload & Direct URL Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold text-[#F5F3EC]">Banner Image (Max 5MB • WEBP, PNG, JPG)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... or upload below"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    className="bg-[#10291F] border-white/10 text-[#F5F3EC] focus:border-[#C98A24] flex-1"
                  />
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingImage}
                      className="border-[#C98A24]/40 bg-[#0B2118] hover:bg-[#C98A24] text-[#F5F3EC] hover:text-[#061A13] font-bold text-xs shrink-0"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-1.5" />
                        {uploadingImage ? "Uploading..." : "Browse..."}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/webp,image/png,image/jpeg,image/jpg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display Order & Active Switch */}
              <div className="flex items-center justify-between gap-4 bg-[#10291F] p-2.5 rounded-xl border border-white/10">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-[#9AAFA4]">Order</Label>
                  <Input
                    type="number"
                    min={1}
                    value={bannerOrder}
                    onChange={(e) => setBannerOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-16 h-8 bg-[#08251A] border-white/10 text-[#F5F3EC] text-xs text-center font-bold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="active-banner-switch" className="text-xs font-bold text-[#F5F3EC]">
                    {bannerActive ? "Active" : "Inactive"}
                  </Label>
                  <Switch
                    id="active-banner-switch"
                    checked={bannerActive}
                    onCheckedChange={setBannerActive}
                  />
                </div>
              </div>
            </div>

            {/* LIVE HOMEPAGE PREVIEW BOX */}
            {bannerImageUrl && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Label className="text-xs font-extrabold text-[#C98A24] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Homepage Carousel Preview
                </Label>
                <div className="relative rounded-2xl border border-[#C98A24]/40 bg-[#0B2118] overflow-hidden shadow-2xl aspect-[16/6] max-h-56 flex items-center justify-center">
                  <img
                    src={bannerImageUrl}
                    alt="Homepage Banner Preview"
                    className="w-full h-full object-contain bg-[#08251A]"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <Button
                onClick={handleSaveBannerItem}
                disabled={savingBanners || uploadingImage}
                className="bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black text-xs uppercase tracking-wider px-6 h-10 rounded-xl"
              >
                {savingBanners ? "Saving..." : editingBannerId ? "Update Banner" : "Save Promotional Banner"}
              </Button>

              {editingBannerId && (
                <Button
                  variant="ghost"
                  onClick={resetBannerForm}
                  className="text-[#9AAFA4] hover:text-white text-xs font-bold"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          {/* ACTIVE BANNERS TABLE */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-[#F5F3EC] flex items-center justify-between">
              <span>Current Promotional Banners ({banners.length})</span>
            </h4>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#08251A]">
              <Table>
                <TableHeader className="bg-[#061A13]">
                  <TableRow className="border-white/10">
                    <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Order</TableHead>
                    <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Banner Preview</TableHead>
                    <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Admin Title</TableHead>
                    <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Target Link</TableHead>
                    <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="text-right text-[#C98A24] font-bold text-xs uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBanners ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-[#9AAFA4] text-xs font-medium">
                        Loading promotional banners...
                      </TableCell>
                    </TableRow>
                  ) : banners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-[#9AAFA4] text-xs font-medium">
                        No promotional banners added yet. Upload an image above to showcase your campaign!
                      </TableCell>
                    </TableRow>
                  ) : (
                    banners.map((banner, index) => (
                      <TableRow key={banner.id} className={`border-white/10 ${!banner.isActive ? "opacity-50" : ""}`}>
                        <TableCell className="font-bold text-xs">
                          <div className="flex items-center gap-1">
                            <span className="w-5 text-center">{banner.displayOrder || index + 1}</span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveBannerOrder(index, "up")}
                                disabled={index === 0}
                                className="p-0.5 hover:text-[#C98A24] disabled:opacity-20 text-white/70"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveBannerOrder(index, "down")}
                                disabled={index === banners.length - 1}
                                className="p-0.5 hover:text-[#C98A24] disabled:opacity-20 text-white/70"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="w-32 h-14 rounded-lg bg-[#0B2118] border border-white/10 overflow-hidden flex items-center justify-center p-1">
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </TableCell>

                        <TableCell className="font-bold text-xs text-[#F5F3EC]">
                          {banner.title}
                        </TableCell>

                        <TableCell className="text-xs text-[#9AAFA4]">
                          {banner.targetUrl ? (
                            <span className="flex items-center gap-1 text-[#C98A24] font-medium truncate max-w-[150px]">
                              <LinkIcon className="w-3 h-3 shrink-0" />
                              {banner.targetUrl}
                            </span>
                          ) : (
                            <span className="text-white/40 font-mono text-[11px]">— None —</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Switch
                            checked={banner.isActive}
                            onCheckedChange={() => toggleBannerStatus(banner.id, banner.isActive)}
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBanner(banner)}
                              className="h-8 w-8 text-[#F5F3EC] hover:text-[#C98A24] hover:bg-white/10 rounded-lg"
                              title="Edit Banner"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CHECKOUT PROMO CODES MANAGEMENT (PRESERVED 100%) */}
      <Card className="border-white/10 bg-[#0B2118] text-[#F5F3EC]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#F5F3EC]">Checkout Promo Codes</CardTitle>
          <CardDescription className="text-[#9AAFA4]">Manage discount coupons users can enter at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#F5F3EC]">Code</Label>
              <Input
                placeholder="FREEGHEE"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                className="bg-[#10291F] border-white/10 text-[#F5F3EC] focus:border-[#C98A24]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#F5F3EC]">Type</Label>
              <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
                <SelectTrigger className="bg-[#10291F] border-white/10 text-[#F5F3EC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#08251A] border-white/10 text-[#F5F3EC]">
                  <SelectItem value="percentage">% Percentage</SelectItem>
                  <SelectItem value="fixed">₹ Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#F5F3EC]">Value</Label>
              <Input
                type="number"
                placeholder={newType === "percentage" ? "15" : "50"}
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="bg-[#10291F] border-white/10 text-[#F5F3EC] focus:border-[#C98A24]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#F5F3EC]">Internal Note (Optional)</Label>
              <Input
                placeholder="Diwali sales..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="bg-[#10291F] border-white/10 text-[#F5F3EC] focus:border-[#C98A24]"
              />
            </div>
            <Button onClick={handleCreateCode} disabled={addingCode} className="w-full bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-bold text-xs uppercase tracking-wider h-10 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Code
            </Button>
          </div>

          <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#08251A]">
            <Table>
              <TableHeader className="bg-[#061A13]">
                <TableRow className="border-white/10">
                  <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Code</TableHead>
                  <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Type</TableHead>
                  <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Discount Value</TableHead>
                  <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Description</TableHead>
                  <TableHead className="text-[#C98A24] font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="text-right text-[#C98A24] font-bold text-xs uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCodes ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-[#9AAFA4] text-xs font-medium">Loading codes...</TableCell>
                  </TableRow>
                ) : promoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-[#9AAFA4] text-xs font-medium">No promo codes found.</TableCell>
                  </TableRow>
                ) : (
                  promoCodes.map(code => (
                    <TableRow key={code.id} className={`border-white/10 ${!code.is_active ? "opacity-50" : ""}`}>
                      <TableCell className="font-extrabold tracking-wider text-[#F5F3EC]">{code.code}</TableCell>
                      <TableCell className="capitalize text-xs">{code.discount_type}</TableCell>
                      <TableCell className="font-bold text-[#C98A24] text-xs">
                        {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `₹${code.discount_value} OFF`}
                      </TableCell>
                      <TableCell className="text-xs text-[#9AAFA4]">{code.description || "-"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={() => togglePromoCode(code.id, code.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deletePromoCode(code.id)} className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg">
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

      {/* 3. INSTRUCTIONS CARD */}
      <Card className="bg-[#10291F] border-[#C98A24]/30 text-[#F5F3EC]">
        <CardHeader>
          <CardTitle className="text-[#C98A24] text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> How to put individual products on sale?
          </CardTitle>
          <CardDescription className="text-[#9AAFA4] text-xs leading-relaxed">
            You don't need a checkout promo code to put a product on sale. Simply go to the <strong>Products Tab</strong> above, edit a product, and set its <strong>Original Price</strong>. If the Original Price is higher than the Current Price, the site will automatically show the "Save %" badge and strike-through price.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
