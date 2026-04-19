/**
 * Utility function to calculate the maximum delivery days based on cart items.
 * If any product has 0 days, it is treated as same-day.
 * If deliveryDays is missing or undefined, it defaults to 3 days.
 */
/**
 * Safely resolves delivery_days from any product/item object.
 * Returns the admin-defined value if it is a valid non-negative number.
 * Falls back to `defaultDays` (default: 3) ONLY when the value is null or undefined.
 */
export const resolveDeliveryDays = (
  days: number | null | undefined,
  defaultDays = 3
): number => {
  if (days === null || days === undefined) return defaultDays;
  const n = Number(days);
  return isNaN(n) || n < 0 ? defaultDays : n;
};

export const getMaxDeliveryDays = (items: any[]): number => {
  if (!items || items.length === 0) return 0;

  const leadTimes = items.map(item => {
    // Support both camelCase (frontend) and snake_case (DB/edge-function) shapes
    const raw = item.deliveryDays !== undefined ? item.deliveryDays : item.delivery_days;
    return resolveDeliveryDays(raw);
  });

  return Math.max(...leadTimes);
};

/**
 * Calculates the expected delivery date based on current time and delivery days.
 */
export const getExpectedDeliveryDate = (deliveryDays: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + deliveryDays);
  return date;
};

/**
 * Returns a normalized date at midnight local time — avoids timezone comparison bugs.
 */
const normalizeToMidnight = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * getDeliveryMessage
 *
 * Given an expected delivery date (string | Date | null), returns a friendly
 * UI message that auto-updates based on the current date each render.
 *
 * Returns:
 *   null                             — date is missing / invalid
 *   "✅ Delivered"
 *   "🚚 Delivering Today"
 *   "🚚 Delivering Tomorrow"
 *   "🚚 Delivering in X days"
 *   "📦 Expected delivery: Apr 12"
 *
 * Timezone note: both dates are normalised to midnight local time so that
 * a 3 PM UTC timestamp and a 6 AM local render never produce off-by-one errors.
 */
export const getDeliveryMessage = (
  expectedDate: string | Date | null | undefined,
  orderStatus?: string
): string | null => {
  if (!expectedDate) return null;

  let date: Date;
  try {
    date = typeof expectedDate === "string" ? new Date(expectedDate) : expectedDate;
    if (isNaN(date.getTime())) return null;
  } catch {
    return null;
  }

  // Short-circuit: delivery partner already confirmed delivery or order cancelled
  if (orderStatus === "delivered") return "✅ Delivered";
  if (orderStatus === "cancelled") return "❌ Cancelled";

  const today = normalizeToMidnight(new Date());
  const target = normalizeToMidnight(date);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "✅ Delivered";
  if (diffDays === 0) return "🚚 Delivering Today";
  if (diffDays === 1) return "🚚 Delivering Tomorrow";
  if (diffDays <= 6) return `🚚 Delivering in ${diffDays} days`;

  // More than 6 days away — show a readable date
  const label = target.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `📦 Expected delivery: ${label}`;
};
