// api/ai/tools/definitions.js
// Gemini tool definitions for MM Dairy Farm AI Agent.

export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name:        "getWebsiteInfo",
        description: "Fetches core business identity and basic contact links for MM Dairy Farm.",
        parameters: { type: "object", properties: {}, required: [] }
      },
      {
        name:        "getProducts",
        description: "Fetches the current list of available products, real-time prices, and stock status from the database.",
        parameters: { type: "object", properties: {}, required: [] }
      },
      {
        name:        "getAppSettings",
        description: "Fetches global business settings like delivery ranges, contact numbers, and operation timings from the database.",
        parameters: { type: "object", properties: {}, required: [] }
      }
    ]
  }
];
