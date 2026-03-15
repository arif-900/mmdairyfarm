import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertCircle, Home as HomeIcon, Map as MapIcon, Navigation2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    geocodeTimeout: NodeJS.Timeout;
  }
}

// Dairy farm coordinates (Bhanakacherla, Bhanumukkala, Andhra Pradesh 518422)
const FARM_LOCATION = {
  lat: 15.8547,
  lng: 78.5947,
  address: "Bhanakacherla, Bhanumukkala, Andhra Pradesh 518422"
};

const MAX_DELIVERY_DISTANCE_KM = 65;

interface AddressInputProps {
  value: string;
  onChange: (address: string, distance: number | null) => void;
  onDistanceError: (error: string | null) => void;
  disabled?: boolean;
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const AddressInput = ({ value, onChange, onDistanceError, disabled }: AddressInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  
  // Structured fields
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [distanceType, setDistanceType] = useState<"road" | "direct" | null>(null);

  // Handle formatted address update
  useEffect(() => {
    if (baseAddress) {
      const fullAddress = [houseNo, landmark, baseAddress].filter(Boolean).join(", ");
      onChange(fullAddress, distance);
    }
  }, [houseNo, landmark, baseAddress, distance, onChange]);

  const verifyAddress = async (addressToVerify: string) => {
    if (!mapsLoaded) {
      onDistanceError(null);
      return;
    }

    try {
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      setIsVerifying(true);
      onDistanceError("Verifying delivery location...");

      // Enhance query for better local accuracy
      const query = addressToVerify.toLowerCase().includes('andhra pradesh') 
        ? addressToVerify 
        : `${addressToVerify}, Andhra Pradesh, India`;

      geocoder.geocode({ address: query }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]?.geometry?.location) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          const service = new google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: [{ lat: FARM_LOCATION.lat, lng: FARM_LOCATION.lng }],
              destinations: [{ lat, lng }],
              travelMode: google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC,
            },
            (dmResult: any, dmStatus: any) => {
              setIsVerifying(false);
              let calculatedDistance: number;
              if (dmStatus === 'OK' && dmResult?.rows?.[0]?.elements?.[0]?.status === 'OK') {
                calculatedDistance = dmResult.rows[0].elements[0].distance.value / 1000;
                setDistanceType("road");
              } else {
                calculatedDistance = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, lat, lng);
                setDistanceType("direct");
              }

              setDistance(calculatedDistance);
              if (calculatedDistance > MAX_DELIVERY_DISTANCE_KM) {
                onDistanceError(`Delivery radius exceeded: We serve locations within 65km. Your address is approx. ${calculatedDistance.toFixed(1)}km away.`);
              } else {
                onDistanceError(null);
              }
            }
          );
        } else {
          setIsVerifying(false);
          onDistanceError('Address verification failed. Please try a more specific location.');
        }
      });
    } catch (error) {
      setIsVerifying(false);
      onDistanceError('Verification service unavailable.');
    }
  };

  // Sync from parent value if it changes externally
  useEffect(() => {
    if (value) {
      const combined = [houseNo, landmark, baseAddress].filter(Boolean).join(", ");
      if (value !== combined) {
        const parts = value.split(", ");
        if (parts.length >= 3) {
          setHouseNo(parts[0]);
          setLandmark(parts[1]);
          const newBase = parts.slice(2).join(", ");
          setBaseAddress(newBase);
          if (mapsLoaded) verifyAddress(newBase);
        } else {
          setBaseAddress(value);
          if (mapsLoaded) verifyAddress(value);
        }
      }
    }
  }, [value, mapsLoaded]); // Sync external changes

  // Handle formatted address update
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API key not found");
      setManualMode(true);
      return;
    }

    const script = document.createElement("script");
    // Standard loading without async parameter to ensure libraries are ready on onload
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,distance_matrix&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Small delay to ensure internal initialization is complete
      const checkPlaces = () => {
        if ((window as any).google?.maps?.places) {
          setMapsLoaded(true);
        } else {
          setTimeout(checkPlaces, 100);
        }
      };
      checkPlaces();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps");
      setManualMode(true);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script) && !mapsLoaded) {
        document.head.removeChild(script);
      }
    };
  }, [mapsLoaded]);

  // Handle formatted address update
  useEffect(() => {
    if (baseAddress) {
      const fullAddress = [houseNo, landmark, baseAddress].filter(Boolean).join(", ");
      onChange(fullAddress, distance);
    }
  }, [houseNo, landmark, baseAddress, distance, onChange]);

  // Initialize autocomplete when maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || manualMode) return;

    const initAutocomplete = () => {
      try {
        const google = (window as any).google;

        if (!google?.maps?.places) {
          setTimeout(initAutocomplete, 100);
          return;
        }

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "IN" },
          fields: ["formatted_address", "geometry", "address_components", "name"],
          types: ["geocode"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.geometry?.location && place.formatted_address) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            setIsVerifying(true);

            // Try Distance Matrix API for road distance first
            const google = (window as any).google;
            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix(
              {
                origins: [{ lat: FARM_LOCATION.lat, lng: FARM_LOCATION.lng }],
                destinations: [{ lat, lng }],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
              },
              (result: any, status: any) => {
                setIsVerifying(false);
                let calculatedDistance: number;
                if (status === 'OK' && result?.rows?.[0]?.elements?.[0]?.status === 'OK') {
                  calculatedDistance = result.rows[0].elements[0].distance.value / 1000;
                } else {
                  calculatedDistance = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, lat, lng);
                }

                setDistance(calculatedDistance);
                setDistanceType(status === 'OK' ? "road" : "direct");
                setBaseAddress(place.formatted_address);

                if (calculatedDistance > MAX_DELIVERY_DISTANCE_KM) {
                  onDistanceError(`Delivery radius exceeded: We serve locations within 65km. Your address is approx. ${calculatedDistance.toFixed(1)}km away.`);
                } else {
                  onDistanceError(null);
                }
              }
            );
          }
        });
      } catch (error) {
        console.error("Error initializing Google Places:", error);
        setManualMode(true);
      }
    };

    initAutocomplete();
  }, [mapsLoaded, onDistanceError, manualMode]);

  const handleManualChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setBaseAddress(newValue);
    setDistance(null);
    
    if (newValue.length > 0) {
      if (mapsLoaded) {
        onDistanceError("Verifying address...");
      } else {
        // Fallback for missing API key: allow manual entry but with a note
        onDistanceError(null); 
        console.warn("Manual entry: Distance verification requires an API key.");
      }
    } else {
      onDistanceError(null);
    }

    if (newValue.length > 3 && mapsLoaded) {
      if (window.geocodeTimeout) clearTimeout(window.geocodeTimeout);
      window.geocodeTimeout = setTimeout(() => verifyAddress(newValue), 1200);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onDistanceError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const calculatedDistance = calculateDistance(FARM_LOCATION.lat, FARM_LOCATION.lng, latitude, longitude);

        setDistance(calculatedDistance);

        if (calculatedDistance > MAX_DELIVERY_DISTANCE_KM) {
          onDistanceError(`Delivery radius exceeded: We serve locations within 65km. Your address is approx. ${calculatedDistance.toFixed(1)}km away.`);
        } else {
          onDistanceError(null);
        }

        const google = (window as any).google;
        if (mapsLoaded && google) {
          try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            if (response.results[0]) {
              setBaseAddress(response.results[0].formatted_address);
            }
          } catch (error) {
            setBaseAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } else {
          setBaseAddress(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
        }
        setIsLoading(false);
      },
      (error) => {
        onDistanceError("Unable to get your location. Please search for your village/city manually.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Base Location */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="address" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-primary" />
            1. Search Village, City or Area *
          </Label>
          {distance !== null && distance <= MAX_DELIVERY_DISTANCE_KM && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 animate-in fade-in zoom-in duration-300">
              Verified: {distance.toFixed(1)} km {distanceType === 'road' ? '(by road)' : '(direct)'}
            </Badge>
          )}
          {!mapsLoaded && baseAddress && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Verification Offline
            </Badge>
          )}
        </div>

        <div className="relative group">
          <Input
            ref={inputRef}
            id="address"
            type="text"
            placeholder={mapsLoaded && !manualMode ? "Enter Village, City or Landmark..." : "Enter your location..."}
            value={baseAddress}
            onChange={handleManualChange}
            disabled={disabled || isLoading}
            className={cn(
              "h-12 pl-4 pr-32 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 transition-all",
              distance !== null && distance <= MAX_DELIVERY_DISTANCE_KM && "border-emerald-500 bg-emerald-50/30"
            )}
            required
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1">
            {(isLoading || isVerifying) && (
              <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 px-3 rounded-lg text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
              onClick={handleUseCurrentLocation}
              disabled={disabled || isLoading || isVerifying}
            >
              <Navigation2 className="w-3.5 h-3.5" />
              Locate
            </Button>
          </div>
        </div>
      </div>

      {/* Step 2: Delivery Details */}
      {(baseAddress || distance !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="space-y-2">
            <Label htmlFor="houseNo" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <HomeIcon className="w-4 h-4 text-slate-400" />
              House / Flat No. *
            </Label>
            <Input
              id="houseNo"
              placeholder="e.g. 4-12/A or Flat 102"
              value={houseNo}
              onChange={(e) => setHouseNo(e.target.value)}
              className="h-11 rounded-xl bg-white border-slate-200 shadow-sm transition-all focus:border-primary/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landmark" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Nearby Landmark
            </Label>
            <Input
              id="landmark"
              placeholder="e.g. Near Ram Temple"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="h-11 rounded-xl bg-white border-slate-200 shadow-sm transition-all focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {/* Verification Status */}
      {distance !== null && distance > MAX_DELIVERY_DISTANCE_KM && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in shake-in duration-500">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700">Delivery Unavailable</p>
            <p className="text-xs text-rose-600/80 leading-relaxed">
              We serve locations within 65km of our farm. Your location is {distance.toFixed(1)}km away. Please try another address.
            </p>
          </div>
        </div>
      )}

      {!baseAddress && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-blue-700/70 leading-relaxed italic">
            Pick your village or city above. We'll verify the distance from our farm in Bhanumukkala automatically!
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
