// src/services/recommendationAnalytics.ts
// In-Memory & LocalStorage Telemetry Tracker for Recommendation CTR & Conversions

export interface RecommendationEvent {
  eventType: "shown" | "clicked" | "added_to_cart" | "purchased";
  productId: string;
  productName: string;
  reason?: string;
  score?: number;
  userId?: string | null;
  timestamp?: string;
}

const LOCAL_STORAGE_ANALYTICS_KEY = "mm_recommendation_analytics_v1";

// Load initial events from localStorage safely
function loadEvents(): RecommendationEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

const localEvents: RecommendationEvent[] = loadEvents();

/**
 * Log a recommendation analytics event locally without network 404s.
 */
export async function trackRecommendationEvent(event: RecommendationEvent): Promise<void> {
  const payload: RecommendationEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString()
  };

  localEvents.push(payload);
  
  // Cap local storage event history to last 200 events
  if (localEvents.length > 200) {
    localEvents.shift();
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_ANALYTICS_KEY, JSON.stringify(localEvents));
  } catch (_e) {}
}

/**
 * Returns aggregated CTR metrics for analytics dashboard.
 */
export function getRecommendationMetrics() {
  const shown = localEvents.filter(e => e.eventType === "shown").length;
  const clicked = localEvents.filter(e => e.eventType === "clicked").length;
  const added = localEvents.filter(e => e.eventType === "added_to_cart").length;
  const purchased = localEvents.filter(e => e.eventType === "purchased").length;

  return {
    shown,
    clicked,
    addedToCart: added,
    purchased,
    ctr: shown > 0 ? (clicked / shown) * 100 : 0,
    addToCartRate: shown > 0 ? (added / shown) * 100 : 0,
    conversionRate: shown > 0 ? (purchased / shown) * 100 : 0
  };
}
