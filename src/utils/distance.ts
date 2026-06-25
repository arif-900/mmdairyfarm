/** 
 * Centralized Logistics & Distance Utilities for MMVALI Dairy Farm
 */

// Official Farm Coordinates (Bhanakacherla, AP)
export const FARM_LOCATION = {
  lat: 15.8022,
  lng: 78.5356,
  address: "Bhanakacherla, Bhanumukkala, Andhra Pradesh 518422"
};

export const MAX_DELIVERY_DISTANCE_KM = 50;

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
 * Standardizes shipping fee calculation across the platform.
 */
export const calculateShippingFee = (distanceKm: number): number => {
  if (distanceKm === null || isNaN(distanceKm)) return 0;
  if (distanceKm <= 5) return 0;
  if (distanceKm <= 10) return 30;
  if (distanceKm <= 20) return 50;
  if (distanceKm <= 50) return 100;
  return -1; // Forbidden
};
