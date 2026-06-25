import { useState, useCallback, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Check, X, Navigation } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Farm Location (MMVALI Dairy Farm)
const FARM_LOCATION: [number, number] = [15.8285, 78.0373];

// Fix for default Leaflet icon not appearing in Vite
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (data: {
    lat: number;
    lng: number;
    address: string;
    distance: number;
    shippingFee: number;
  }) => void;
  onClose: () => void;
}

const MapLocationPicker = ({ initialLat, initialLng, onConfirm, onClose }: MapLocationPickerProps) => {
  const [position, setPosition] = useState<L.LatLng>(
    new L.LatLng(initialLat || 15.8285, initialLng || 78.0373)
  );
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Haversine distance from Farm
  const calculateDistance = useCallback((lat: number, lng: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat - FARM_LOCATION[0]) * Math.PI / 180;
    const dLng = (lng - FARM_LOCATION[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(FARM_LOCATION[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getShippingFee = useCallback((dist: number) => {
    if (dist <= 5) return 0;
    if (dist <= 10) return 30;
    if (dist <= 20) return 50;
    if (dist <= 50) return 100;
    return -1; // Out of range
  }, []);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'MMVALI-Dairy-Farm' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const updatePosition = useCallback((newPos: L.LatLng) => {
    setPosition(newPos);
    const dist = calculateDistance(newPos.lat, newPos.lng);
    setDistance(dist);
    handleReverseGeocode(newPos.lat, newPos.lng);
  }, [calculateDistance]);

  // Handle Marker Drag
  const markerHandlers = useMemo(() => ({
    dragend(e: any) {
      const marker = e.target;
      if (marker != null) {
        updatePosition(marker.getLatLng());
      }
    },
  }), [updatePosition]);

  const handleConfirm = () => {
    if (!distance) return;
    const fee = getShippingFee(distance);
    if (fee === -1) {
        toast({ title: "Out of Range", description: "Distance is beyond 50km. We cannot deliver here.", variant: "destructive" });
        return;
    }
    
    onConfirm({
      lat: position.lat,
      lng: position.lng,
      address,
      distance,
      shippingFee: fee
    });
  };

  const LocateUser = () => {
    const map = useMap();
    useEffect(() => {
        if (!initialLat && !initialLng) {
            map.locate().on("locationfound", (e) => {
                updatePosition(e.latlng);
                map.flyTo(e.latlng, 16);
            });
        }
    }, [map]);
    return null;
  };

  const MapClick = () => {
    useMapEvents({
      click(e) {
        updatePosition(e.latlng);
      },
    });
    return null;
  };

  const fee = distance ? getShippingFee(distance) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Map Section */}
      <div className="flex-1 relative z-0">
        <MapContainer 
            center={position} 
            zoom={15} 
            scrollWheelZoom={true} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={position} 
            draggable={true} 
            eventHandlers={markerHandlers}
          />
          <LocateUser />
          <MapClick />
        </MapContainer>

        {/* Overlays */}
        <div className="absolute top-6 left-6 right-6 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-4 shadow-xl border border-white max-w-md mx-auto pointer-events-auto">
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                        fee === -1 ? "bg-rose-500 text-white" : "bg-primary text-white"
                    )}>
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Current Pin Location</h4>
                        <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed h-[36px]">
                            {isReverseGeocoding ? (
                                <span className="flex items-center gap-2 text-slate-400">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
                                </span>
                            ) : address || "Drag pin to select your home"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Control Panel Section */}
      <div className="w-full md:w-[400px] bg-slate-900 text-white p-8 overflow-y-auto flex flex-col justify-between border-l border-white/5 relative z-10 shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-4xl font-black italic tracking-tighter">Location Picker</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/50">
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Distance from Farm</span>
                    <span className="text-3xl font-black italic italic tracking-tighter text-primary">
                        {distance ? `${distance.toFixed(1)} km` : "..."}
                    </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className={cn(
                            "h-full transition-all duration-700",
                            fee === -1 ? "bg-rose-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.min((distance || 0) * 2, 100)}%` }}
                    />
                </div>
            </div>

            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Shipping Fee</span>
                    <span className={cn(
                        "text-xl font-black italic tracking-tight",
                        fee === 0 ? "text-emerald-400" : fee === -1 ? "text-rose-500" : "text-white"
                    )}>
                        {distance ? (fee === 0 ? "FREE" : fee === -1 ? "UNAVAILABLE" : `₹${fee}`) : "..."}
                    </span>
                </div>
                {fee === -1 && (
                    <p className="text-[10px] font-bold text-rose-500 leading-tight flex gap-2">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        MMVALI DAIRY FARM ONLY SERVES WITHIN A 50KM RADIUS. PLEASE PICK A LOCATION CLOSER TO KURNOOL CITY.
                    </p>
                )}
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-4">
           <Button 
            variant="outline" 
            onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                   setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
                   // Map will flyTo via MapContainer's position if bound, but here we just update state
                });
            }}
            className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:border-white/20 transition-all gap-3"
           >
             <Navigation className="w-4 h-4" />
             Find My Current Location
           </Button>

           <Button 
            onClick={handleConfirm}
            disabled={!distance || fee === -1 || isReverseGeocoding}
            className="w-full h-18 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 group overflow-hidden transition-all active:scale-95 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1"
           >
                <div className="flex items-center justify-between px-6 w-full">
                    <span>Confirm Address</span>
                    <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                </div>
           </Button>
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}
