// api/ai/tools/definitions.js
// Gemini tool definitions for MM Dairy Farm AI Agent.

export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name:        "getWebsiteInfo",
        description: "Fetches current business details, contact info, delivery areas, and product price lists of MM Dairy Farm.",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  }
];
