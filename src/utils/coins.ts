/**
 * Centralized Single Source of Truth for MM Dairy Farm Coins / Reward System
 * 
 * BUSINESS RULE:
 * 4 Coins = ₹1
 * 1 Coin  = ₹0.25 (25 Paise)
 */

export const COINS_PER_RUPEE = 4;
export const PAISE_PER_COIN = 25; // 25 Paise
export const RUPEES_PER_COIN = 0.25;

/**
 * Converts a coin amount to exact Rupee value.
 * Example: 400 coins -> ₹100; 40 coins -> ₹10; 5 coins -> ₹1.25
 */
export const coinsToRupees = (coins: number): number => {
  if (!coins || coins <= 0) return 0;
  const paise = coins * PAISE_PER_COIN;
  return paise / 100;
};

/**
 * Converts a coin amount to exact Paise (1 Rupee = 100 Paise).
 * Example: 40 coins -> 1000 paise (₹10)
 */
export const coinsToPaise = (coins: number): number => {
  if (!coins || coins <= 0) return 0;
  return Math.floor(coins * PAISE_PER_COIN);
};

/**
 * Converts a Rupee amount to Coins.
 * Example: ₹100 -> 400 coins; ₹10 -> 40 coins
 */
export const rupeesToCoins = (rupees: number): number => {
  if (!rupees || rupees <= 0) return 0;
  return Math.floor(rupees * COINS_PER_RUPEE);
};

/**
 * Formats a coin amount for standard UI presentation.
 * Example: 400 -> "400 Coins"
 */
export const formatCoinValue = (coins: number): string => {
  const safeCoins = Math.max(0, Math.floor(coins || 0));
  return `${safeCoins} Coins`;
};

/**
 * Formats a coin count.
 * Example: 400 -> "400 Coins"
 */
export const formatCoins = (coins: number): string => {
  const safeCoins = Math.max(0, Math.floor(coins || 0));
  return `${safeCoins} Coins`;
};

/**
 * Calculates the maximum coins that can be redeemed for a given order amount.
 * Prevents negative balances and ensures coins used do not exceed payable subtotal.
 */
export const calculateMaxCoinDiscount = (
  availableCoins: number,
  orderTotalRupees: number
): { coinsToUse: number; discountRupees: number } => {
  const safeCoins = Math.max(0, Math.floor(availableCoins || 0));
  const safeTotalRupees = Math.max(0, orderTotalRupees || 0);

  const maxCoinsNeededForTotal = rupeesToCoins(safeTotalRupees);
  const coinsToUse = Math.min(safeCoins, maxCoinsNeededForTotal);
  const discountRupees = coinsToRupees(coinsToUse);

  return {
    coinsToUse,
    discountRupees,
  };
};
