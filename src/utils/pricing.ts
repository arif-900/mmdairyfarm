/**
 * Calculates the price of a product based on its weight and base price per 1000g.
 * 
 * @param basePricePerKg - The price of 1000g (1kg) of the product
 * @param weightInGrams - The selected weight in grams
 * @returns The calculated price rounded to the nearest integer
 */
export function calculatePrice(basePricePerKg: number, weightInGrams: number): number {
  if (!basePricePerKg || !weightInGrams) return 0;
  
  // Linear calculation: (Price / 1000) * Selected Weight
  const calculated = (basePricePerKg / 1000) * weightInGrams;
  
  // Return rounded to nearest integer as ₹ is usually whole numbers in this context
  return Math.round(calculated);
}

/**
 * Formats a weight or volume value with its appropriate unit.
 * 
 * @param value - The value in grams or milliliters
 * @param unitType - The base unit type ("g" or "ml")
 * @returns Formatted string (e.g., "500g", "1kg", "500ml", "1L")
 */
export function formatWeight(value: number, unitType: "g" | "ml" = "g"): string {
  if (value >= 1000) {
    const formattedValue = value / 1000;
    const unit = unitType === "ml" ? "L" : "kg";
    return `${formattedValue}${unit}`;
  }
  return `${value}${unitType}`;
}
