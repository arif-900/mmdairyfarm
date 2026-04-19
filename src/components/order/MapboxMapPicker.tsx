/**
 * MapboxMapPicker — Leaflet-based, mobile-optimised
 *
 * GPS improvements for mobile:
 *  • enableHighAccuracy: true  — uses device GPS chip, not just Wi-Fi/cell
 *  • maximumAge: 0             — always fetch fresh position
 *  • watchPosition             — live tracking with accuracy ring
 *  • Animated pulsing ring shows GPS accuracy radius on map
 *  • "Locating…" state blocks confirm until address resolved
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Loader2,
  Check,
  X,
  AlertCircle,
  Search,
  Crosshair,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/utils/distance";

// ── Fix Leaflet default icon paths broken by Vite ──────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Green = delivery pin
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Amber = farm location
const amberIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Blue = live GPS position dot
const liveGPSIcon = new L.DivIcon({
  html: `<div style="
    width:16px;height:16px;
    background:#3B82F6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 2px #3B82F6;
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: "",
});

function cn(...c: any[]) {
  return c.filter(Boolean).join(" ");
}

// Tap handler
function ClickHandler({ onTap }: { onTap: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onTap(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// Fly map to position
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 0.8 });
  }, [target]);
  return null;
}

// ── Types ───────────────────────────────────────────────────
interface LocationData {
  lat: number;
  lng: number;
  address: string;
  distance: number;
}

interface Props {
  farmLocation: { lat: number; lng: number };
  onLocationSelect: (data: LocationData) => void;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

// ── GPS states ──────────────────────────────────────────────
type GPSState = "idle" | "acquiring" | "locked" | "error";

const MapboxMapPicker = ({
  farmLocation,
  onLocationSelect,
  onClose,
  initialLat,
  initialLng,
}: Props) => {
  const startLat = initialLat || farmLocation.lat;
  const startLng = initialLng || farmLocation.lng;

  // Map state
  const [pinPos, setPinPos] = useState<[number, number]>([startLat, startLng]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // GPS state
  const [gpsState, setGpsState] = useState<GPSState>("idle");
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null); // metres
  const watchIdRef = useRef<number | null>(null);
  const isAutoFollowingRef = useRef<boolean>(false);
  const [isAutoFollowing, setIsAutoFollowing] = useState<boolean>(false);

  const setAutoFollow = (val: boolean) => {
    isAutoFollowingRef.current = val;
    setIsAutoFollowing(val);
  };

  // Search state
  const [token, setToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1. Token + initial reverse geocode ─────────────────────
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "mapbox_token")
      .maybeSingle()
      .then(({ data }) =>
        setToken(data?.value || import.meta.env.VITE_MAPBOX_TOKEN || null)
      );

    const d = calculateDistance(
      farmLocation.lat,
      farmLocation.lng,
      startLat,
      startLng
    );
    setDistance(d);
    doReverseGeocode(startLat, startLng);

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      // Stop GPS watch on unmount
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ── 2. Reverse geocode ──────────────────────────────────────
  const doReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      try {
        const t = token || import.meta.env.VITE_MAPBOX_TOKEN;
        if (t) {
          const r = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${t}&limit=3&types=address,poi,locality,place`
          );
          if (r.ok) {
            const d = await r.json();
            if (d.features?.length) {
              const priority = [
                "poi", "address", "neighborhood", "locality",
                "place", "postcode", "district", "region", "country",
              ];
              const sorted = [...d.features].sort(
                (a, b) =>
                  priority.indexOf(a.place_type[0]) -
                  priority.indexOf(b.place_type[0])
              );
              setAddress(
                sorted[0].place_name.replace(/^MDR\d+\b\s*,?\s*/i, "")
              );
              return;
            }
          }
        }
        // Nominatim fallback (free, no token needed)
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        if (r.ok) {
          const d = await r.json();
          setAddress(d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } else {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setIsGeocoding(false);
      }
    },
    [token]
  );

  // ── 3. Pin movement (tap or drag) ───────────────────────────
  const handlePinMove = useCallback(
    (lat: number, lng: number) => {
      setPinPos([lat, lng]);
      const dist = calculateDistance(
        farmLocation.lat,
        farmLocation.lng,
        lat,
        lng
      );
      setDistance(dist);
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeTimer.current = setTimeout(
        () => doReverseGeocode(lat, lng),
        500
      );
    },
    [farmLocation, doReverseGeocode]
  );

  // ── 4. Search ────────────────────────────────────────────────
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const t = token || import.meta.env.VITE_MAPBOX_TOKEN;
        if (t) {
          const r = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${t}&country=IN&limit=5`
          );
          const d = await r.json();
          setSearchResults(d.features || []);
        } else {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`,
            { headers: { "Accept-Language": "en" } }
          );
          const d = await r.json();
          setSearchResults(
            d.map((x: any) => ({
              id: x.place_id,
              place_name: x.display_name,
              center: [parseFloat(x.lon), parseFloat(x.lat)],
            }))
          );
        }
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSearchSelect = (result: any) => {
    const [lng, lat] = result.center;
    setSearchQuery(result.place_name?.split(",")[0] || "");
    setShowResults(false);
    setAutoFollow(false);
    setFlyTarget([lat, lng]);
    handlePinMove(lat, lng);
  };

  // ── 5. Live GPS with watchPosition ──────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported on this device", variant: "destructive" });
      return;
    }

    // If we're already tracked, just re-center and resume auto-following
    if (gpsState === "locked" && watchIdRef.current !== null) {
      if (gpsPos) {
        setFlyTarget(gpsPos);
        handlePinMove(gpsPos[0], gpsPos[1]);
      }
      setAutoFollow(true);
      return;
    }

    // Stop any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsState("acquiring");
    setGpsPos(null);
    setGpsAccuracy(null);
    setAutoFollow(true);

    let firstFix = true;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        setGpsPos([lat, lng]);
        setGpsAccuracy(accuracy);
        setGpsState("locked");

        // Continuously snap the pin to GPS location if auto-following
        if (firstFix || isAutoFollowingRef.current) {
          firstFix = false;
          setFlyTarget([lat, lng]);
          handlePinMove(lat, lng);
        }
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setGpsState("error");
        setAutoFollow(false);
        toast({
          title: "Location access denied",
          description: "Please allow location permission and try again.",
          variant: "destructive",
        });
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      {
        enableHighAccuracy: true, // Use actual GPS chip
        maximumAge: 0,            // Always fetch fresh — no cache
        timeout: 15000,           // 15 s timeout
      }
    );

    watchIdRef.current = watchId;
  };

  // Stop auto-following when user manually moves pin, but keep live GPS dot running
  const handleManualPinMove = (lat: number, lng: number) => {
    setAutoFollow(false);
    handlePinMove(lat, lng);
  };

  // ── 6. Confirm ───────────────────────────────────────────────
  const handleConfirm = () => {
    if (distance === null || distance > 50 || isGeocoding) return;
    onLocationSelect({ lat: pinPos[0], lng: pinPos[1], address, distance });
    onClose();
  };

  const outOfZone = (distance ?? 0) > 50;
  const isAcquiring = gpsState === "acquiring";

  // GPS button icon & color
  const GPSIcon = () => {
    if (isAcquiring) return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (gpsState === "locked") return <Crosshair className={cn("w-5 h-5", isAutoFollowing ? "text-blue-500" : "text-slate-500")} />;
    return <Navigation className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 overflow-hidden">
      <style>{`
        .leaflet-container { background: #e8e0d8; }
        .leaflet-control-zoom {
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
        }
        .leaflet-control-attribution { font-size: 8px !important; }
        .leaflet-top.leaflet-right { top: 10px !important; right: 10px !important; }

        /* GPS accuracy ring pulse */
        @keyframes gps-pulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .gps-ring { animation: gps-pulse 1.4s ease-out infinite; }
      `}</style>

      {/* ══ MAP ═══════════════════════════════════════════════════ */}
      <div className="relative flex-1 min-h-0">
        <MapContainer
          center={[startLat, startLng]}
          zoom={14}
          className="absolute inset-0 w-full h-full"
          zoomControl
          attributionControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            maxZoom={19}
            keepBuffer={1}
          />

          <ClickHandler onTap={handleManualPinMove} />
          <FlyTo target={flyTarget} />

          {/* Delivery pin — draggable green */}
          <Marker
            position={pinPos}
            icon={greenIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = (e.target as L.Marker).getLatLng();
                handleManualPinMove(lat, lng);
              },
            }}
          />

          {/* Farm marker — amber */}
          <Marker
            position={[farmLocation.lat, farmLocation.lng]}
            icon={amberIcon}
          />

          {/* Live GPS accuracy ring — shown while locked */}
          {gpsPos && gpsAccuracy && (
            <>
              {/* Accuracy radius circle */}
              <Circle
                center={gpsPos}
                radius={gpsAccuracy}
                pathOptions={{
                  color: "#3B82F6",
                  fillColor: "#3B82F6",
                  fillOpacity: 0.1,
                  weight: 1.5,
                  opacity: 0.5,
                }}
              />
              {/* GPS blue dot */}
              <Marker position={gpsPos} icon={liveGPSIcon} />
            </>
          )}
        </MapContainer>

        {/* ── Search bar ── */}
        <div className="absolute top-3 left-3 right-14 z-[500]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search address…"
              style={{ fontSize: "16px" }} // prevents iOS auto-zoom
              className="w-full h-11 pl-9 pr-8 rounded-2xl bg-white shadow-xl text-sm text-slate-800 placeholder-slate-400 outline-none border border-slate-100 focus:ring-2 focus:ring-primary"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onMouseDown={() => { setSearchQuery(""); setShowResults(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Suggestions */}
          {showResults && searchResults.length > 0 && (
            <div className="mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-44 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  type="button"
                  key={r.id || i}
                  onMouseDown={() => handleSearchSelect(r)}
                  className="w-full text-left px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-50 last:border-0 leading-snug flex items-start gap-2"
                >
                  <MapPin className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{r.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── GPS button ── */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={isAcquiring}
          title={
            gpsState === "locked"
              ? isAutoFollowing ? "Live tracking active" : "Re-center map to live location"
              : "Use my location"
          }
          className={cn(
            "absolute top-3 right-3 z-[500] w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all border",
            gpsState === "locked"
              ? isAutoFollowing ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"
              : "bg-white border-slate-100",
            isAcquiring && "opacity-70 cursor-not-allowed"
          )}
        >
          <GPSIcon />
        </button>

        {/* GPS accuracy info bar */}
        {gpsState === "locked" && gpsAccuracy && (
          <div className="absolute top-16 right-3 z-[500] bg-blue-600 text-white rounded-xl px-2.5 py-1 shadow-lg">
            <p className="text-[9px] font-black uppercase tracking-wider">
              ±{Math.round(gpsAccuracy)}m
            </p>
          </div>
        )}

        {/* Acquiring status */}
        {isAcquiring && (
          <div className="absolute top-16 right-3 z-[500] bg-blue-600 text-white rounded-xl px-2.5 py-1.5 shadow-lg flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-wider">Acquiring GPS…</p>
          </div>
        )}

        {/* Tap hint */}
        <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
          <span className="text-[9px] font-bold text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full uppercase tracking-wider">
            Tap map or drag pin
          </span>
        </div>
      </div>

      {/* ══ COMPACT BOTTOM PANEL ══════════════════════════════════ */}
      <div className="bg-[#1C2533] text-white flex-shrink-0 px-4 pt-2.5 pb-5 rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        {/* Drag handle */}
        <div className="w-9 h-1 bg-white/15 rounded-full mx-auto mb-3" />

        {/* Row 1 — title + distance + close */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-display text-lg font-black italic tracking-tight leading-none">
              Delivery Location
            </h2>
            {gpsState === "locked" && (
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                📍 Live GPS · ±{Math.round(gpsAccuracy || 0)}m accuracy
              </p>
            )}
            {isAcquiring && (
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Acquiring GPS signal…
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "text-2xl font-black italic tracking-tight",
                outOfZone ? "text-rose-400" : "text-primary"
              )}
            >
              {distance !== null ? `${distance.toFixed(1)} km` : "—"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 active:scale-95 transition-transform"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2 — address (2 lines max) */}
        <div className="flex items-start gap-2 mb-3 min-w-0">
          <MapPin
            className={cn(
              "w-3.5 h-3.5 shrink-0 mt-0.5",
              outOfZone ? "text-rose-400" : "text-primary"
            )}
          />
          <p className="text-[11px] text-white/60 font-medium line-clamp-2 flex-1 leading-snug">
            {isGeocoding
              ? "Resolving address…"
              : address || "Tap the map or use GPS to set your location"}
          </p>
          {isGeocoding && (
            <Loader2 className="w-3 h-3 text-white/30 animate-spin shrink-0 mt-0.5" />
          )}
        </div>

        {/* Row 3 — zone badge + confirm */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border flex-1 min-w-0",
              outOfZone
                ? "bg-rose-500/10 border-rose-500/20"
                : "bg-emerald-500/10 border-emerald-500/20"
            )}
          >
            {outOfZone ? (
              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
            <p
              className={cn(
                "text-[9px] font-black uppercase tracking-wider italic truncate",
                outOfZone ? "text-rose-400" : "text-emerald-400"
              )}
            >
              {outOfZone ? "Outside 50 km delivery zone" : "Within delivery zone"}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={distance === null || outOfZone || isGeocoding || isAcquiring}
            className={cn(
              "h-10 px-5 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all duration-150 shrink-0",
              outOfZone || distance === null || isGeocoding || isAcquiring
                ? "bg-slate-700 opacity-40 text-white cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            {isGeocoding || isAcquiring ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Confirm
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapboxMapPicker;