// src/services/aiRecommendationService.ts
// Client AI Service Layer for Product Recommendation System
// Connects to secure server-side endpoint /api/recommendations/rank with 1.5s timeout fallback.

import { CandidateProduct, RecommendationRequest, generateDeterministicRecommendations } from "./recommendationEngine";

const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || "/api";

export interface PersonalizedRecommendationResult {
  recommendations: CandidateProduct[];
  isAiRanked: boolean;
}

/**
 * Gets high-confidence personalized recommendations, evaluated by Gemini AI ranking endpoint if available.
 */
export async function getPersonalizedRecommendations(
  req: RecommendationRequest
): Promise<PersonalizedRecommendationResult> {
  // Step 1: Generate candidates grounded in real database evidence
  const candidates = await generateDeterministicRecommendations(req);

  if (candidates.length === 0) {
    return { recommendations: [], isAiRanked: false };
  }

  // Set strict 1.5-second timeout cap to keep checkout lightning fast
  const timeoutMs = 1500;

  const aiRankPromise = (async (): Promise<PersonalizedRecommendationResult> => {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? (window.location.origin + (AI_AGENT_URL.startsWith('/') ? AI_AGENT_URL : `/${AI_AGENT_URL}`))
        : 'http://localhost:5001/api';
        
      const rankEndpoint = `${baseUrl.replace(/\/chat$/, '')}/recommendations/rank`;

      const res = await fetch(rankEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCart: req.cartItems,
          candidates,
          limit: req.limit || 3,
          userId: req.userId
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      const recs: CandidateProduct[] = data?.recommendations || [];

      if (!Array.isArray(recs) || recs.length === 0) {
        return { recommendations: candidates.slice(0, req.limit || 3), isAiRanked: false };
      }

      return {
        recommendations: recs.slice(0, req.limit || 3),
        isAiRanked: data?.isAiRanked ?? true
      };

    } catch (err) {
      console.debug("[AIRecommendationService] Server AI ranking skipped, returning deterministic DB candidates:", (err as Error).message);
      return { recommendations: candidates.slice(0, req.limit || 3), isAiRanked: false };
    }
  })();

  // Race promise against timeout
  const timeoutPromise = new Promise<PersonalizedRecommendationResult>(resolve => {
    setTimeout(() => {
      resolve({ recommendations: candidates.slice(0, req.limit || 3), isAiRanked: false });
    }, timeoutMs);
  });

  return Promise.race([aiRankPromise, timeoutPromise]);
}
