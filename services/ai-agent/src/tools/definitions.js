// ai-agent/src/tools/definitions.js
// Tool/function definitions in Google Gemini's function-calling format.
// Gemini reads these descriptions to decide WHEN and HOW to call each function.

export const TOOL_DEFINITIONS = [
  {
    name: 'getOrders',
    description:
      'Fetches all orders placed by this user, sorted newest-first. ' +
      'Call this when the user asks about their order history, past purchases, ' +
      '"my orders", "recent orders", "show me all my orders", or any question ' +
      'that needs a list of their orders. Also use when referencing order by position ' +
      'like "my second order" or "latest order".',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: "The authenticated user's UUID from Supabase auth.users"
        },
        limit: {
          type: 'number',
          description: 'Max orders to return. Default 10, max 50.'
        }
      },
      required: ['userId']
    }
  },

  {
    name: 'getOrderByIndex',
    description:
      'Fetches one specific order by its position in the user\'s order history. ' +
      'Index 1 = most recent, 2 = second most recent, etc. ' +
      'Use when user says "my first order", "my 3rd order", "last order", ' +
      '"latest", "most recent order", "second purchase", etc.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: "The user's UUID"
        },
        index: {
          type: 'number',
          description: 'Position in history: 1 = newest, 2 = second newest, etc.'
        }
      },
      required: ['userId', 'index']
    }
  },

  {
    name: 'getOrderById',
    description:
      'Fetches one specific order by its exact UUID. ' +
      'Use when the user provides a specific order ID.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: "The user's UUID (for ownership validation)"
        },
        orderId: {
          type: 'string',
          description: 'The exact UUID of the order'
        }
      },
      required: ['userId', 'orderId']
    }
  },

  {
    name: 'getProducts',
    description:
      'Fetches all active products available in the MM Dairy Farm store. ' +
      'Returns names, descriptions, prices, and units. ' +
      'Use when user asks about available products, prices, what is for sale, ' +
      '"what milk do you have", "do you sell ghee", "show me your products", etc.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'getUserProfile',
    description:
      "Fetches the user's saved profile: full name, phone, delivery address, and reward coins. " +
      'Use when user asks about their account details, saved address, or profile information.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: "The user's UUID"
        }
      },
      required: ['userId']
    }
  },

  {
    name: 'getWebsiteInfo',
    description:
      'Returns structured information about the MM Dairy Farm business: ' +
      'delivery areas, timing, payment methods and fees, subscription details, ' +
      'return policy, and contact info. ' +
      'Use for any question about delivery, payment options, how the website works, ' +
      'or general business information.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'searchOrdersByProduct',
    description:
      "Searches the user's entire order history for orders containing a specific product. " +
      'Use when user asks "did I ever order X?", "when did I last buy milk?", ' +
      '"have I ordered ghee before?", "did I buy buffalo milk last time?".',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: "The user's UUID"
        },
        productName: {
          type: 'string',
          description: 'Product name or partial name to search (e.g. "milk", "ghee", "curd")'
        }
      },
      required: ['userId', 'productName']
    }
  }
];

// Gemini expects tools wrapped in this format
export const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOL_DEFINITIONS
  }
];
