// api/recommendations/rank.js
// Secure Server-Side Gemini AI Ranking Endpoint for Product Recommendations
// Uses process.env.GEMINI_API_KEY securely on the server.

import { GoogleGenerativeAI } from '@google/generative-ai';

function getApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.split(',')[0].trim();
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { currentCart = [], candidates = [], limit = 3 } = req.body || {};

  if (!candidates || candidates.length === 0) {
    return res.status(200).json({ recommendations: [], isAiRanked: false });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Rank API] No GEMINI_API_KEY configured. Returning candidates.');
    return res.status(200).json({ 
      recommendations: candidates.slice(0, limit), 
      isAiRanked: false 
    });
  }

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512
      }
    });

    const cartSummary = currentCart.map(i => i.name).join(', ');
    const candidateFacts = candidates.map(c => ({
      product_id: c.id,
      name: c.name,
      co_purchase_count: c.coPurchaseCount || 0,
      basket_match_count: c.basketMatchCount || 0,
      user_purchase_count: c.userPurchaseCount || 0,
      confidence_score: Number(c.finalScore.toFixed(2)),
      has_user_bought_before: c.hasUserBoughtBefore || false
    }));

    const prompt = `You are the AI Recommendation Ranking Engine for MM Dairy Farm.
Customer's Current Basket: [${cartSummary}]
Database Verified Candidate Products with Historical Evidence:
${JSON.stringify(candidateFacts, null, 2)}

Instructions:
1. Select ONLY candidate products that have strong historical evidence (co_purchase_count > 0 OR basket_match_count > 0 OR has_user_bought_before == true).
2. Rank them by relevance. Reject any product with weak evidence.
3. For each selected candidate, output a short, TRUTHFUL explanation based strictly on the provided facts:
   - If has_user_bought_before is true -> reason_type: "personal_history", reason: "You've purchased this product before"
   - Else if basket_match_count > 0 -> reason_type: "basket_combination", reason: "Often added when these items are ordered together"
   - Else if co_purchase_count > 0 -> reason_type: "frequently_bought_together", reason: "Frequently purchased together with your order"
   - Else -> reason_type: "popular", reason: "Popular with customers"

Return ONLY valid JSON matching this structure:
{
  "recommendations": [
    {
      "product_id": "EXACT_CANDIDATE_ID",
      "confidence": 0.88,
      "reason_type": "frequently_bought_together",
      "reason": "Frequently purchased together with your order"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON from Gemini AI');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const rawRecommendations = parsed.recommendations || [];

    // Filter to ensure every AI-ranked ID strictly exists in our candidate array
    const verifiedRecommendations = [];
    const seenIds = new Set();

    for (const rec of rawRecommendations) {
      const candidateObj = candidates.find(c => c.id === rec.product_id);
      if (candidateObj && !seenIds.has(candidateObj.id)) {
        seenIds.add(candidateObj.id);
        verifiedRecommendations.push({
          ...candidateObj,
          contextualReason: rec.reason || candidateObj.contextualReason,
          reasonType: rec.reason_type || candidateObj.reasonType,
          confidence: rec.confidence || candidateObj.finalScore
        });
      }
    }

    return res.status(200).json({
      recommendations: verifiedRecommendations.slice(0, limit),
      isAiRanked: true
    });

  } catch (err) {
    console.warn('[Rank API Fallback]', err.message);
    return res.status(200).json({
      recommendations: candidates.slice(0, limit),
      isAiRanked: false
    });
  }
}
