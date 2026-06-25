import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MapboxMapPicker from "./MapboxMapPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Home, Briefcase, MapPin, Loader2, Map as MapIcon, Check } from "lucide-react";

interface AddressFormDialogProps {
  userId: string;
  onSuccess: () => void;
  editAddress?: any;
  trigger?: React.ReactNode;
  autoLocate?: boolean;
}

const AddressFormDialog = ({ userId, onSuccess, editAddress, trigger, autoLocate }: AddressFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState(editAddress?.label || "home");
  const [fullName, setFullName] = useState(editAddress?.full_name || "");
  const [phone, setPhone] = useState(editAddress?.phone || "");
  const [isDefault, setIsDefault] = useState(editAddress?.is_default || false);

  // Data from AddressInput
  const [addressLine, setAddressLine] = useState(editAddress?.address_line || "");
  const [houseNo, setHouseNo] = useState("");
  const [villageName, setVillageName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [lat, setLat] = useState<number | null>(editAddress?.lat || null);
  const [lng, setLng] = useState<number | null>(editAddress?.lng || null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAutoLocating, setIsAutoLocating] = useState(false);

  const handleAddressChange = (addr: string, dist: number | null, latitude: number | null, longitude: number | null) => {
    setAddressLine(addr);
    setLat(latitude);
    setLng(longitude);
    setDistance(dist);
  };

  // Perform background auto-location when opened in autoLocate mode
  import.meta.env.VITE_MAPBOX_TOKEN;
  const performAutoLocate = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation Error", description: "Your browser does not support location services.", variant: "destructive" });
      return;
    }
    setIsAutoLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);

        // Calculate distance
        const { calculateDistance } = await import("@/utils/distance");
        const dist = calculateDistance(15.8022, 78.5356, latitude, longitude);
        setDistance(dist);

        // Reverse Geocode
        try {
          const token = import.meta.env.VITE_MAPBOX_TOKEN;
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            setAddressLine(data.features[0].place_name);
          } else {
            setAddressLine(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (err) {
          setAddressLine(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setIsAutoLocating(false);
      },
      (err) => {
        setIsAutoLocating(false);
        toast({ title: "GPS Required", description: "Please enable location to automatically fetch your delivery coordinates.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && autoLocate && !lat) {
      performAutoLocate();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lat || !lng) {
      toast({ title: "Address Required", description: "Please verify your location on the map.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // If setting as default, unset others first (optional, DB can handle with trigger too)
      if (isDefault) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
      }

      const fullAddressString = [
        houseNo ? `House No: ${houseNo}` : "",
        landmark ? `Landmark: ${landmark}` : "",
        villageName || addressLine
      ].filter(Boolean).join(", ");

      const addressData = {
        user_id: userId,
        full_name: fullName,
        phone,
        address_line: fullAddressString,
        mandal: "",
        district: "",
        pincode: "",
        lat,
        lng,
        label,
        is_default: isDefault
      };

      if (editAddress) {
        const { error } = await supabase.from("addresses").update(addressData).eq("id", editAddress.id);
        if (error) throw error;
        toast({ title: "Address Updated", description: "Your changes have been saved." });
      } else {
        const { error } = await supabase.from("addresses").insert(addressData);
        if (error) throw error;
        toast({ title: "Address Saved", description: "New address added to your book." });
      }

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button type="button" variant="outline">Add New Address</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tighter">
            {editAddress ? "Edit Address" : "Add New Delivery Address"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Name</Label>
                {fullName.length > 0 && !/^[a-zA-Z\s]*$/.test(fullName) && (
                  <span className="text-[9px] font-bold text-rose-500 uppercase">Letters Only</span>
                )}
              </div>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                required
                className="rounded-2xl h-12 bg-slate-50 border-slate-100"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</Label>
                {phone.length > 0 && phone.length < 10 && (
                  <span className="text-[9px] font-bold text-rose-500 uppercase">10 Digits Required</span>
                )}
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(val);
                }}
                required
                className="rounded-2xl h-12 bg-slate-50 border-slate-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address Label</Label>
            <RadioGroup value={label} onValueChange={setLabel} className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="home" id="home" className="sr-only" />
                <Label
                  htmlFor="home"
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer gap-2",
                    label === "home" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400"
                  )}
                >
                  <Home className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Home</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="office" id="office" className="sr-only" />
                <Label
                  htmlFor="office"
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer gap-2",
                    label === "office" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400"
                  )}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Office</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" className="sr-only" />
                <Label
                  htmlFor="other"
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer gap-2",
                    label === "other" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400"
                  )}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Other</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-2">
            {autoLocate ? (
               isAutoLocating ? (
                 <div className="w-full h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center gap-3 bg-slate-50 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-black uppercase text-xs tracking-widest">Pinpointing Location...</span>
                 </div>
               ) : lat ? (
                 <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                       <Check className="w-4 h-4 text-emerald-600" />
                       <span className="font-black text-emerald-700 uppercase text-xs">Live GPS Locked</span>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium">{addressLine || "Coordinates acquired."}</p>
                 </div>
               ) : (
                 <Button
                  type="button"
                  variant="outline"
                  onClick={performAutoLocate}
                  className="w-full h-14 rounded-2xl border-2 border-dashed border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-500 transition-all font-black uppercase text-xs tracking-widest gap-2"
                 >
                   <MapPin className="w-4 h-4" /> Retry GPS Location
                 </Button>
               )
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMapOpen(true)}
                className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <MapIcon className="w-4 h-4" />
                </div>
                <span className="font-black uppercase text-xs tracking-widest">Select Location on Map</span>
              </Button>
            )}
          </div>

          {isMapOpen && (
            <MapboxMapPicker
              farmLocation={{ lat: 15.8022, lng: 78.5356 }}
              initialLat={lat}
              initialLng={lng}
              onClose={() => setIsMapOpen(false)}
              onLocationSelect={(data) => {
                setAddressLine(data.address);
                // Extract first part of address as village/area hint
                const areaHint = data.address.split(',')[0];
                setVillageName(areaHint);
                setLat(data.lat);
                setLng(data.lng);
                setDistance(data.distance);
                setIsMapOpen(false);
                toast({ title: "Location Confirmed", description: "Area auto-filled from map." });
              }}
            />
          )}

          {/* New Specific Details Fields */}
          {addressLine && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
              <div className="space-y-2">
                <Label htmlFor="houseNo" className="text-[10px] font-black uppercase tracking-widest text-slate-400">House / Flat / Plot No *</Label>
                <Input
                  id="houseNo"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  required
                  className="rounded-2xl h-12 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="villageName" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Village / Area Name *</Label>
                <Input
                  id="villageName"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  required
                  className="rounded-2xl h-12 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="landmark" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Landmark / Street / Details *</Label>
                <Input
                  id="landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  required
                  className="rounded-2xl h-12 bg-white border-slate-200"
                />
              </div>
            </div>
          )}

          {addressLine && !isMapOpen && (
            <div className="p-6 rounded-[32px] bg-emerald-50 border-2 border-emerald-100 space-y-3 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Selected Address</span>
              </div>
              <p className="text-sm font-bold text-slate-700 leading-relaxed pl-1">
                {addressLine}
              </p>
              {distance !== null && (
                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-tighter">
                  Confirmed Location • {distance.toFixed(1)}km from farm
                </p>
              )}
            </div>
          )}

          {!addressLine && !isMapOpen && (
            <div className="p-8 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50">
              <MapPin className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Location Selected Yet</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
            />
            <Label htmlFor="isDefault" className="text-xs font-bold text-slate-600">Set as default delivery address</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editAddress ? "Update Address" : "Save Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddressFormDialog;

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
