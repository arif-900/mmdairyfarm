/** 
 * Centralized Logistics, Distance & Delivery Fee Engine for MMVALI Dairy Farm
 */

// Official Farm Coordinates (Bhanakacherla, AP)
export const FARM_LOCATION = {
  lat: 15.8022,
  lng: 78.5356,
  address: "Bhanakacherla, Bhanumukkala, Andhra Pradesh 518422"
};

// Delivery Rule Constants (Single Source of Truth)
export const FREE_DELIVERY_ORDER_THRESHOLD = 1000;
export const FREE_DELIVERY_DISTANCE_KM = 10;
export const DELIVERY_FEE_OUTSIDE_DISTANCE = 50;
export const MAX_DELIVERY_DISTANCE_KM = 50;

export interface DeliveryFeeDetails {
  deliveryFee: number; // 0, 50, or -1 (outside service area)
  isFreeDelivery: boolean;
  freeDeliveryReason: "ORDER_VALUE" | "DISTANCE" | null;
  distanceKm: number | null;
  amountNeededForFreeDelivery: number; // Rupee gap to unlock ₹1,000 threshold
}

/**
 * Calculates the Haversine distance between two sets of coordinates in Kilometers.
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Rounded to 1 decimal place
};

/**
 * Authoritative Delivery Fee Calculation Engine.
 * 
 * PRIORITY EVALUATION HIERARCHY:
 * 1. PRIORITY #1 — ORDER VALUE: Order Amount >= ₹1,000 -> FREE DELIVERY (₹0) [Evaluated ALWAYS FIRST]
 * 2. PRIORITY #2 — DISTANCE: Evaluated ONLY when Order Amount < ₹1,000:
 *    - Distance < 10 KM -> FREE DELIVERY (₹0) (e.g. 9.99 KM is FREE)
 *    - Distance >= 10 KM -> ₹50 DELIVERY FEE (e.g. 10.00 KM is ₹50)
 * 3. Distance > 50 KM -> Outside Service Area (-1)
 */
export const calculateDeliveryFeeDetails = (
  distanceKm: number | null,
  orderAmount: number = 0
): DeliveryFeeDetails => {
  const safeAmount = Math.max(0, orderAmount || 0);
  const amountNeeded = Math.max(0, FREE_DELIVERY_ORDER_THRESHOLD - safeAmount);

  // PRIORITY #1 — ORDER VALUE (ALWAYS EVALUATED FIRST)
  if (safeAmount >= FREE_DELIVERY_ORDER_THRESHOLD) {
    return {
      deliveryFee: 0,
      isFreeDelivery: true,
      freeDeliveryReason: "ORDER_VALUE",
      distanceKm: distanceKm ?? 0,
      amountNeededForFreeDelivery: 0,
    };
  }

  // Check maximum serviceability limit (> 50 KM)
  if (distanceKm !== null && !isNaN(distanceKm) && distanceKm > MAX_DELIVERY_DISTANCE_KM) {
    return {
      deliveryFee: -1,
      isFreeDelivery: false,
      freeDeliveryReason: null,
      distanceKm,
      amountNeededForFreeDelivery: amountNeeded,
    };
  }

  // PRIORITY #2 — DISTANCE (ONLY EVALUATED WHEN ORDER AMOUNT < ₹1,000)
  // Boundary: Strictly < 10 KM is FREE; >= 10 KM is ₹50
  if (distanceKm !== null && !isNaN(distanceKm) && distanceKm < FREE_DELIVERY_DISTANCE_KM) {
    return {
      deliveryFee: 0,
      isFreeDelivery: true,
      freeDeliveryReason: "DISTANCE",
      distanceKm,
      amountNeededForFreeDelivery: 0,
    };
  }

  // Otherwise (distance >= 10 KM and order < 1000)
  return {
    deliveryFee: DELIVERY_FEE_OUTSIDE_DISTANCE,
    isFreeDelivery: false,
    freeDeliveryReason: null,
    distanceKm: distanceKm ?? null,
    amountNeededForFreeDelivery: amountNeeded,
  };
};

/**
 * Standardizes shipping fee calculation (returns fee in Rupees, or -1 if outside area).
 */
export const calculateShippingFee = (distanceKm: number, orderAmount: number = 0): number => {
  return calculateDeliveryFeeDetails(distanceKm, orderAmount).deliveryFee;
};
