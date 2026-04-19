import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertCircle, Home as HomeIcon, Map as MapIcon, Navigation2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FARM_LOCATION, calculateDistance, MAX_DELIVERY_DISTANCE_KM, calculateShippingFee } from "@/utils/distance";

interface AddressInputProps {
  value: string;
  onChange: (address: string, distance: number | null, lat: number | null, lng: number | null, fee: number) => void;
  onDistanceError: (error: string | null) => void;
  disabled?: boolean;
}

const AddressInput = ({ value, onChange, onDistanceError, disabled }: AddressInputProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [details, setDetails] = useState({
    area: "",
    mandal: "",
    district: "",
    pincode: "",
    landmark: "",
    houseNo: ""
  });

  useEffect(() => {
    const fee = distance !== null ? calculateShippingFee(distance) : -1;
    const fullAddress = [
      details.houseNo,
      details.area,
      details.mandal ? `Mandal: ${details.mandal}` : "",
      details.district ? `District: ${details.district}` : "",
      details.pincode,
      details.landmark ? `(Landmark: ${details.landmark})` : ""
    ].filter(Boolean).join(", ");
    
    onChange(fullAddress, distance, coords?.lat || null, coords?.lng || null, fee);
  }, [details, distance, coords, onChange]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (details.area && details.mandal && details.district && details.pincode.length === 6 && !coords) {
        setIsVerifying(true);
        try {
          const query = `${details.area}, ${details.mandal}, ${details.district}, ${details.pincode}, India`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
          const data = await response.json();
          
          if (data && data.length > 0) {
            const latitude = parseFloat(data[0].lat);
            const longitude = parseFloat(data[0].lon);
            const dist = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, latitude, longitude);
            
            setCoords({ lat: latitude, lng: longitude });
            setDistance(dist);
            
            if (dist > MAX_DELIVERY_DISTANCE_KM) {
              onDistanceError(`Outside delivery area: ${dist.toFixed(1)}km away. Limit is 50km.`);
            } else {
              onDistanceError(null);
            }
          }
        } catch (e) {
          console.warn("Manual geocoding failed", e);
        } finally {
          setIsVerifying(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [details.area, details.mandal, details.district, details.pincode, coords, onDistanceError]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onDistanceError("Geolocation not supported");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, latitude, longitude);
        
        setCoords({ lat: latitude, lng: longitude });
        setDistance(dist);

        if (dist > MAX_DELIVERY_DISTANCE_KM) {
          onDistanceError(`Outside delivery area: ${dist.toFixed(1)}km away. Limit is 50km.`);
        } else {
          onDistanceError(null);
        }

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const addr = data.address;
          
          const cleanArea = (addr.suburb || addr.neighbourhood || addr.village || addr.road || "").replace(/^MDR\d+\b\s*,?\s*/i, "");
          
          setDetails(prev => ({
            ...prev,
            area: cleanArea,
            mandal: addr.city_district || addr.subdistrict || addr.county || "",
            district: addr.state_district || addr.city || "",
            pincode: addr.postcode || ""
          }));
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }
        setIsLoading(false);
      },
      () => {
        onDistanceError("Location access denied. Please enter manually.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFieldChange = (field: string, value: string) => {
    setCoords(null);
    setDistance(null);
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Set Location */}
      <div className="flex flex-col gap-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1: Set Location</Label>
        <div className="flex items-center gap-3">
           <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 bg-white shadow-sm border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
            onClick={handleUseCurrentLocation}
            disabled={isLoading || disabled}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation2 className="w-4 h-4 text-primary" />}
            Use Current Location
          </Button>

          {distance !== null && (
            <div className={cn(
              "px-4 h-12 flex flex-col justify-center rounded-xl border border-dashed",
              distance <= MAX_DELIVERY_DISTANCE_KM ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
            )}>
              <span className="text-[8px] font-black uppercase opacity-60">Distance</span>
              <span className="text-xs font-black italic">{distance.toFixed(1)} KM</span>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="area">Village / Area *</Label>
            <Input id="area" value={details.area} onChange={(e) => handleFieldChange("area", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mandal">Mandal *</Label>
            <Input id="mandal" value={details.mandal} onChange={(e) => handleFieldChange("mandal", e.target.value)} required />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressInput;
